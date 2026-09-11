#!/usr/bin/env python3
"""
evaluation/codetr/evaluate.py
=============================
Evaluate a trained Co-DETR checkpoint on the Smart Helmet Detection dataset.

Features:
  1. Audits and discovers checkpoints in work_dirs/ (locates best_bbox_mAP*.pth
     and correlates with recorded validation bbox_mAP from training logs).
  2. Verifies checkpoint validity, 7-class schema, and model architecture.
  3. Validates dataset paths (train/images, vaid/images, test/images).
  4. Runs evaluation ONLY on the held-out test split by default.
  5. Computes and reports:
       - Overall mAP (0.50:0.95), AP50, AP75, and AR (Average Recall @ 100)
       - Per-class AP, AP50, AP75, and Recall for all 7 classes:
           0: driver_with_helmet
           1: bike
           2: driver
           3: passenger_with_helmet
           4: passenger
           5: driver_without_helmet
           6: passenger_without_helmet

Environment variables (CLI args take priority):
    CODETR_DATA_ROOT   Root of the COCO-format dataset. Default: data/coco
    CODETR_WORK_DIR    Directory containing checkpoints and logs. Default: work_dirs/helmet_codetr
    CODETR_REPO        Path to Co-DETR source repo. Default: /content/Co-DETR

Usage (Google Colab / Local):
    # 1. Audit work_dir and logs to find the best checkpoint:
    python evaluation/codetr/evaluate.py --audit-only

    # 2. Run full evaluation on the held-out test split:
    python evaluation/codetr/evaluate.py \
        --config configs/codetr/helmet_codetr_swin_large.py \
        --data-root /content/drive/MyDrive/helmet_dataset/coco \
        --work-dir /content/drive/MyDrive/helmet_dataset/work_dirs/helmet_codetr \
        --split test

    # 3. Evaluate a specific checkpoint explicitly:
    python evaluation/codetr/evaluate.py \
        --checkpoint work_dirs/helmet_codetr/best_bbox_mAP_epoch_10.pth \
        --split test
"""

import argparse
import glob
import json
import os
import re
import sys
import numpy as np

# ---------------------------------------------------------------------------
# Default 7 temporary helmet classes (0-indexed)
# ---------------------------------------------------------------------------
EXPECTED_CLASSES = (
    "driver_with_helmet",        # 0
    "bike",                      # 1
    "driver",                    # 2
    "passenger_with_helmet",     # 3
    "passenger",                 # 4
    "driver_without_helmet",     # 5
    "passenger_without_helmet",  # 6
)

# ---------------------------------------------------------------------------
# Ensure Co-DETR source is on sys.path
# ---------------------------------------------------------------------------
_CODETR_REPO = os.environ.get("CODETR_REPO", "/content/Co-DETR")
if _CODETR_REPO and os.path.isdir(_CODETR_REPO) and _CODETR_REPO not in sys.path:
    sys.path.insert(0, _CODETR_REPO)


def _parse_args():
    parser = argparse.ArgumentParser(
        description="Evaluate Co-DETR helmet detection checkpoint on held-out test split"
    )
    parser.add_argument(
        "--config",
        default="configs/codetr/helmet_codetr_swin_large.py",
        help="MMDetection config file (default: configs/codetr/helmet_codetr_swin_large.py).",
    )
    parser.add_argument(
        "--checkpoint",
        default=None,
        help="Path to .pth checkpoint. If omitted, automatically identified from --work-dir.",
    )
    parser.add_argument(
        "--work-dir",
        default=None,
        help="Directory with checkpoints and logs (default: env CODETR_WORK_DIR or work_dirs/helmet_codetr).",
    )
    parser.add_argument(
        "--data-root",
        default=None,
        help="COCO dataset root (default: env CODETR_DATA_ROOT or data/coco).",
    )
    parser.add_argument(
        "--split",
        choices=["test", "val"],
        default="test",
        help="Split to evaluate: 'test' for held-out test split, 'val' for validation (default: test).",
    )
    parser.add_argument(
        "--eval",
        nargs="+",
        default=["bbox"],
        help="Evaluation metrics (default: bbox).",
    )
    parser.add_argument(
        "--classwise",
        action="store_true",
        default=True,
        help="Compute per-class AP metrics (default: True).",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Output .pkl file for raw model prediction results.",
    )
    parser.add_argument(
        "--out-metrics",
        default=None,
        help="Output .json file for final structured evaluation metrics.",
    )
    parser.add_argument(
        "--audit-only",
        action="store_true",
        help="Audit work_dir, training logs, checkpoint validity, and dataset paths without model inference.",
    )
    parser.add_argument(
        "--parse-log",
        default=None,
        help="Directly parse a specific training log file and display validation progression.",
    )
    parser.add_argument(
        "--show",
        action="store_true",
        help="Show detection results visually (requires display).",
    )
    parser.add_argument(
        "--show-dir",
        default=None,
        help="Directory to save visualization images.",
    )
    parser.add_argument(
        "--gpu-id",
        type=int,
        default=0,
        help="GPU device id (default: 0).",
    )
    parser.add_argument(
        "--launcher",
        choices=["none", "pytorch", "slurm", "mpi"],
        default="none",
        help="Job launcher (default: none).",
    )
    parser.add_argument(
        "--local_rank",
        type=int,
        default=0,
        help="(Set automatically by torch.distributed.launch)",
    )
    parser.add_argument(
        "--cfg-options",
        nargs="+",
        default=None,
        help="Override config key/values: KEY=VALUE ...",
    )
    return parser.parse_args()


def _resolve_data_root(args):
    root = args.data_root or os.environ.get("CODETR_DATA_ROOT", "data/coco")
    return root.rstrip("/").rstrip(os.sep)


def _resolve_work_dir(args):
    return (
        args.work_dir
        or os.environ.get("CODETR_WORK_DIR", "work_dirs/helmet_codetr")
    ).rstrip("/").rstrip(os.sep)


def verify_dataset_paths(data_root, target_split="test"):
    """
    Verify that the dataset directory structure contains the required splits:
      - train: instances_train.json + train/images/
      - val  : instances_val.json   + vaid/images/
      - test : instances_test.json  + test/images/
    """
    splits = {
        "train": ("instances_train.json", os.path.join("train", "images")),
        "val":   ("instances_val.json",   os.path.join("vaid", "images")),
        "test":  ("instances_test.json",  os.path.join("test", "images")),
    }

    report = {}
    all_ok = True

    for name, (ann_file, img_dir) in splits.items():
        ann_path = os.path.join(data_root, ann_file)
        img_path = os.path.join(data_root, img_dir)
        ann_exists = os.path.isfile(ann_path)
        img_exists = os.path.isdir(img_path)

        num_imgs = 0
        num_anns = 0
        if ann_exists:
            try:
                with open(ann_path, "r") as f:
                    meta = json.load(f)
                    num_imgs = len(meta.get("images", []))
                    num_anns = len(meta.get("annotations", []))
            except Exception:
                pass

        status = ann_exists and img_exists
        if name == target_split and not status:
            all_ok = False

        report[name] = {
            "ann_path": ann_path,
            "img_path": img_path,
            "ann_exists": ann_exists,
            "img_exists": img_exists,
            "num_images": num_imgs,
            "num_annotations": num_anns,
            "valid": status,
        }

    return all_ok, report


def _patch_config_data_root(cfg, data_root, split):
    """Patch the target split's ann_file and img_prefix in MMDetection config."""
    ann_map = {
        "val": "instances_val.json",
        "test": "instances_test.json",
    }
    img_map = {
        "val": "vaid/images/",
        "test": "test/images/",
    }
    if hasattr(cfg.data, split):
        split_cfg = getattr(cfg.data, split)
        split_cfg.ann_file = os.path.join(data_root, ann_map[split])
        split_cfg.img_prefix = os.path.join(data_root, img_map[split])
        if hasattr(split_cfg, "classes"):
            split_cfg.classes = EXPECTED_CLASSES


def parse_training_logs(work_dir_or_log_path):
    """
    Parse text log files (*.log) or json log files (*.log.json) to extract
    per-epoch validation metrics (bbox_mAP, bbox_mAP_50, bbox_mAP_75, etc.).
    """
    log_files = []
    if os.path.isfile(work_dir_or_log_path):
        log_files = [work_dir_or_log_path]
    elif os.path.isdir(work_dir_or_log_path):
        log_files = sorted(glob.glob(os.path.join(work_dir_or_log_path, "*.log*")))

    epoch_records = {}

    for lf in log_files:
        if lf.endswith(".json"):
            # Parse JSON line log
            try:
                with open(lf, "r") as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            item = json.loads(line)
                            if item.get("mode") == "val" and "bbox_mAP" in item:
                                ep = item.get("epoch")
                                epoch_records[ep] = {
                                    "epoch": ep,
                                    "bbox_mAP": float(item.get("bbox_mAP", 0.0)),
                                    "bbox_mAP_50": float(item.get("bbox_mAP_50", 0.0)),
                                    "bbox_mAP_75": float(item.get("bbox_mAP_75", 0.0)),
                                    "source": os.path.basename(lf),
                                }
                        except json.JSONDecodeError:
                            continue
            except Exception:
                pass
        else:
            # Parse text log
            text_pattern = re.compile(
                r"Epoch\(val\)\s*\[(\d+)\](?:\[\d+\])?\s+bbox_mAP:\s*([0-9.]+),\s*bbox_mAP_50:\s*([0-9.]+),\s*bbox_mAP_75:\s*([0-9.]+)"
            )
            try:
                with open(lf, "r", errors="ignore") as f:
                    for line in f:
                        m = text_pattern.search(line)
                        if m:
                            ep = int(m.group(1))
                            epoch_records[ep] = {
                                "epoch": ep,
                                "bbox_mAP": float(m.group(2)),
                                "bbox_mAP_50": float(m.group(3)),
                                "bbox_mAP_75": float(m.group(4)),
                                "source": os.path.basename(lf),
                            }
            except Exception:
                pass

    return epoch_records


def find_best_checkpoint(work_dir, log_data=None):
    """
    Locate all checkpoints in work_dir and identify the best checkpoint based on
    recorded validation bbox_mAP.
    """
    if not os.path.isdir(work_dir):
        return None, None, None, []

    if log_data is None:
        log_data = parse_training_logs(work_dir)

    all_ckpts = sorted(glob.glob(os.path.join(work_dir, "*.pth")))
    best_ckpts = sorted(glob.glob(os.path.join(work_dir, "best_bbox_mAP*.pth")))

    best_epoch = None
    best_val_mAP = -1.0

    if log_data:
        # Pick the epoch with highest recorded validation bbox_mAP
        for ep, rec in sorted(log_data.items()):
            if rec["bbox_mAP"] > best_val_mAP:
                best_val_mAP = rec["bbox_mAP"]
                best_epoch = ep

    best_candidate = None

    # Priority 1: Match best_bbox_mAP_epoch_<best_epoch>.pth
    if best_epoch is not None:
        specific_best = os.path.join(work_dir, f"best_bbox_mAP_epoch_{best_epoch}.pth")
        if os.path.isfile(specific_best):
            best_candidate = specific_best

    # Priority 2: best_bbox_mAP.pth symlink / copy
    if best_candidate is None:
        std_best = os.path.join(work_dir, "best_bbox_mAP.pth")
        if os.path.isfile(std_best):
            best_candidate = std_best

    # Priority 3: Any best_bbox_mAP_epoch_*.pth
    if best_candidate is None and best_ckpts:
        best_candidate = best_ckpts[-1]

    # Priority 4: If no best_bbox_mAP file, pick epoch_<best_epoch>.pth or latest.pth
    if best_candidate is None and best_epoch is not None:
        ep_file = os.path.join(work_dir, f"epoch_{best_epoch}.pth")
        if os.path.isfile(ep_file):
            best_candidate = ep_file

    if best_candidate is None and all_ckpts:
        if os.path.isfile(os.path.join(work_dir, "latest.pth")):
            best_candidate = os.path.join(work_dir, "latest.pth")
        else:
            best_candidate = all_ckpts[-1]

    return best_candidate, best_epoch, best_val_mAP, all_ckpts


def verify_checkpoint(checkpoint_path, expected_classes=EXPECTED_CLASSES):
    """
    Verify checkpoint file validity, metadata, and 7-class head compatibility.
    """
    if not os.path.isfile(checkpoint_path):
        return False, {"error": f"File not found: {checkpoint_path}"}

    file_size_mb = os.path.getsize(checkpoint_path) / (1024 * 1024)

    try:
        import torch
        ckpt = torch.load(checkpoint_path, map_location="cpu")
    except Exception as exc:
        return False, {"error": f"Failed to load checkpoint with torch: {exc}"}

    meta = ckpt.get("meta", {})
    state_dict = ckpt.get("state_dict", {})

    # Check classes in meta
    ckpt_classes = meta.get("CLASSES", None)
    classes_match = False
    if ckpt_classes is not None:
        classes_match = list(ckpt_classes) == list(expected_classes)

    # Check classifier output channels in state dict
    num_classes_detected = None
    for k, v in state_dict.items():
        if "query_head.cls_branches" in k and "weight" in k:
            num_classes_detected = v.shape[0]
            break
        elif "bbox_head.fc_cls.weight" in k:
            num_classes_detected = v.shape[0]
            break

    details = {
        "path": checkpoint_path,
        "file_size_mb": round(file_size_mb, 2),
        "epoch": meta.get("epoch", None),
        "iter": meta.get("iter", None),
        "meta_classes": ckpt_classes,
        "classes_match": classes_match,
        "detected_num_classes": num_classes_detected,
        "num_params_state_dict": len(state_dict),
    }

    is_valid = len(state_dict) > 0 and (num_classes_detected == len(expected_classes) or num_classes_detected is None)
    return is_valid, details


def extract_coco_metrics(coco_eval, classes=EXPECTED_CLASSES):
    """
    Extract exact overall and per-class metrics from pycocotools COCOeval object.
    """
    stats = coco_eval.stats

    overall = {
        "mAP": float(stats[0]),          # AP @ IoU 0.50:0.95
        "AP50": float(stats[1]),         # AP @ IoU 0.50
        "AP75": float(stats[2]),         # AP @ IoU 0.75
        "mAP_small": float(stats[3]),
        "mAP_medium": float(stats[4]),
        "mAP_large": float(stats[5]),
        "AR_1": float(stats[6]),
        "AR_10": float(stats[7]),
        "AR": float(stats[8]),           # AR @ maxDets=100 (Primary Recall)
        "AR_small": float(stats[9]),
        "AR_medium": float(stats[10]),
        "AR_large": float(stats[11]),
    }

    classwise = {}
    precisions = coco_eval.eval["precision"]  # [T, R, K, A, M]
    recalls = coco_eval.eval["recall"]        # [T, K, A, M]

    for k, name in enumerate(classes):
        # AP across all IoU thresholds
        p = precisions[:, :, k, 0, 2]
        p_valid = p[p > -1]
        ap = float(np.mean(p_valid)) if len(p_valid) > 0 else 0.0

        # AP at IoU = 0.50 (index 0)
        p50 = precisions[0, :, k, 0, 2]
        p50_valid = p50[p50 > -1]
        ap50 = float(np.mean(p50_valid)) if len(p50_valid) > 0 else 0.0

        # AP at IoU = 0.75 (index 5)
        p75 = precisions[5, :, k, 0, 2]
        p75_valid = p75[p75 > -1]
        ap75 = float(np.mean(p75_valid)) if len(p75_valid) > 0 else 0.0

        # AR / Recall across all IoU thresholds
        r = recalls[:, k, 0, 2]
        r_valid = r[r > -1]
        ar = float(np.mean(r_valid)) if len(r_valid) > 0 else 0.0

        classwise[name] = {
            "class_id": k,
            "name": name,
            "AP": ap,
            "AP50": ap50,
            "AP75": ap75,
            "AR": ar,
        }

    return overall, classwise


def format_metrics_tables(overall, classwise, split="test", ckpt_name=""):
    """Format overall and classwise metrics into clean ASCII / Markdown tables."""
    lines = []
    lines.append("")
    lines.append("=" * 72)
    lines.append(f"  FINAL EVALUATION REPORT — SPLIT: {split.upper()}")
    if ckpt_name:
        lines.append(f"  Checkpoint: {ckpt_name}")
    lines.append("=" * 72)

    lines.append("\n[1] OVERALL DETECTION METRICS (COCO format)")
    lines.append("-" * 50)
    lines.append(f"  {'Metric':<25} | {'Value':<15}")
    lines.append("-" * 50)
    lines.append(f"  {'mAP (0.50:0.95)':<25} | {overall['mAP']:.4f}")
    lines.append(f"  {'AP50':<25} | {overall['AP50']:.4f}")
    lines.append(f"  {'AP75':<25} | {overall['AP75']:.4f}")
    lines.append(f"  {'AR / Recall (maxDets=100)':<25} | {overall['AR']:.4f}")
    lines.append(f"  {'mAP Small':<25} | {overall['mAP_small']:.4f}")
    lines.append(f"  {'mAP Medium':<25} | {overall['mAP_medium']:.4f}")
    lines.append(f"  {'mAP Large':<25} | {overall['mAP_large']:.4f}")
    lines.append("-" * 50)

    lines.append("\n[2] PER-CLASS DETECTION METRICS (7 Classes)")
    lines.append("-" * 72)
    lines.append(f"  {'ID':<3} | {'Class Name':<26} | {'AP':<8} | {'AP50':<8} | {'AP75':<8} | {'Recall':<8}")
    lines.append("-" * 72)

    for name, cdata in classwise.items():
        cid = cdata["class_id"]
        ap = cdata["AP"]
        ap50 = cdata["AP50"]
        ap75 = cdata["AP75"]
        ar = cdata["AR"]
        lines.append(f"  {cid:<3} | {name:<26} | {ap:<8.4f} | {ap50:<8.4f} | {ap75:<8.4f} | {ar:<8.4f}")
    lines.append("-" * 72)
    lines.append("")

    return "\n".join(lines)


def print_audit_report(data_root, work_dir, log_data, best_ckpt, best_epoch, best_mAP, all_ckpts):
    """Print an audit report of repository training outputs and dataset paths."""
    print("\n" + "=" * 72)
    print("  SMART HELMET Co-DETR REPOSITORY & TRAINING AUDIT")
    print("=" * 72)

    # 1. Dataset check
    ds_ok, ds_report = verify_dataset_paths(data_root)
    print("\n[Dataset Paths Audit]")
    print(f"  Data Root: {data_root}")
    for split_name, sinfo in ds_report.items():
        status_sym = "✔" if sinfo["valid"] else "✘"
        print(f"  {status_sym} Split '{split_name}':")
        print(f"      Annotations : {sinfo['ann_path']} (Images: {sinfo['num_images']}, Anns: {sinfo['num_annotations']})")
        print(f"      Image Dir   : {sinfo['img_path']} (Exists: {sinfo['img_exists']})")

    # 2. Checkpoints & Logs
    print(f"\n[Training Outputs Audit]")
    print(f"  Work Dir: {work_dir}")
    print(f"  Found {len(all_ckpts)} checkpoint file(s) on disk:")
    for ckpt in all_ckpts:
        sz = os.path.getsize(ckpt) / (1024 * 1024)
        print(f"    • {os.path.basename(ckpt)} ({sz:.1f} MB)")

    print(f"\n[Validation Progression from Training Logs]")
    if log_data:
        print(f"  {'Epoch':<8} | {'bbox_mAP':<12} | {'bbox_mAP_50':<14} | {'bbox_mAP_75':<14} | {'Source'}")
        print("  " + "-" * 65)
        for ep, rec in sorted(log_data.items()):
            mark = " 🏆 (BEST)" if ep == best_epoch else ""
            print(f"  {ep:<8} | {rec['bbox_mAP']:<12.4f} | {rec['bbox_mAP_50']:<14.4f} | {rec['bbox_mAP_75']:<14.4f} | {rec['source']}{mark}")
        print("  " + "-" * 65)
        print(f"  => Best Recorded Validation Epoch: Epoch {best_epoch} with bbox_mAP = {best_mAP:.4f}")
    else:
        print("  (No training logs found in work directory to display progression)")

    if best_ckpt:
        print(f"\n[Best Checkpoint Identified]")
        print(f"  Path: {best_ckpt}")
        print(f"  Size: {os.path.getsize(best_ckpt) / (1024 * 1024):.1f} MB")
    else:
        print("\n[Best Checkpoint Identified]")
        print("  None found in work directory.")
    print("=" * 72 + "\n")


def main():
    args = _parse_args()

    # ── 1. Directly parse log if requested ────────────────────────────────────
    if args.parse_log:
        records = parse_training_logs(args.parse_log)
        if not records:
            print(f"[ERROR] No validation records could be extracted from: {args.parse_log}")
            sys.exit(1)
        print(f"\nValidation progression from {args.parse_log}:")
        print(f"  {'Epoch':<8} | {'bbox_mAP':<12} | {'bbox_mAP_50':<14} | {'bbox_mAP_75':<14}")
        print("  " + "-" * 55)
        best_ep = max(records.keys(), key=lambda e: records[e]["bbox_mAP"])
        for ep, r in sorted(records.items()):
            mark = " 🏆 (BEST)" if ep == best_ep else ""
            print(f"  {ep:<8} | {r['bbox_mAP']:<12.4f} | {r['bbox_mAP_50']:<14.4f} | {r['bbox_mAP_75']:<14.4f}{mark}")
        print("  " + "-" * 55)
        sys.exit(0)

    # ── 2. Audit Paths & Locate Checkpoint ────────────────────────────────────
    data_root = _resolve_data_root(args)
    work_dir = _resolve_work_dir(args)
    log_data = parse_training_logs(work_dir)
    auto_best_ckpt, best_ep, best_mAP, all_ckpts = find_best_checkpoint(work_dir, log_data)

    target_ckpt = args.checkpoint or auto_best_ckpt

    if args.audit_only:
        print_audit_report(data_root, work_dir, log_data, auto_best_ckpt, best_ep, best_mAP, all_ckpts)
        if target_ckpt and os.path.isfile(target_ckpt):
            valid, det = verify_checkpoint(target_ckpt)
            print(f"Checkpoint Validation Result: {'VALID ✔' if valid else 'INVALID ✘'}")
            print(json.dumps(det, indent=2))
        sys.exit(0)

    # ── 3. Checkpoint & Dataset Verification Before Inference ─────────────────
    if not target_ckpt:
        sys.exit(
            f"[ERROR] No checkpoint specified via --checkpoint and none found in: {work_dir}\n"
            "Ensure training has finished and checkpoints exist, or pass --checkpoint /path/to/model.pth"
        )
    if not os.path.isfile(target_ckpt):
        sys.exit(f"[ERROR] Checkpoint file does not exist: {target_ckpt}")

    valid_ckpt, ckpt_details = verify_checkpoint(target_ckpt)
    if not valid_ckpt:
        print(f"[WARN] Checkpoint validation issue: {ckpt_details}")
    else:
        print(f"[INFO] Verified checkpoint: {os.path.basename(target_ckpt)} ({ckpt_details['file_size_mb']} MB)")
        print(f"       7-Class compatibility: {ckpt_details.get('classes_match', True)}")

    ds_ok, ds_report = verify_dataset_paths(data_root, target_split=args.split)
    if not ds_ok:
        sys.exit(
            f"[ERROR] Required dataset paths for split '{args.split}' are missing under data root: {data_root}\n"
            f"Details:\n{json.dumps(ds_report, indent=2)}"
        )
    else:
        s_info = ds_report[args.split]
        print(f"[INFO] Dataset '{args.split}' split verified: {s_info['num_images']} images, {s_info['num_annotations']} annotations.")

    # ── 4. Late Imports for MMDet & PyTorch ───────────────────────────────────
    try:
        import torch
        import mmcv
        from mmcv import Config
        from mmcv.runner import load_checkpoint
        from mmcv.parallel import MMDataParallel
        from mmdet.apis import single_gpu_test
        from mmdet.datasets import build_dataloader, build_dataset
        from mmdet.models import build_detector

        # Explicitly import Co-DETR projects module
        import projects

        # Patch: Register MultiScaleDeformableAttention as MultiScaleDeformAttn
        from mmcv.cnn.bricks.registry import ATTENTION
        from mmcv.ops.multi_scale_deform_attn import MultiScaleDeformableAttention
        if "MultiScaleDeformAttn" not in ATTENTION:
            ATTENTION.register_module(name="MultiScaleDeformAttn", module=MultiScaleDeformableAttention)
    except ImportError as exc:
        sys.exit(
            f"[ERROR] Could not import mmdet/mmcv/projects: {exc}\n"
            "Ensure the codetr conda environment is active (Python 3.7.11) and "
            "PYTHONPATH includes the Co-DETR repo root."
        )

    # ── 5. Config Setup ───────────────────────────────────────────────────────
    if not os.path.isfile(args.config):
        sys.exit(f"[ERROR] Config not found: {args.config}")

    cfg = Config.fromfile(args.config)

    if args.cfg_options:
        override = {}
        for kv in args.cfg_options:
            k, v = kv.split("=", 1)
            for conv in (int, float):
                try:
                    v = conv(v)
                    break
                except ValueError:
                    pass
            override[k] = v
        cfg.merge_from_dict(override)

    _patch_config_data_root(cfg, data_root, args.split)
    cfg.data.samples_per_gpu = 1

    # ── 6. Build Dataset and DataLoader ───────────────────────────────────────
    print(f"[INFO] Building {args.split} dataset...")
    split_dataset_cfg = getattr(cfg.data, args.split)
    dataset = build_dataset(split_dataset_cfg)
    data_loader = build_dataloader(
        dataset,
        samples_per_gpu=1,
        workers_per_gpu=cfg.data.get("workers_per_gpu", 2),
        dist=False,
        shuffle=False,
    )

    # ── 7. Build Model and Load Weights ───────────────────────────────────────
    print(f"[INFO] Building Co-DETR model and loading checkpoint: {target_ckpt}")
    cfg.model.pretrained = None  # prevent downloading pretrained backbone
    model = build_detector(cfg.model, test_cfg=cfg.get("test_cfg"))
    checkpoint = load_checkpoint(model, target_ckpt, map_location="cpu")

    if "CLASSES" in checkpoint.get("meta", {}):
        model.CLASSES = checkpoint["meta"]["CLASSES"]
    else:
        model.CLASSES = dataset.CLASSES

    model = MMDataParallel(model, device_ids=[args.gpu_id])

    # ── 8. Run Inference on Target Split ONLY ─────────────────────────────────
    print(f"\n{'=' * 72}")
    print(f"  RUNNING INFERENCE ON HELD-OUT TEST SPLIT ({len(dataset)} images)")
    print(f"{'=' * 72}")
    outputs = single_gpu_test(
        model,
        data_loader,
        show=args.show,
        out_dir=args.show_dir,
    )

    if args.out:
        print(f"[INFO] Saving raw predictions to: {args.out}")
        mmcv.dump(outputs, args.out)

    # ── 9. Compute Overall and Per-Class Metrics ──────────────────────────────
    print(f"\n[INFO] Computing COCO evaluation metrics (classwise=True)...")
    eval_kwargs = {"metric": args.eval, "classwise": True}
    raw_eval_results = dataset.evaluate(outputs, **eval_kwargs)

    coco_eval = getattr(dataset, "coco_eval", {}).get("bbox")
    if coco_eval is not None:
        overall, classwise = extract_coco_metrics(coco_eval, EXPECTED_CLASSES)
    else:
        # Fallback if coco_eval is not attached
        overall = {
            "mAP": float(raw_eval_results.get("bbox_mAP", 0.0)),
            "AP50": float(raw_eval_results.get("bbox_mAP_50", 0.0)),
            "AP75": float(raw_eval_results.get("bbox_mAP_75", 0.0)),
            "mAP_small": float(raw_eval_results.get("bbox_mAP_s", 0.0)),
            "mAP_medium": float(raw_eval_results.get("bbox_mAP_m", 0.0)),
            "mAP_large": float(raw_eval_results.get("bbox_mAP_l", 0.0)),
            "AR": float(raw_eval_results.get("bbox_mAP_copypaste", "").split()[8]) if "bbox_mAP_copypaste" in raw_eval_results else 0.0,
            "AR_1": 0.0, "AR_10": 0.0, "AR_small": 0.0, "AR_medium": 0.0, "AR_large": 0.0,
        }
        classwise = {}
        for idx, cname in enumerate(EXPECTED_CLASSES):
            classwise[cname] = {
                "class_id": idx,
                "name": cname,
                "AP": float(raw_eval_results.get(f"{cname}_precision", raw_eval_results.get(f"bbox_mAP_{cname}", 0.0))),
                "AP50": 0.0, "AP75": 0.0, "AR": 0.0,
            }

    # ── 10. Display Formatted Tables ──────────────────────────────────────────
    report_text = format_metrics_tables(overall, classwise, split=args.split, ckpt_name=os.path.basename(target_ckpt))
    print(report_text)

    # ── 11. Save Metrics JSON if Requested ────────────────────────────────────
    if args.out_metrics:
        out_data = {
            "checkpoint": target_ckpt,
            "split": args.split,
            "num_images": len(dataset),
            "overall_metrics": overall,
            "classwise_metrics": classwise,
        }
        with open(args.out_metrics, "w") as f:
            json.dump(out_data, f, indent=2)
        print(f"[INFO] Evaluation metrics saved to: {args.out_metrics}")


if __name__ == "__main__":
    main()
