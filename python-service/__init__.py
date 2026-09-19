"""
python-service package
"""

from .inference import CoDETRPredictor
from .schemas import (
    DetectionItem,
    DetectionSummary,
    ImagePredictionResponse,
    ModelStatusResponse,
)
from .config import (
    EXPECTED_CLASSES,
    CLASS_DISPLAY_NAMES,
    VIOLATION_CLASSES,
)

__all__ = [
    "CoDETRPredictor",
    "DetectionItem",
    "DetectionSummary",
    "ImagePredictionResponse",
    "ModelStatusResponse",
    "EXPECTED_CLASSES",
    "CLASS_DISPLAY_NAMES",
    "VIOLATION_CLASSES",
]
