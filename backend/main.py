import asyncio
import io
import os
import time

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse
from starlette.concurrency import run_in_threadpool
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

app = FastAPI(title="XRay Pneumonia Detector API", default_response_class=ORJSONResponse)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
INFERENCE_MAX_IMAGE_BYTES = int(os.getenv("INFERENCE_MAX_IMAGE_BYTES", str(6 * 1024 * 1024)))
INFERENCE_CONCURRENCY = int(os.getenv("INFERENCE_CONCURRENCY", "2" if device.type == "cuda" else "1"))
DEFAULT_PNEUMONIA_THRESHOLD = float(os.getenv("PNEUMONIA_THRESHOLD", "0.5"))
inference_semaphore = asyncio.Semaphore(INFERENCE_CONCURRENCY)
class_names = ["NORMAL", "PNEUMONIA"]
pneumonia_threshold = DEFAULT_PNEUMONIA_THRESHOLD
pneumonia_class_index = 1
transform = None
loaded_model_path = ""


def _predict_tensor(img_tensor: torch.Tensor):
    # Keep model inference in a worker thread to avoid blocking the async event loop.
    with torch.inference_mode():
        outputs = model(img_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
    return probabilities, confidence, predicted

# Model loading on startup
@app.on_event("startup")
async def load_model():
    global model, class_names, pneumonia_threshold, pneumonia_class_index, transform, loaded_model_path
    if device.type == "cpu":
        cpu_threads = int(os.getenv("TORCH_NUM_THREADS", "2"))
        torch.set_num_threads(cpu_threads)
    else:
        torch.backends.cudnn.benchmark = True

    # Define model architecture exactly as trained
    model = models.resnet18(weights=None)
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(num_features, 256),
        nn.ReLU(),
        nn.Dropout(0.5),
        nn.Linear(256, 2)
    )
    
    # Load checkpoint. Prefer full package checkpoint if available.
    model_path = os.getenv(
        "MODEL_PATH",
        os.path.join(os.path.dirname(__file__), "models", "pneumonia_model_full.pt")
    )
    if not os.path.exists(model_path):
        model_path = os.path.join(os.path.dirname(__file__), "models", "resnet18_pneumonia_best_finetuned.pth")

    loaded_model_path = model_path

    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'] if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint else checkpoint)

    if isinstance(checkpoint, dict):
        if isinstance(checkpoint.get("class_names"), list) and len(checkpoint["class_names"]) == 2:
            class_names = checkpoint["class_names"]
        checkpoint_threshold = checkpoint.get("decision_threshold")
        if checkpoint_threshold is not None:
            try:
                pneumonia_threshold = float(checkpoint_threshold)
            except (TypeError, ValueError):
                pneumonia_threshold = DEFAULT_PNEUMONIA_THRESHOLD

        input_size = checkpoint.get("input_size", [224, 244])
        if isinstance(input_size, int):
            resize_size = (input_size, input_size)
        elif isinstance(input_size, (list, tuple)) and len(input_size) == 2:
            resize_size = (int(input_size[0]), int(input_size[1]))
        else:
            resize_size = (224, 244)

        norm = checkpoint.get("normalization", {})
        mean = norm.get("mean", [0.485, 0.456, 0.406])
        std = norm.get("std", [0.229, 0.224, 0.225])
    else:
        resize_size = (224, 244)
        mean = [0.485, 0.456, 0.406]
        std = [0.229, 0.224, 0.225]

    lower_class_names = [str(name).strip().lower() for name in class_names]
    if "pneumonia" in lower_class_names:
        pneumonia_class_index = lower_class_names.index("pneumonia")
    else:
        pneumonia_class_index = 1

    transform = transforms.Compose([
        transforms.Resize(resize_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std)
    ])

    model.to(device)
    model.eval()

    # Warm up once to reduce first-request latency.
    dummy = torch.zeros(1, 3, resize_size[0], resize_size[1]).to(device)
    with torch.inference_mode():
        _ = model(dummy)

    print(f"✅ Model loaded on {device}")
    print(f"✅ Model path: {loaded_model_path}")
    print(f"✅ Class names: {class_names}")
    print(f"✅ Pneumonia class index: {pneumonia_class_index}")
    print(f"✅ Decision threshold (PNEUMONIA): {pneumonia_threshold:.4f}")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None or transform is None:
        return JSONResponse(status_code=503, content={"error": "Model not loaded"})
    
    try:
        if file.content_type and not file.content_type.startswith("image/"):
            raise HTTPException(status_code=415, detail="Unsupported file type. Please upload an image.")

        # Read image
        contents = await file.read()
        if len(contents) > INFERENCE_MAX_IMAGE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Image too large. Max allowed size is {INFERENCE_MAX_IMAGE_BYTES // (1024 * 1024)} MB.",
            )

        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Preprocess
        img_tensor = transform(image).unsqueeze(0).to(device)
        
        # Inference
        start = time.perf_counter()
        async with inference_semaphore:
            probabilities, confidence, predicted = await run_in_threadpool(_predict_tensor, img_tensor)
        latency_ms = (time.perf_counter() - start) * 1000.0
        
        pneumonia_prob = probabilities[0][pneumonia_class_index].item()
        predicted_class = pneumonia_class_index if pneumonia_prob >= pneumonia_threshold else 1 - pneumonia_class_index
        class_name = class_names[predicted_class]
        confidence_score = probabilities[0][predicted_class].item()

        probability_map = {
            class_names[idx]: round(probabilities[0][idx].item(), 4)
            for idx in range(len(class_names))
        }
        
        return {
            "prediction": class_name,
            "confidence": round(confidence_score, 4),
            "latency_ms": round(latency_ms, 2),
            "decision_threshold": round(pneumonia_threshold, 4),
            "probabilities": probability_map
        }
    except HTTPException as http_err:
        return JSONResponse(status_code=http_err.status_code, content={"error": http_err.detail})
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(device),
        "inference_concurrency": INFERENCE_CONCURRENCY,
        "model_path": loaded_model_path,
        "class_names": class_names,
        "pneumonia_class_index": pneumonia_class_index,
        "decision_threshold": round(pneumonia_threshold, 4)
    }