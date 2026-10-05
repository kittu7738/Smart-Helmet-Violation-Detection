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

# Model configuration and checkpoint dynamic resolution
def _resolve_config() -> str:
    env_val = os.environ.get("MODEL_CONFIG")
    if env_val and os.path.isfile(env_val):
        return env_val
    candidates = [
        os.path.join(REPO_ROOT, "configs/codetr/experiments/exp_K5_speed_fp16.py"),
        "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/configs/codetr/experiments/exp_K5_speed_fp16.py",
        "/content/Smart-Helmet-Violation-Detection/configs/codetr/experiments/exp_K5_speed_fp16.py",
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return candidates[0]


def _resolve_checkpoint() -> str:
    env_val = os.environ.get("MODEL_CHECKPOINT")
    if env_val and os.path.isfile(env_val):
        return env_val

    # Standard candidate paths
    candidates = [
        "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/k5_bs7_training/best_bbox_mAP_epoch_10.pth",
        os.path.join(REPO_ROOT, "work_dirs/k5_bs7_training/best_bbox_mAP_epoch_10.pth"),
        "/content/Smart-Helmet-Violation-Detection/work_dirs/k5_bs7_training/best_bbox_mAP_epoch_10.pth",
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c

    # Glob search for best_bbox_mAP in possible work_dirs
    import glob
    search_dirs = [
        "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs",
        os.path.join(REPO_ROOT, "work_dirs"),
        "/content/Smart-Helmet-Violation-Detection/work_dirs",
    ]
    for sdir in search_dirs:
        if os.path.isdir(sdir):
            matches = glob.glob(os.path.join(sdir, "**", "best_bbox_mAP*.pth"), recursive=True)
            if matches:
                return sorted(matches)[-1]
            epoch_matches = glob.glob(os.path.join(sdir, "**", "epoch_*.pth"), recursive=True)
            if epoch_matches:
                return sorted(epoch_matches)[-1]

    return candidates[0]


MODEL_CONFIG = _resolve_config()
MODEL_CHECKPOINT = _resolve_checkpoint()

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
