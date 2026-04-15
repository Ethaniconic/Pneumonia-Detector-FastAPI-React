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
inference_semaphore = asyncio.Semaphore(INFERENCE_CONCURRENCY)


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
    global model
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
    
    # Load weights
    model_path = os.path.join(os.path.dirname(__file__), "models", "resnet18_pneumonia_best_finetuned.pth")
    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'] if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint else checkpoint)
    model.to(device)
    model.eval()

    # Warm up once to reduce first-request latency.
    dummy = torch.zeros(1, 3, 224, 244).to(device)
    with torch.inference_mode():
        _ = model(dummy)

    print(f"✅ Model loaded on {device}")

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 244)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
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
        
        class_name = "PNEUMONIA" if predicted.item() == 1 else "NORMAL"
        confidence_score = confidence.item()
        
        return {
            "prediction": class_name,
            "confidence": round(confidence_score, 4),
            "latency_ms": round(latency_ms, 2),
            "probabilities": {
                "NORMAL": round(probabilities[0][0].item(), 4),
                "PNEUMONIA": round(probabilities[0][1].item(), 4)
            }
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
        "inference_concurrency": INFERENCE_CONCURRENCY
    }