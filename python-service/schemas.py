"""
python-service/schemas.py
=========================
Pydantic data schemas for request and response payloads.
"""

from typing import List, Tuple, Dict, Any, Optional
from pydantic import BaseModel, Field


class DetectionItem(BaseModel):
    class_id: int = Field(..., description="0-indexed class ID (0 to 6)")
    class_name: str = Field(..., description="Raw technical class name")
    display_name: str = Field(..., description="Clean human-readable UI label")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0 and 1")
    bbox: List[float] = Field(..., description="Bounding box [x1, y1, x2, y2] in pixel coordinates")
    violation: bool = Field(..., description="True if this detection is a helmet violation")


class DetectionSummary(BaseModel):
    vehicles: int = Field(0, description="Total motorcycles detected")
    riders: int = Field(0, description="Total riders detected (drivers + passengers)")
    helmet_detected: int = Field(0, description="Total riders wearing helmets")
    violations: int = Field(0, description="Total riders violating helmet rule")
    total_detections: int = Field(0, description="Total detections meeting score threshold")


class ImagePredictionResponse(BaseModel):
    success: bool = True
    detections: List[DetectionItem] = Field(default_factory=list)
    summary: DetectionSummary
    inference_time_ms: float = Field(..., description="Inference execution time in milliseconds")
    image_width: int
    image_height: int
    model_name: str = "Co-DETR (ResNet-18)"
    device: str


class ModelStatusResponse(BaseModel):
    model_name: str = "Co-DETR"
    backbone: str = "ResNet-18"
    loaded: bool
    device: str
    checkpoint_path: Optional[str] = None
    config_path: Optional[str] = None
    num_classes: int = 7
    class_names: List[str]
    cuda_available: bool
    gpu_name: Optional[str] = None
    memory_allocated_mb: Optional[float] = None
    memory_reserved_mb: Optional[float] = None
