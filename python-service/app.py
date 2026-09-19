"""
python-service/app.py
=====================
FastAPI inference service for Smart Helmet Violation Detection.
Loads the CoDETRPredictor singleton once at application startup.
Provides:
  - GET  /health
  - GET  /model/status
  - POST /predict/image
"""

import os
import sys
import time
from typing import Optional

# Ensure repository root and python-service are on sys.path
_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_SERVICE_DIR, ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)
if _SERVICE_DIR not in sys.path:
    sys.path.insert(0, _SERVICE_DIR)

from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas import ImagePredictionResponse, ModelStatusResponse
from inference import CoDETRPredictor

# Initialize FastAPI application
app = FastAPI(
    title="Smart Helmet Violation Detection — Co-DETR AI Service",
    description="High-performance GPU inference API powered by Co-DETR (ResNet-18)",
    version="1.0.0",
)

# Enable CORS for development and production (e.g. Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Predictor singleton (loaded ONCE during startup)
predictor: Optional[CoDETRPredictor] = None


@app.on_event("startup")
def startup_event():
    """Load model weights and initialize CUDA once on service startup."""
    global predictor
    print(f"[{time.strftime('%H:%M:%S')}] >>> FastAPI Startup: Initializing CoDETRPredictor <<<", flush=True)
    try:
        predictor = CoDETRPredictor(lazy_load=False)
        print(f"[{time.strftime('%H:%M:%S')}] >>> FastAPI Startup: CoDETRPredictor Ready <<<", flush=True)
    except Exception as exc:
        print(f"[ERROR] Failed to initialize CoDETRPredictor on startup: {exc}", flush=True)
        # Keep process alive so /health can report status accurately
        predictor = None


@app.get("/health")
def health_check():
    """Service health and uptime endpoint."""
    return {
        "status": "online",
        "service": "smart-helmet-codetr-inference",
        "model_loaded": predictor is not None and predictor.loaded,
        "timestamp": time.time(),
    }


@app.get("/model/status", response_model=ModelStatusResponse)
def model_status():
    """Returns detailed hardware, GPU memory, model architecture, and class mapping."""
    if predictor is None or not predictor.loaded:
        return ModelStatusResponse(
            model_name="Co-DETR",
            backbone="ResNet-18",
            loaded=False,
            device="unknown",
            num_classes=7,
            class_names=[
                "driver_with_helmet",
                "bike",
                "driver",
                "passenger_with_helmet",
                "passenger",
                "driver_without_helmet",
                "passenger_without_helmet",
            ],
            cuda_available=False,
        )
    return predictor.get_status()


@app.post("/predict/image", response_model=ImagePredictionResponse)
async def predict_image(
    file: UploadFile = File(..., description="Traffic image file (JPEG, PNG)"),
    confidence_threshold: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum confidence score threshold"),
):
    """
    Accepts an uploaded image and performs Co-DETR detection.
    Returns bounding boxes, class labels, violation status, and counts.
    """
    # Validate file extension
    valid_extensions = (".jpg", ".jpeg", ".png", ".bmp", ".webp")
    filename = (file.filename or "").lower()
    if not any(filename.endswith(ext) for ext in valid_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format. Allowed formats: {', '.join(valid_extensions)}"
        )

    if predictor is None or not predictor.loaded:
        raise HTTPException(
            status_code=503,
            detail="AI inference engine is not ready. Model is still loading or initialization failed."
        )

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        response = predictor.predict_image(
            image_input=contents,
            score_thr=confidence_threshold,
        )
        return response
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        print(f"[ERROR] Inference failed on {file.filename}: {exc}", flush=True)
        raise HTTPException(status_code=500, detail=f"Inference error: {str(exc)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, log_level="info")
