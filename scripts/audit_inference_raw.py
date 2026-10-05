#!/usr/bin/env python3
"""
scripts/audit_inference_raw.py
==============================
Diagnostic script to audit raw Co-DETR inference output on an image.

Determines whether:
  A. Co-DETR itself produces only one detection, OR
  B. Co-DETR produces multiple detections but our backend/inference code removes them.

Reports:
  1. Number of raw detections returned by Co-DETR before any filtering (thr = 0.0).
  2. For every raw detection:
     - class ID
     - class name
     - confidence
     - bounding box
  3. Number of detections at various confidence thresholds (0.0, 0.1, 0.2, 0.3, 0.5, 0.8).
  4. Number of detections after NMS/post-processing.
  5. Number of detections returned to the frontend.
"""

import os
import sys
import argparse
import time
import numpy as np

# Ensure repository root and python-service are on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
PYTHON_SERVICE = os.path.join(REPO_ROOT, "python-service")
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if PYTHON_SERVICE not in sys.path:
    sys.path.insert(0, PYTHON_SERVICE)

from config import (
    MODEL_CONFIG,
    MODEL_CHECKPOINT,
    DEVICE,
    EXPECTED_CLASSES,
    CLASS_DISPLAY_NAMES,
    VIOLATION_CLASSES,
    FP16_ENABLED,
)
from model_loader import load_model_and_config


def audit_image(image_path: str, threshold: float = 0.0):
    print("=" * 78)
    print("  🔍 Co-DETR RAW INFERENCE AUDIT & DIAGNOSTIC")
    print("=" * 78)

    if not os.path.isfile(image_path):
        print(f"[ERROR] Image file not found: {image_path}")
        sys.exit(1)

    print(f"Image Path        : {image_path}")
    print(f"Model Config      : {MODEL_CONFIG}")
    print(f"Model Checkpoint  : {MODEL_CHECKPOINT}")
    print(f"Device            : {DEVICE}")
    print(f"Diagnostic Thr    : {threshold}")

    # 1. Load Model
    t0 = time.time()
    print(f"\n[Step 1] Loading Co-DETR model into memory...")
    model, cfg = load_model_and_config(
        config_path=MODEL_CONFIG,
        checkpoint_path=MODEL_CHECKPOINT,
        device_name=DEVICE,
    )
    device = next(model.parameters()).device
    print(f"Model loaded on {device} in {time.time() - t0:.2f}s")

    # 2. Read Image
    import cv2
    import torch
    from mmdet.apis import inference_detector

    img = cv2.imread(image_path)
    if img is None:
        print(f"[ERROR] cv2.imread failed on: {image_path}")
        sys.exit(1)
    img_h, img_w = img.shape[:2]
    print(f"Image Dimensions  : {img_w} x {img_h}")

    # 3. Inspect Model Heads & Test Config
    print(f"\n[Step 2] Inspecting Detector Post-Processing (NMS / Test Config)...")
    if hasattr(cfg, "model") and hasattr(cfg.model, "test_cfg"):
        print(f"Model test_cfg: {cfg.model.test_cfg}")
    elif hasattr(cfg, "test_cfg"):
        print(f"Config test_cfg: {cfg.test_cfg}")

    # 4. Run Raw Inference
    print(f"\n[Step 3] Running Co-DETR forward pass (inference_detector)...")
    t_start = time.perf_counter()
    with torch.no_grad():
        if FP16_ENABLED and device.type == "cuda":
            with torch.cuda.amp.autocast():
                raw_results = inference_detector(model, img)
        else:
            raw_results = inference_detector(model, img)
    inf_time_ms = (time.perf_counter() - t_start) * 1000
    print(f"Raw inference completed in {inf_time_ms:.2f} ms")

    # 5. Analyze Raw Detections (Stage 1 & Stage 2)
    all_raw_detections = []
    class_counts_raw = {cls_name: 0 for cls_name in EXPECTED_CLASSES}

    for cls_idx, cls_dets in enumerate(raw_results):
        if cls_dets is None or len(cls_dets) == 0:
            continue
        cname = EXPECTED_CLASSES[cls_idx] if cls_idx < len(EXPECTED_CLASSES) else f"class_{cls_idx}"
        class_counts_raw[cname] = len(cls_dets)

        for det in cls_dets:
            conf = float(det[4])
            bbox = [max(0.0, round(float(coord), 2)) for coord in det[:4]]
            all_raw_detections.append({
                "class_id": cls_idx,
                "class_name": cname,
                "display_name": CLASS_DISPLAY_NAMES.get(cname, cname),
                "confidence": conf,
                "bbox": bbox,
                "violation": cname in VIOLATION_CLASSES,
            })

    # Sort all raw detections descending by confidence
    all_raw_detections.sort(key=lambda d: d["confidence"], reverse=True)

    total_raw = len(all_raw_detections)

    print("\n" + "=" * 78)
    print(f"  STAGE 1: RAW DETECTIONS RETURNED BY Co-DETR BEFORE FILTERING: {total_raw}")
    print("=" * 78)
    print("Per-class distribution of raw candidate bboxes:")
    for cname, cnt in class_counts_raw.items():
        print(f"  - {cname:26s} : {cnt} candidates")

    print("\n" + "=" * 78)
    print(f"  STAGE 2: COMPLETE LIST OF RAW DETECTIONS (Total: {total_raw})")
    print("=" * 78)
    if total_raw == 0:
        print("  [NONE] Co-DETR returned 0 raw bounding boxes.")
    else:
        print(f"  {'#':<3} | {'Cls ID':<6} | {'Class Name':<25} | {'Confidence':<10} | {'Bounding Box [x1, y1, x2, y2]'}")
        print("  " + "-" * 74)
        for idx, d in enumerate(all_raw_detections):
            conf_str = f"{d['confidence'] * 100:.2f}% ({d['confidence']:.4f})"
            box_str = f"[{d['bbox'][0]:.1f}, {d['bbox'][1]:.1f}, {d['bbox'][2]:.1f}, {d['bbox'][3]:.1f}]"
            print(f"  {idx+1:<3} | {d['class_id']:<6} | {d['class_name']:<25} | {conf_str:<10} | {box_str}")

    # 6. Analyze Threshold Sensitivity (Stage 3)
    print("\n" + "=" * 78)
    print("  STAGE 3: NUMBER OF DETECTIONS AFTER CONFIDENCE FILTERING")
    print("=" * 78)
    for test_thr in [0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50, 0.60, 0.70, 0.80]:
        surviving = [d for d in all_raw_detections if d["confidence"] >= test_thr]
        print(f"  Threshold >= {test_thr*100:4.1f}% ({test_thr:.2f}) : {len(surviving):2d} detections remaining")

    # 7. Analyze Post-Processing & NMS (Stage 4)
    print("\n" + "=" * 78)
    print("  STAGE 4: POST-PROCESSING / NMS ANALYSIS")
    print("=" * 78)
    print("  Co-DETR query_head generates queries and MMDetection applies test_cfg (NMS) inside simple_test.")
    print(f"  Raw bboxes output from MMDetection inference_detector: {total_raw}")
    if total_raw == 1:
        print("  Observation: Exactly 1 detection emerged from the detector's simple_test NMS.")
    elif total_raw > 1:
        print(f"  Observation: Multiple ({total_raw}) detections emerged from the detector's simple_test NMS.")

    # 8. Analyze Frontend Output (Stage 5)
    frontend_threshold = 0.35
    frontend_surviving = [d for d in all_raw_detections if d["confidence"] >= frontend_threshold]
    print("\n" + "=" * 78)
    print(f"  STAGE 5: DETECTIONS RETURNED TO FRONTEND (Default slider: {frontend_threshold*100:.0f}%)")
    print("=" * 78)
    print(f"  Count sent to UI : {len(frontend_surviving)}")
    for idx, d in enumerate(frontend_surviving):
        print(f"    - Detection #{idx+1}: {d['display_name']} | Conf: {d['confidence']*100:.1f}% | Box: {d['bbox']}")

    # 9. Conclusion (A vs B)
    print("\n" + "=" * 78)
    print("  DIAGNOSTIC CONCLUSION: A vs B")
    print("=" * 78)
    count_at_30 = len([d for d in all_raw_detections if d["confidence"] >= 0.30])
    count_at_80 = len([d for d in all_raw_detections if d["confidence"] >= 0.80])

    if total_raw <= 1:
        print("  RESULT: [A] Co-DETR ITSELF PRODUCES ONLY ONE DETECTION.")
        print(f"  Explanation: inference_detector() returned {total_raw} candidate bbox(es) in total before any")
        print("  backend filtering was applied. The backend code did NOT suppress additional detections.")
    elif count_at_30 == count_at_80 == 1:
        print("  RESULT: [A] Co-DETR ITSELF HAS ONLY ONE HIGH-CONFIDENCE DETECTION.")
        print(f"  Explanation: Between 30% and 80%, only 1 detection exceeds the threshold.")
        print(f"  However, {total_raw} raw detections exist at lower thresholds (0.0% - 30%).")
    else:
        print("  RESULT: [B] Co-DETR PRODUCES MULTIPLE DETECTIONS.")
        print(f"  Explanation: At thr=0.30 there are {count_at_30} detections.")

    print("=" * 78)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audit raw Co-DETR inference output on an image")
    parser.add_argument("--image", default=None, help="Path to traffic image to audit")
    parser.add_argument("--thr", type=float, default=0.0, help="Confidence threshold (default: 0.0)")
    args = parser.parse_args()

    target_img = args.image
    if not target_img:
        # Default sample image
        cands = [
            os.path.join(REPO_ROOT, "tests/data/sample_traffic.jpg"),
            os.path.join(REPO_ROOT, "web/frontend/public/sample_traffic.jpg"),
        ]
        for c in cands:
            if os.path.isfile(c):
                target_img = c
                break

    if not target_img:
        import glob
        all_jpgs = glob.glob(os.path.join(REPO_ROOT, "**", "*.jpg"), recursive=True)
        if all_jpgs:
            target_img = all_jpgs[0]

    if not target_img:
        print("[ERROR] No image found to audit. Please specify with --image <path>")
        sys.exit(1)

    audit_image(target_img, threshold=args.thr)
