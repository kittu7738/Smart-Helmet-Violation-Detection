"""
python-service/inference.py
===========================
The core reusable CoDETRPredictor class.
Maintains a single model instance in memory and runs structured inference on images.
"""

import os
import sys
import time
from typing import List, Dict, Any, Union, Optional
import numpy as np

# Ensure repository root and Co-DETR source are on sys.path
_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_SERVICE_DIR, ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)
if _SERVICE_DIR not in sys.path:
    sys.path.insert(0, _SERVICE_DIR)

from config import (
    MODEL_CONFIG,
    MODEL_CHECKPOINT,
    DEVICE,
    CONFIDENCE_THRESHOLD,
    FP16_ENABLED,
    EXPECTED_CLASSES,
    CLASS_DISPLAY_NAMES,
    VIOLATION_CLASSES,
)
from schemas import (
    DetectionItem,
    DetectionSummary,
    ImagePredictionResponse,
    ModelStatusResponse,
)
from model_loader import load_model_and_config


class CoDETRPredictor:
    """
    Singleton-style predictor that loads Co-DETR once on GPU/CPU and handles
    repeated inferences with high throughput and memory safety.
    """

    def __init__(
        self,
        config_path: Optional[str] = None,
        checkpoint_path: Optional[str] = None,
        device: Optional[str] = None,
        default_score_thr: Optional[float] = None,
        lazy_load: bool = False,
    ):
        self.config_path = config_path or MODEL_CONFIG
        self.checkpoint_path = checkpoint_path or MODEL_CHECKPOINT
        self.device_name = device or DEVICE
        self.default_score_thr = default_score_thr if default_score_thr is not None else CONFIDENCE_THRESHOLD

        self.model = None
        self.cfg = None
        self.device = None
        self.loaded = False

        if not lazy_load:
            self.load_model()

    def load_model(self):
        """Loads and initializes the detector onto target device. Safe to call once."""
        if self.loaded and self.model is not None:
            return

        import torch
        self.model, self.cfg = load_model_and_config(
            config_path=self.config_path,
            checkpoint_path=self.checkpoint_path,
            device_name=self.device_name,
        )
        self.device = next(self.model.parameters()).device
        self.loaded = True
        print(f"[{time.strftime('%H:%M:%S')}] CoDETRPredictor ready on {self.device}")

    def get_status(self) -> ModelStatusResponse:
        """Returns runtime diagnostics and memory statistics."""
        import torch

        gpu_name = None
        mem_alloc = None
        mem_res = None
        cuda_avail = torch.cuda.is_available()

        if cuda_avail and "cuda" in str(self.device):
            gpu_name = torch.cuda.get_device_name(0)
            mem_alloc = round(torch.cuda.memory_allocated(0) / (1024 ** 2), 2)
            mem_res = round(torch.cuda.memory_reserved(0) / (1024 ** 2), 2)

        return ModelStatusResponse(
            model_name="Co-DETR",
            backbone="ResNet-18",
            loaded=self.loaded,
            device=str(self.device) if self.device else self.device_name,
            checkpoint_path=self.checkpoint_path,
            config_path=self.config_path,
            num_classes=len(EXPECTED_CLASSES),
            class_names=list(EXPECTED_CLASSES),
            cuda_available=cuda_avail,
            gpu_name=gpu_name,
            memory_allocated_mb=mem_alloc,
            memory_reserved_mb=mem_res,
        )

    def predict_image(
        self,
        image_input: Union[str, np.ndarray, bytes],
        score_thr: Optional[float] = None,
    ) -> ImagePredictionResponse:
        """
        Runs full inference on an image (filepath, numpy array, or raw bytes).
        Returns a structured ImagePredictionResponse with detections and summary.
        """
        if not self.loaded or self.model is None:
            self.load_model()

        import torch
        import cv2
        from mmdet.apis import inference_detector

        thr = score_thr if score_thr is not None else self.default_score_thr

        # Decode image if input is bytes or filepath
        if isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Failed to decode image from raw bytes")
        elif isinstance(image_input, str):
            if not os.path.isfile(image_input):
                raise FileNotFoundError(f"Image not found at path: {image_input}")
            img = cv2.imread(image_input)
            if img is None:
                raise ValueError(f"Failed to load image file at: {image_input}")
        elif isinstance(image_input, np.ndarray):
            img = image_input
        else:
            raise TypeError(f"Unsupported image_input type: {type(image_input)}")

        img_h, img_w = img.shape[:2]

        t_start = time.perf_counter()

        # Run model inference in torch.no_grad()
        with torch.no_grad():
            if FP16_ENABLED and self.device.type == "cuda":
                with torch.cuda.amp.autocast():
                    raw_results = inference_detector(self.model, img)
            else:
                raw_results = inference_detector(self.model, img)

        t_elapsed_ms = round((time.perf_counter() - t_start) * 1000, 2)

        # Parse detection outputs
        detections: List[DetectionItem] = []
        vehicles_count = 0
        riders_count = 0
        helmet_count = 0
        violations_count = 0

        # raw_results is list of arrays: one array per class (shape: [N, 5])
        for cls_idx, cls_dets in enumerate(raw_results):
            if cls_dets is None or len(cls_dets) == 0:
                continue

            cname = EXPECTED_CLASSES[cls_idx] if cls_idx < len(EXPECTED_CLASSES) else f"class_{cls_idx}"
            display_name = CLASS_DISPLAY_NAMES.get(cname, cname)
            is_violation = cname in VIOLATION_CLASSES

            for det in cls_dets:
                conf = float(det[4])
                if conf < thr:
                    continue

                x1, y1, x2, y2 = [max(0.0, round(float(coord), 2)) for coord in det[:4]]
                # Clip to image boundaries
                x1 = min(x1, float(img_w))
                x2 = min(x2, float(img_w))
                y1 = min(y1, float(img_h))
                y2 = min(y2, float(img_h))

                detections.append(
                    DetectionItem(
                        class_id=cls_idx,
                        class_name=cname,
                        display_name=display_name,
                        confidence=round(conf, 4),
                        bbox=[x1, y1, x2, y2],
                        violation=is_violation,
                    )
                )

                # Update count tallies
                if cname == "bike":
                    vehicles_count += 1
                elif cname in ("driver", "passenger", "driver_with_helmet", "passenger_with_helmet", "driver_without_helmet", "passenger_without_helmet"):
                    riders_count += 1

                if cname in ("driver_with_helmet", "passenger_with_helmet"):
                    helmet_count += 1

                if is_violation:
                    violations_count += 1

        summary = DetectionSummary(
            vehicles=vehicles_count,
            riders=riders_count,
            helmet_detected=helmet_count,
            violations=violations_count,
            total_detections=len(detections),
        )

        return ImagePredictionResponse(
            success=True,
            detections=detections,
            summary=summary,
            inference_time_ms=t_elapsed_ms,
            image_width=img_w,
            image_height=img_h,
            model_name="Co-DETR (ResNet-18)",
            device=str(self.device),
        )
