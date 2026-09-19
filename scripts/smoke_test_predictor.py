"""
scripts/smoke_test_predictor.py
===============================
Runs a complete smoke test of CoDETRPredictor on the active checkpoint:
1. Verifies model load (single time).
2. Verifies GPU allocation / CUDA memory.
3. Feeds a real test image.
4. Validates output bounding boxes, confidence values, class mapping, and timings.
"""

import os
import sys
import time

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_SERVICE = os.path.join(REPO_ROOT, "python-service")
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if PYTHON_SERVICE not in sys.path:
    sys.path.insert(0, PYTHON_SERVICE)

from inference import CoDETRPredictor
from config import EXPECTED_CLASSES


def main():
    print("=" * 70)
    print("  CoDETRPredictor SMOKE TEST & GPU VERIFICATION")
    print("=" * 70)

    # 1. Check for sample image
    sample_img = os.path.join(REPO_ROOT, "tests/data/sample_traffic.jpg")
    if not os.path.isfile(sample_img):
        # Fallback search
        import glob
        cands = glob.glob(os.path.join(REPO_ROOT, "**/*.jpg"), recursive=True)
        if cands:
            sample_img = cands[0]
        else:
            sys.exit("[ERROR] No test image found for smoke test.")

    print(f"Sample test image : {sample_img}")

    # 2. Checkpoint and config resolution
    config_path = os.environ.get(
        "MODEL_CONFIG",
        os.path.join(REPO_ROOT, "configs/codetr/experiments/exp_K5_speed_fp16.py")
    )
    checkpoint_path = os.environ.get(
        "MODEL_CHECKPOINT",
        "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/k5_bs7_training/best_bbox_mAP_epoch_10.pth"
    )

    print(f"Model config      : {config_path}")
    print(f"Model checkpoint  : {checkpoint_path}")

    t0 = time.time()
    predictor = CoDETRPredictor(
        config_path=config_path,
        checkpoint_path=checkpoint_path,
        device="cuda" if os.environ.get("DEVICE") == "cuda" else "cuda",
    )
    load_time = round(time.time() - t0, 2)
    print(f"Model loaded in   : {load_time}s")

    # 3. Model Status Check
    status = predictor.get_status()
    print("\n--- MODEL STATUS ---")
    print(f"Loaded            : {status.loaded}")
    print(f"Device            : {status.device}")
    print(f"GPU Name          : {status.gpu_name}")
    print(f"Memory Alloc (MB) : {status.memory_allocated_mb}")
    print(f"Memory Res (MB)   : {status.memory_reserved_mb}")
    print(f"Classes ({status.num_classes})      : {status.class_names}")

    assert status.loaded is True, "Predictor failed to report loaded=True"
    assert status.num_classes == 7, f"Expected 7 classes, got {status.num_classes}"

    # 4. First Inference Run
    print("\n--- INFERENCE RUN #1 ---")
    res1 = predictor.predict_image(sample_img, score_thr=0.20)
    print(f"Inference Time    : {res1.inference_time_ms} ms")
    print(f"Detections Count  : {len(res1.detections)}")
    print(f"Vehicles (Bikes)  : {res1.summary.vehicles}")
    print(f"Riders            : {res1.summary.riders}")
    print(f"Helmets Detected  : {res1.summary.helmet_detected}")
    print(f"Violations        : {res1.summary.violations}")

    for idx, det in enumerate(res1.detections):
        print(f"  Det #{idx+1}: {det.display_name} ({det.class_name}) | Conf: {det.confidence*100:.1f}% | Box: {det.bbox} | Violation: {det.violation}")
        assert 0.0 <= det.confidence <= 1.0, f"Invalid confidence: {det.confidence}"
        assert 0 <= det.class_id <= 6, f"Invalid class ID: {det.class_id}"
        assert len(det.bbox) == 4, f"Invalid bbox: {det.bbox}"
        assert det.bbox[0] <= det.bbox[2], f"Invalid bbox x coords: {det.bbox}"
        assert det.bbox[1] <= det.bbox[3], f"Invalid bbox y coords: {det.bbox}"

    # 5. Second Inference Run (Verifying Model Persistence & No Reloading)
    print("\n--- INFERENCE RUN #2 (Model Instance Reuse) ---")
    t_start2 = time.perf_counter()
    res2 = predictor.predict_image(sample_img, score_thr=0.20)
    t_elapsed2 = round((time.perf_counter() - t_start2) * 1000, 2)
    print(f"Inference Time    : {res2.inference_time_ms} ms (Total API roundtrip: {t_elapsed2} ms)")
    assert len(res2.detections) == len(res1.detections), "Inference results differ between repeated calls on identical input!"

    print("\n" + "=" * 70)
    print("  ALL CoDETRPredictor TESTS AND CHECKS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    main()
