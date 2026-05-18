import io
import os
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import gc

# Enforce single-threaded execution to minimize memory overhead on cloud platforms
torch.set_num_threads(1)

# Global model variables
model = None
DEVICE = torch.device("cpu")

def build_model():
    """
    Builds the DenseNet-121 model architecture.
    """
    model = models.densenet121(weights=None)
    num_features = model.classifier.in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.5),
        nn.Linear(num_features, 256),
        nn.ReLU(),
        nn.BatchNorm1d(256),
        nn.Dropout(p=0.3),
        nn.Linear(256, 2)
    )
    return model

def load_models():
    global model
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    MODEL_PATH = os.path.join(BASE_DIR, "models", "pneumonia_model_full.pt")

    print(f"Loading model from {MODEL_PATH}...")
    
    try:
        model = build_model()
        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
        
        # Handle both state_dict and full package saves
        if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
            model.load_state_dict(checkpoint['model_state_dict'])
        else:
            model.load_state_dict(checkpoint)
        
        model.to(DEVICE)
        model.eval()
        
        print("Model loaded successfully.")
    except Exception as e:
        print(f"CRITICAL: Failed to load model: {str(e)}")
        import traceback
        traceback.print_exc()
        return

    print("Model initialization complete.")
    gc.collect()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models on startup
    load_models()
    yield
    # Cleanup on shutdown
    global model
    model = None

app = FastAPI(title="Medical X-Ray Pneumonia Detector", lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define transforms
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        return JSONResponse(status_code=503, content={"error": "Model not loaded"})
    
    try:
        # Read and open image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Preprocess
        input_tensor = transform(image).unsqueeze(0).to(DEVICE)
        
        # Inference
        with torch.no_grad():
            outputs = model(input_tensor)
            probs = torch.softmax(outputs, dim=1)
            confidence, pred_idx = torch.max(probs, dim=1)
        
        classes = ["NORMAL", "PNEUMONIA"]
        prediction = classes[pred_idx.item()]
        conf_score = confidence.item()
        prob_dict = {
            "NORMAL": round(probs[0][0].item(), 4),
            "PNEUMONIA": round(probs[0][1].item(), 4)
        }
        
        # Cleanup for memory efficiency
        del image_data, image, input_tensor, outputs, probs
        gc.collect()
        
        return {
            "prediction": prediction,
            "confidence": round(conf_score, 4),
            "probabilities": prob_dict
        }
        
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
