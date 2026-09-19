"""
python-service/config.py
========================
Configuration settings for the Co-DETR Helmet Detection Inference Service.
Reads from environment variables with safe defaults.
"""

import os

# Base directory
SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SERVICE_DIR, ".."))

# Model configuration and checkpoint defaults
MODEL_CONFIG = os.environ.get(
    "MODEL_CONFIG",
    os.path.join(REPO_ROOT, "configs/codetr/experiments/exp_K5_speed_fp16.py")
)

MODEL_CHECKPOINT = os.environ.get(
    "MODEL_CHECKPOINT",
    os.path.join(
        REPO_ROOT,
        "work_dirs/k5_bs7_training/best_bbox_mAP_epoch_10.pth"
    )
)

DEVICE = os.environ.get("DEVICE", "cuda")
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.30"))
FP16_ENABLED = os.environ.get("FP16_ENABLED", "true").lower() in ("1", "true", "yes")

# Co-DETR 7 target classes in exact model index order
EXPECTED_CLASSES = (
    "driver_with_helmet",        # 0
    "bike",                      # 1
    "driver",                    # 2
    "passenger_with_helmet",     # 3
    "passenger",                 # 4
    "driver_without_helmet",     # 5 -> violation = True
    "passenger_without_helmet",  # 6 -> violation = True
)

# Clean UI labels mapping
CLASS_DISPLAY_NAMES = {
    "driver_with_helmet": "Driver — Helmet",
    "bike": "Motorcycle",
    "driver": "Driver",
    "passenger_with_helmet": "Passenger — Helmet",
    "passenger": "Passenger",
    "driver_without_helmet": "Driver — No Helmet",
    "passenger_without_helmet": "Passenger — No Helmet",
}

# Explicit violation mapping
VIOLATION_CLASSES = {
    "driver_without_helmet",
    "passenger_without_helmet",
}
