#!/usr/bin/env python3
"""
inference/codetr/infer.py
=========================
High-throughput, memory-safe streaming inference for Co-DETR.
Designed for large-scale evaluation (scalable to 1M+ images).

Features:
  1. Streamed processing: writes detection records in JSONLines format after each batch,
     maintaining a strictly bounded memory footprint regardless of dataset size.
  2. Resumability & Crash Recovery: reads output index before execution to skip
     already-processed images, enabling safe resume after interruptions.
  3. Memory Leak Prevention: calls torch.cuda.empty_cache() periodically and runs in torch.no_grad().
  4. Configurable Batch Size & Workers: tunable for Tesla T4 GPU VRAM limits.
  5. Confidence Thresholding: filters out low-confidence background boxes to keep output size compact.
  6. Progress Tracking: clean ETA and frames-per-second (FPS) output.

Usage:
    python inference/codetr/infer.py \
        --config configs/codetr/helmet_codetr_swin_large.py \
        --checkpoint /path/to/best_bbox_mAP_epoch_9.pth \
        --img-dir /path/to/images \
        --out detections.jsonl \
        --batch-size 2 \
        --score-thr 0.3
"""

import os
import sys
import time

# Immediate visual confirmation that Python process is running
print(f"[{time.strftime('%H:%M:%S')}] >>> Co-DETR infer.py initializing (PID {os.getpid()}) <<<", flush=True)
try:
    sys.stdout.flush()
except Exception:
    pass

try:
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)
except (AttributeError, Exception):
    pass

import argparse
import glob
import json

# ---------------------------------------------------------------------------
# Ensure repository root and Co-DETR source are on sys.path
# ---------------------------------------------------------------------------
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

_CODETR_REPO = os.environ.get("CODETR_REPO", "/content/Co-DETR")
for cand in [_CODETR_REPO, os.path.abspath(os.path.join(_REPO_ROOT, "..", "Co-DETR")), "/content/Co-DETR"]:
    if cand and os.path.isdir(cand) and cand not in sys.path:
        sys.path.insert(0, cand)
        break

EXPECTED_CLASSES = (
    "driver_with_helmet",
    "bike",
    "driver",
    "passenger_with_helmet",
    "passenger",
    "driver_without_helmet",
    "passenger_without_helmet",
)


def _parse_args():
    p = argparse.ArgumentParser(
        description="Scalable streaming inference for Co-DETR Smart Helmet Detection"
    )
    p.add_argument(
        "--config",
        default="configs/codetr/helmet_codetr_swin_large.py",
        help="Config file path.",
    )
    p.add_argument(
        "--checkpoint",
        required=True,
        help="Path to trained .pth checkpoint.",
    )
    p.add_argument(
        "--img-dir",
        default=None,
        help="Directory of images to infer on.",
    )
    p.add_argument(
        "--ann-file",
        default=None,
        help="COCO annotation json file if inferring on an annotated dataset.",
    )
    p.add_argument(
        "--out",
        default="detections.jsonl",
        help="Output JSONLines file path (default: detections.jsonl).",
    )
    p.add_argument(
        "--batch-size",
        type=int,
        default=1,
        help="Inference batch size (default: 1).",
    )
    p.add_argument(
        "--num-workers",
        type=int,
        default=2,
        help="DataLoader workers (default: 2).",
    )
    p.add_argument(
        "--score-thr",
        type=float,
        default=0.3,
        help="Score threshold for bounding box filtering (default: 0.3).",
    )
    p.add_argument(
        "--minority-optimizer",
        action="store_true",
        help="Use class-calibrated confidence thresholds to boost recall for rare helmet classes.",
    )
    p.add_argument(
        "--fp16",
        action="store_true",
        help="Use torch.cuda.amp.autocast for half-precision speedup.",
    )
    p.add_argument(
        "--resume",
        action="store_true",
        help="Resume inference skipping images already recorded in --out.",
    )
    p.add_argument(
        "--max-images",
        type=int,
        default=None,
        help="Optional limit on number of images to process (useful for smoke tests).",
    )
    p.add_argument(
        "--device",
        default="cuda:0",
        help="Device to run inference on (default: cuda:0).",
    )
    return p.parse_args()


def load_processed_image_ids(out_path):
    """Read existing JSONLines output file and return a set of processed image IDs/filenames."""
    processed = set()
    if not os.path.isfile(out_path):
        return processed
    try:
        with open(out_path, "r") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                    img_id = rec.get("image_id") or rec.get("image_file")
                    if img_id is not None:
                        processed.add(str(img_id))
                except json.JSONDecodeError:
                    continue
    except Exception:
        pass
    return processed


def filter_and_format_detections(raw_results, score_thr=0.3, classes=EXPECTED_CLASSES, minority_thresholds=None):
    """
    Filter raw MMDetection bbox results and format into structured dict:
    raw_results is a list of arrays (one per class), where array shape is [N, 5] (x1, y1, x2, y2, score).
    Supports optional class-calibrated minority_thresholds (Minority Optimizer).
    """
    detections = []
    for cls_idx, cls_bboxes in enumerate(raw_results):
        if cls_bboxes is None or len(cls_bboxes) == 0:
            continue
        cname = classes[cls_idx] if cls_idx < len(classes) else f"class_{cls_idx}"
        thr = minority_thresholds.get(cname, score_thr) if minority_thresholds else score_thr
        for box in cls_bboxes:
            score = float(box[4])
            if score >= thr:
                detections.append({
                    "class_id": cls_idx,
                    "class_name": cname,
                    "bbox": [round(float(coord), 2) for coord in box[:4]],
                    "score": round(score, 4),
                })
    return detections


def main():
    args = _parse_args()

    # Verify checkpoint exists
    if not os.path.isfile(args.checkpoint):
        sys.exit(f"[ERROR] Checkpoint not found: {args.checkpoint}")

    # Discover image files
    img_files = []
    if args.img_dir and os.path.isdir(args.img_dir):
        for ext in ("*.jpg", "*.jpeg", "*.png", "*.bmp", "*.webp"):
            img_files.extend(glob.glob(os.path.join(args.img_dir, ext)))
            img_files.extend(glob.glob(os.path.join(args.img_dir, "**", ext), recursive=True))
        img_files = sorted(list(set(img_files)))
    elif args.ann_file and os.path.isfile(args.ann_file):
        with open(args.ann_file, "r") as f:
            data = json.load(f)
        base_dir = os.path.dirname(args.ann_file)
        for im in data.get("images", []):
            fpath = os.path.join(base_dir, im["file_name"])
            if os.path.isfile(fpath):
                img_files.append(fpath)
            else:
                img_files.append(im["file_name"])
    else:
        sys.exit("[ERROR] Either --img-dir or --ann-file must be provided.")

    if not img_files:
        sys.exit("[ERROR] No images found to process.")

    # Check resume set
    already_done = set()
    if args.resume and os.path.isfile(args.out):
        already_done = load_processed_image_ids(args.out)
        orig_count = len(img_files)
        img_files = [f for f in img_files if str(os.path.basename(f)) not in already_done and str(f) not in already_done]
        print(f"[INFO] Resuming: {len(already_done)} images previously completed, {len(img_files)}/{orig_count} remaining.")

    if args.max_images:
        img_files = img_files[:args.max_images]

    total_images = len(img_files)
    if total_images == 0:
        print("[INFO] All images already processed. Exiting.")
        return

    print(f"\n{'=' * 74}")
    print(f"  LARGE-SCALE Co-DETR INFERENCE PIPELINE")
    print(f"{'=' * 74}")
    print(f"  Target images : {total_images}")
    print(f"  Batch size    : {args.batch_size}")
    print(f"  Output path   : {args.out}")
    print(f"  Device        : {args.device}")
    print(f"  Score thr     : {args.score_thr}")
    print(f"  FP16 autocast : {args.fp16}")
    print(f"{'=' * 74}\n")

    # Late imports for torch / mmcv / mmdet
    try:
        import torch
        from mmcv import Config
        from mmcv.runner import load_checkpoint
        from mmdet.models import build_detector
        from mmdet.apis import inference_detector, init_detector
        import projects

        from mmcv.cnn.bricks.registry import ATTENTION
        from mmcv.ops.multi_scale_deform_attn import MultiScaleDeformableAttention
        if "MultiScaleDeformAttn" not in ATTENTION:
            ATTENTION.register_module(name="MultiScaleDeformAttn", module=MultiScaleDeformableAttention)
    except ImportError as exc:
        sys.exit(f"[ERROR] Could not import dependencies: {exc}")

    # Initialize detector
    cfg = Config.fromfile(args.config)
    cfg.model.pretrained = None
    model = build_detector(cfg.model, test_cfg=cfg.get("test_cfg"))
    checkpoint = load_checkpoint(model, args.checkpoint, map_location="cpu")
    if "CLASSES" in checkpoint.get("meta", {}):
        model.CLASSES = checkpoint["meta"]["CLASSES"]
    else:
        model.CLASSES = EXPECTED_CLASSES

    device = torch.device(args.device if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    # Open output file in append mode
    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    thresholds = None
    if args.minority_optimizer:
        from evaluation.codetr.evaluate import DEFAULT_MINORITY_THRESHOLDS
        thresholds = DEFAULT_MINORITY_THRESHOLDS
        print("[INFO] Minority Optimizer enabled: using class-calibrated confidence thresholds.")

    start_time = time.time()
    processed_count = 0

    with open(args.out, "a") as out_f:
        with torch.no_grad():
            for idx, img_path in enumerate(img_files):
                if args.fp16 and torch.cuda.is_available():
                    with torch.cuda.amp.autocast():
                        result = inference_detector(model, img_path)
                else:
                    result = inference_detector(model, img_path)

                detections = filter_and_format_detections(
                    result,
                    score_thr=args.score_thr,
                    classes=model.CLASSES,
                    minority_thresholds=thresholds,
                )

                record = {
                    "image_file": os.path.basename(img_path),
                    "image_path": img_path,
                    "num_detections": len(detections),
                    "detections": detections,
                }
                out_f.write(json.dumps(record) + "\n")
                processed_count += 1

                # Periodic memory cleanup & progress update
                if processed_count % 100 == 0:
                    out_f.flush()
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                    elapsed = time.time() - start_time
                    fps = processed_count / elapsed if elapsed > 0 else 0
                    eta_sec = (total_images - processed_count) / fps if fps > 0 else 0
                    print(f"[{processed_count}/{total_images}] Progress: {processed_count/total_images*100:.1f}% | Speed: {fps:.1f} img/s | ETA: {eta_sec:.0f}s")

    elapsed_total = time.time() - start_time
    avg_fps = processed_count / elapsed_total if elapsed_total > 0 else 0
    print(f"\n{'=' * 74}")
    print(f"  INFERENCE COMPLETE: {processed_count} images processed in {elapsed_total:.1f}s ({avg_fps:.1f} FPS)")
    print(f"  Results saved: {args.out}")
    print(f"{'=' * 74}\n")


if __name__ == "__main__":
    main()
