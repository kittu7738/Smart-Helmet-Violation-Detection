#!/usr/bin/env python3
"""
evaluation/codetr/evaluate.py
=============================
Evaluate a trained Co-DETR checkpoint on the Smart Helmet Detection dataset.

Features:
  1. Audits and discovers checkpoints in work_dirs/ (prioritizes best_bbox_mAP*.pth
     and correlates with recorded validation bbox_mAP from training logs).
  2. Verifies checkpoint validity, 7-class schema, and model architecture.
  3. Validates dataset paths (supports both data/test/instances_test.json and data/instances_test.json).
  4. Runs evaluation ONLY on the held-out test split by default.
  5. Computes and reports:
       - Overall mAP (0.50:0.95), AP50, AP75, and AR (Average Recall @ maxDets=100)
       - Per-class AP, AP50, AP75, and Recall for all 7 classes:
           0: driver_with_helmet
           1: bike
           2: driver
           3: passenger_with_helmet
           4: passenger
           5: driver_without_helmet
           6: passenger_without_helmet
       - Saves structured results to JSON.

Environment variables (CLI args take priority):
    CODETR_DATA_ROOT   Root of the COCO-format dataset. Default: /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data or data
    CODETR_WORK_DIR    Directory containing checkpoints and logs. Default: /content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_codetr_swin_large
    CODETR_REPO        Path to Co-DETR source repo. Default: /content/Co-DETR

Usage (Google Colab / Local):
    # 1. Audit work_dir and logs to find the best checkpoint:
    python evaluation/codetr/evaluate.py --audit-only

    # 2. Run full evaluation on the held-out test split:
    python evaluation/codetr/evaluate.py \
        --config configs/codetr/helmet_codetr_swin_large.py \
        --split test

    # 3. Evaluate a specific checkpoint explicitly:
    python evaluation/codetr/evaluate.py \
        --checkpoint /content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_codetr_swin_large/best_bbox_mAP_epoch_9.pth \
        --split test
"""

import argparse
import glob
import json
import math
import os
import re
import sys
import numpy as np

try:
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)
except (AttributeError, Exception):
    pass

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

# ---------------------------------------------------------------------------
# Default 7 temporary helmet classes (0-indexed, exact paper order)
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
# Default class-calibrated confidence thresholds for Minority Optimizer
# (Vo et al., "Robust Motorcycle Helmet Detection in Real-World Scenarios", CVPRW 2024)
# ---------------------------------------------------------------------------
DEFAULT_MINORITY_THRESHOLDS = {
    "bike": 0.30,
    "driver": 0.30,
    "passenger": 0.25,
    "driver_with_helmet": 0.20,
    "driver_without_helmet": 0.20,
    "passenger_with_helmet": 0.15,
    "passenger_without_helmet": 0.15,
}


def apply_minority_optimizer(outputs, classes=EXPECTED_CLASSES, thresholds=None):
    """
    Apply class-calibrated confidence filtering (Minority Optimizer) to prediction outputs.
    Adjusts retention thresholds to prevent suppressing rare helmet/passenger classes.
    """
    if thresholds is None:
        thresholds = DEFAULT_MINORITY_THRESHOLDS

    filtered_outputs = []
    for img_res in outputs:
        img_filtered = []
        for k, cname in enumerate(classes):
            if k < len(img_res):
                cls_dets = img_res[k]
                thr = thresholds.get(cname, 0.20)
                if cls_dets is not None and len(cls_dets) > 0:
                    keep = cls_dets[:, 4] >= thr
                    img_filtered.append(cls_dets[keep])
                else:
                    img_filtered.append(cls_dets if cls_dets is not None else np.zeros((0, 5), dtype=np.float32))
            else:
                img_filtered.append(np.zeros((0, 5), dtype=np.float32))
        filtered_outputs.append(img_filtered)
    return filtered_outputs


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
        help="Directory with checkpoints and logs.",
    )
    parser.add_argument(
        "--data-root",
        default=None,
        help="COCO dataset root.",
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
        "--minority-optimizer",
        action="store_true",
        help="Apply class-calibrated confidence thresholding for minority helmet classes (Vo et al., CVPRW 2024).",
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
    candidates = [
        args.data_root,
        os.environ.get("CODETR_DATA_ROOT"),
        "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/data",
        "data",
        "data/coco",
        "/content/drive/MyDrive/helmet_dataset/coco",
    ]
    for c in candidates:
        if c and os.path.isdir(c):
            return c.rstrip("/").rstrip(os.sep)
    return (args.data_root or os.environ.get("CODETR_DATA_ROOT") or "data").rstrip("/").rstrip(os.sep)


def _resolve_work_dir(args):
    candidates = [
        args.work_dir,
        os.environ.get("CODETR_WORK_DIR"),
        "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_codetr_swin_large",
        "work_dirs/helmet_codetr_swin_large",
        "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_codetr",
        "/content/drive/MyDrive/helmet_dataset/work_dirs/helmet_codetr",
        "work_dirs/helmet_codetr",
    ]
    for c in candidates:
        if c and os.path.isdir(c):
            return c.rstrip("/").rstrip(os.sep)
    return (args.work_dir or os.environ.get("CODETR_WORK_DIR") or "work_dirs/helmet_codetr_swin_large").rstrip("/").rstrip(os.sep)


def verify_dataset_paths(data_root, target_split="test"):
    """
    Verify dataset directory structure and locate files for all splits:
      - train: instances_train.json + train/images/
      - val  : instances_val.json   + vaid/images/
      - test : instances_test.json  + test/images/
    Supports both nested (data/split/instances_split.json) and flat (data/instances_split.json).
    """
    splits = ["train", "val", "test"]
    report = {}
    all_ok = True

    for name in splits:
        folder = "vaid" if name == "val" else name
        alt_folder = "val" if name == "val" else name

        # Candidate annotation paths
        ann_candidates = [
            os.path.join(data_root, folder, f"instances_{name}.json"),
            os.path.join(data_root, alt_folder, f"instances_{name}.json"),
            os.path.join(data_root, f"instances_{name}.json"),
        ]

        # Candidate image directories
        img_candidates = [
            os.path.join(data_root, folder, "images"),
            os.path.join(data_root, alt_folder, "images"),
            os.path.join(data_root, folder),
            os.path.join(data_root, alt_folder),
        ]

        resolved_ann = None
        for ac in ann_candidates:
            if os.path.isfile(ac):
                resolved_ann = ac
                break

        resolved_img = None
        for ic in img_candidates:
            if os.path.isdir(ic):
                resolved_img = ic
                break

        num_imgs = 0
        num_anns = 0
        if resolved_ann:
            try:
                with open(resolved_ann, "r") as f:
                    meta = json.load(f)
                    num_imgs = len(meta.get("images", []))
                    num_anns = len(meta.get("annotations", []))
            except Exception:
                pass

        valid = (resolved_ann is not None) and (resolved_img is not None)
        if name == target_split and not valid:
            all_ok = False

        report[name] = {
            "ann_path": resolved_ann or ann_candidates[0],
            "img_path": resolved_img or img_candidates[0],
            "ann_exists": resolved_ann is not None,
            "img_exists": resolved_img is not None,
            "num_images": num_imgs,
            "num_annotations": num_anns,
            "valid": valid,
        }

    return all_ok, report


def _patch_config_data_root(cfg, data_root, split):
    """Patch the target split's ann_file and img_prefix in MMDetection config."""
    _, report = verify_dataset_paths(data_root, target_split=split)
    sinfo = report.get(split, {})

    if hasattr(cfg.data, split):
        split_cfg = getattr(cfg.data, split)
        if sinfo.get("ann_exists"):
            split_cfg.ann_file = sinfo["ann_path"]
        if sinfo.get("img_exists"):
            split_cfg.img_prefix = sinfo["img_path"] + ("" if sinfo["img_path"].endswith("/") else "/")
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
    recorded validation bbox_mAP or filename metadata.
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
        for ep, rec in sorted(log_data.items()):
            if rec["bbox_mAP"] > best_val_mAP:
                best_val_mAP = rec["bbox_mAP"]
                best_epoch = ep

    best_candidate = None

    # Priority 1: Match best_bbox_mAP_epoch_<best_epoch>.pth from log argmax
    if best_epoch is not None:
        specific_best = os.path.join(work_dir, f"best_bbox_mAP_epoch_{best_epoch}.pth")
        if os.path.isfile(specific_best):
            best_candidate = specific_best

    # Priority 2: Inspect existing best_bbox_mAP_epoch_<N>.pth filenames directly
    if best_candidate is None:
        epoch_matches = []
        for bc in best_ckpts:
            m = re.search(r"best_bbox_mAP_epoch_(\d+)\.pth", os.path.basename(bc))
            if m:
                epoch_matches.append((int(m.group(1)), bc))
        if epoch_matches:
            # Sort by epoch descending
            epoch_matches.sort(key=lambda x: x[0], reverse=True)
            best_candidate = epoch_matches[0][1]
            if best_epoch is None:
                best_epoch = epoch_matches[0][0]

    # Priority 3: Standard best_bbox_mAP.pth symlink / copy
    if best_candidate is None:
        std_best = os.path.join(work_dir, "best_bbox_mAP.pth")
        if os.path.isfile(std_best):
            best_candidate = std_best

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

    ckpt_classes = meta.get("CLASSES", None)
    classes_match = False
    if ckpt_classes is not None:
        classes_match = list(ckpt_classes) == list(expected_classes)

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


def _sanitize_float(val, default=0.0):
    """
    Ensure value is a standard JSON-serializable float, replacing NaN, inf, or negative sentinel (-1) with default.
    """
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f) or f < 0.0:
            return default
        return round(f, 4)
    except (TypeError, ValueError):
        return default


def extract_coco_metrics(coco_eval, classes=EXPECTED_CLASSES):
    """
    Extract exact overall and per-class metrics from pycocotools COCOeval object.
    """
    stats = getattr(coco_eval, "stats", None)
    if stats is None or len(stats) == 0:
        stats = [0.0] * 12

    def _get_stat(idx):
        if idx < len(stats):
            return _sanitize_float(stats[idx])
        return 0.0

    overall = {
        "mAP": _get_stat(0),          # AP @ IoU 0.50:0.95
        "AP50": _get_stat(1),         # AP @ IoU 0.50
        "AP75": _get_stat(2),         # AP @ IoU 0.75
        "mAP_small": _get_stat(3),
        "mAP_medium": _get_stat(4),
        "mAP_large": _get_stat(5),
        "AR_1": _get_stat(6),
        "AR_10": _get_stat(7),
        "AR": _get_stat(8),           # AR @ maxDets=100 (Primary Recall)
        "AR_small": _get_stat(9),
        "AR_medium": _get_stat(10),
        "AR_large": _get_stat(11),
    }

    classwise = {}
    eval_dict = getattr(coco_eval, "eval", {}) or {}
    precisions = eval_dict.get("precision")  # [T, R, K, A, M]
    recalls = eval_dict.get("recall")        # [T, K, A, M]

    for k, name in enumerate(classes):
        ap, ap50, ap75, ar = 0.0, 0.0, 0.0, 0.0

        if precisions is not None and k < precisions.shape[2]:
            p = precisions[:, :, k, 0, 2]
            p_valid = p[(p > -1) & ~np.isnan(p)]
            if len(p_valid) > 0:
                ap = _sanitize_float(np.mean(p_valid))

            p50 = precisions[0, :, k, 0, 2]
            p50_valid = p50[(p50 > -1) & ~np.isnan(p50)]
            if len(p50_valid) > 0:
                ap50 = _sanitize_float(np.mean(p50_valid))

            p75 = precisions[5, :, k, 0, 2]
            p75_valid = p75[(p75 > -1) & ~np.isnan(p75)]
            if len(p75_valid) > 0:
                ap75 = _sanitize_float(np.mean(p75_valid))

        if recalls is not None and k < recalls.shape[1]:
            r = recalls[:, k, 0, 2]
            r_valid = r[(r > -1) & ~np.isnan(r)]
            if len(r_valid) > 0:
                ar = _sanitize_float(np.mean(r_valid))

        classwise[name] = {
            "class_id": k,
            "name": name,
            "AP": ap,
            "AP50": ap50,
            "AP75": ap75,
            "AR": ar,
        }

    return overall, classwise


def safe_extract_metrics(dataset, raw_eval_results, captured_coco_eval=None, classes=EXPECTED_CLASSES):
    """
    Robustly extract overall and classwise metrics, prioritizing direct pycocotools
    COCOeval results and falling back safely to raw_eval_results without IndexError.
    """
    # 1. Direct pycocotools COCOeval candidates
    candidate_coco_eval = None
    if captured_coco_eval is not None and hasattr(captured_coco_eval, "stats"):
        candidate_coco_eval = captured_coco_eval
    elif hasattr(dataset, "coco_eval"):
        d_ce = getattr(dataset, "coco_eval", None)
        if isinstance(d_ce, dict) and "bbox" in d_ce:
            candidate_coco_eval = d_ce["bbox"]
        elif hasattr(d_ce, "stats"):
            candidate_coco_eval = d_ce

    if candidate_coco_eval is not None and getattr(candidate_coco_eval, "stats", None) is not None:
        try:
            return extract_coco_metrics(candidate_coco_eval, classes)
        except Exception as exc:
            print(f"[WARNING] extract_coco_metrics failed ({exc}); falling back to raw results.")

    # 2. Robust fallback from raw_eval_results dict
    raw = raw_eval_results or {}
    copypaste = str(raw.get("bbox_mAP_copypaste", "")).strip()
    tokens = copypaste.split()

    # Extract AR safely without assuming copypaste length
    ar_val = 0.0
    if len(tokens) > 8:
        try:
            ar_val = _sanitize_float(tokens[8])
        except (ValueError, IndexError):
            ar_val = 0.0
    elif "bbox_AR@100" in raw:
        ar_val = _sanitize_float(raw["bbox_AR@100"])
    elif "bbox_mAP_recall" in raw:
        ar_val = _sanitize_float(raw["bbox_mAP_recall"])
    elif "bbox_AR" in raw:
        ar_val = _sanitize_float(raw["bbox_AR"])

    overall = {
        "mAP": _sanitize_float(raw.get("bbox_mAP", tokens[0] if len(tokens) > 0 else 0.0)),
        "AP50": _sanitize_float(raw.get("bbox_mAP_50", tokens[1] if len(tokens) > 1 else 0.0)),
        "AP75": _sanitize_float(raw.get("bbox_mAP_75", tokens[2] if len(tokens) > 2 else 0.0)),
        "mAP_small": _sanitize_float(raw.get("bbox_mAP_s", tokens[3] if len(tokens) > 3 else 0.0)),
        "mAP_medium": _sanitize_float(raw.get("bbox_mAP_m", tokens[4] if len(tokens) > 4 else 0.0)),
        "mAP_large": _sanitize_float(raw.get("bbox_mAP_l", tokens[5] if len(tokens) > 5 else 0.0)),
        "AR": ar_val,
        "AR_1": _sanitize_float(raw.get("bbox_AR@1", tokens[6] if len(tokens) > 6 else 0.0)),
        "AR_10": _sanitize_float(raw.get("bbox_AR@10", tokens[7] if len(tokens) > 7 else 0.0)),
        "AR_small": _sanitize_float(raw.get("bbox_AR_s", tokens[9] if len(tokens) > 9 else 0.0)),
        "AR_medium": _sanitize_float(raw.get("bbox_AR_m", tokens[10] if len(tokens) > 10 else 0.0)),
        "AR_large": _sanitize_float(raw.get("bbox_AR_l", tokens[11] if len(tokens) > 11 else 0.0)),
    }

    classwise = {}
    class_recalls = []
    for idx, cname in enumerate(classes):
        # Candidate keys for class AP
        ap_candidates = [
            f"{cname}_precision",
            f"bbox_mAP_{cname}",
            cname,
            f"AP_{cname}",
            f"{cname}_mAP",
        ]
        ap_val = 0.0
        for k in ap_candidates:
            if k in raw:
                ap_val = _sanitize_float(raw[k])
                break

        ap50_candidates = [
            f"{cname}_precision_50",
            f"bbox_mAP_50_{cname}",
            f"AP50_{cname}",
        ]
        ap50_val = 0.0
        for k in ap50_candidates:
            if k in raw:
                ap50_val = _sanitize_float(raw[k])
                break

        ap75_candidates = [
            f"{cname}_precision_75",
            f"bbox_mAP_75_{cname}",
            f"AP75_{cname}",
        ]
        ap75_val = 0.0
        for k in ap75_candidates:
            if k in raw:
                ap75_val = _sanitize_float(raw[k])
                break

        ar_candidates = [
            f"{cname}_recall",
            f"bbox_AR_{cname}",
            f"AR_{cname}",
        ]
        c_ar_val = 0.0
        for k in ar_candidates:
            if k in raw:
                c_ar_val = _sanitize_float(raw[k])
                class_recalls.append(c_ar_val)
                break

        classwise[cname] = {
            "class_id": idx,
            "name": cname,
            "AP": ap_val,
            "AP50": ap50_val,
            "AP75": ap75_val,
            "AR": c_ar_val,
        }

    # If overall AR is missing from tokens/keys but per-class recalls exist, average them
    if overall["AR"] == 0.0 and len(class_recalls) == len(classes):
        overall["AR"] = _sanitize_float(sum(class_recalls) / len(class_recalls))

    return overall, classwise


def format_metrics_tables(overall, classwise, split="test", ckpt_name=""):
    """Format overall and classwise metrics into clean ASCII / Markdown tables."""
    lines = []
    lines.append("")
    lines.append("=" * 74)
    lines.append(f"  FINAL EVALUATION REPORT — SPLIT: {split.upper()}")
    if ckpt_name:
        lines.append(f"  Checkpoint: {ckpt_name}")
    lines.append("=" * 74)

    lines.append("\n[1] OVERALL DETECTION METRICS (COCO standard)")
    lines.append("-" * 52)
    lines.append(f"  {'Metric':<26} | {'Value':<15}")
    lines.append("-" * 52)
    lines.append(f"  {'mAP (0.50:0.95)':<26} | {overall['mAP']:.4f}")
    lines.append(f"  {'AP50':<26} | {overall['AP50']:.4f}")
    lines.append(f"  {'AP75':<26} | {overall['AP75']:.4f}")
    lines.append(f"  {'AR / Recall (maxDets=100)':<26} | {overall['AR']:.4f}")
    lines.append(f"  {'mAP Small':<26} | {overall['mAP_small']:.4f}")
    lines.append(f"  {'mAP Medium':<26} | {overall['mAP_medium']:.4f}")
    lines.append(f"  {'mAP Large':<26} | {overall['mAP_large']:.4f}")
    lines.append("-" * 52)

    lines.append("\n[2] PER-CLASS DETECTION METRICS (7 Helmet Classes)")
    lines.append("-" * 74)
    lines.append(f"  {'ID':<3} | {'Class Name':<27} | {'AP':<8} | {'AP50':<8} | {'AP75':<8} | {'Recall':<8}")
    lines.append("-" * 74)

    for name, cdata in classwise.items():
        cid = cdata["class_id"]
        ap = cdata["AP"]
        ap50 = cdata["AP50"]
        ap75 = cdata["AP75"]
        ar = cdata["AR"]
        lines.append(f"  {cid:<3} | {name:<27} | {ap:<8.4f} | {ap50:<8.4f} | {ap75:<8.4f} | {ar:<8.4f}")
    lines.append("-" * 74)
    lines.append("")

    return "\n".join(lines)


def print_audit_report(data_root, work_dir, log_data, best_ckpt, best_epoch, best_mAP, all_ckpts):
    """Print an audit report of repository training outputs and dataset paths."""
    print("\n" + "=" * 74)
    print("  SMART HELMET Co-DETR REPOSITORY & TRAINING ARTIFACT AUDIT")
    print("=" * 74)

    ds_ok, ds_report = verify_dataset_paths(data_root)
    print("\n[Dataset Paths Audit]")
    print(f"  Data Root: {data_root}")
    for split_name, sinfo in ds_report.items():
        status_sym = "✔" if sinfo["valid"] else "✘"
        print(f"  {status_sym} Split '{split_name}':")
        print(f"      Annotations : {sinfo['ann_path']} (Images: {sinfo['num_images']}, Anns: {sinfo['num_annotations']})")
        print(f"      Image Dir   : {sinfo['img_path']} (Exists: {sinfo['img_exists']})")

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
        if best_epoch is not None:
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
    print("=" * 74 + "\n")


def main():
    args = _parse_args()

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

    try:
        import torch
        import mmcv
        from mmcv import Config
        from mmcv.runner import load_checkpoint
        from mmcv.parallel import MMDataParallel
        from mmdet.apis import single_gpu_test
        from mmdet.datasets import build_dataloader, build_dataset
        from mmdet.models import build_detector

        import projects

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

    print(f"[INFO] Building Co-DETR model and loading checkpoint: {target_ckpt}")
    cfg.model.pretrained = None
    model = build_detector(cfg.model, test_cfg=cfg.get("test_cfg"))
    checkpoint = load_checkpoint(model, target_ckpt, map_location="cpu")

    if "CLASSES" in checkpoint.get("meta", {}):
        model.CLASSES = checkpoint["meta"]["CLASSES"]
    else:
        model.CLASSES = dataset.CLASSES

    model = MMDataParallel(model, device_ids=[args.gpu_id])

    print(f"\n{'=' * 74}")
    print(f"  RUNNING INFERENCE ON HELD-OUT TEST SPLIT ({len(dataset)} images)")
    print(f"{'=' * 74}")
    outputs = single_gpu_test(
        model,
        data_loader,
        show=args.show,
        out_dir=args.show_dir,
    )

    if args.out:
        out_dir = os.path.dirname(os.path.abspath(args.out))
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)
        print(f"[INFO] Saving raw predictions to: {args.out}")
        mmcv.dump(outputs, args.out)

    if args.minority_optimizer:
        print("[INFO] Applying Minority Optimizer (class-calibrated confidence thresholding)...")
        outputs = apply_minority_optimizer(outputs, classes=EXPECTED_CLASSES)

    print(f"\n[INFO] Computing COCO evaluation metrics (classwise=True)...")
    eval_kwargs = {"metric": args.eval, "classwise": True}

    captured_evals = {}
    try:
        from pycocotools.cocoeval import COCOeval
        orig_summarize = COCOeval.summarize

        def _capturing_summarize(self):
            orig_summarize(self)
            iou_type = getattr(self.params, "iouType", "bbox")
            captured_evals[iou_type] = self

        COCOeval.summarize = _capturing_summarize
        try:
            raw_eval_results = dataset.evaluate(outputs, **eval_kwargs)
        finally:
            COCOeval.summarize = orig_summarize
    except Exception as exc:
        print(f"[NOTE] COCOeval hook notice: {exc}")
        raw_eval_results = dataset.evaluate(outputs, **eval_kwargs)

    # Attach captured evals to dataset if not already present
    if captured_evals:
        try:
            dataset.coco_eval = captured_evals
        except Exception:
            pass

    overall, classwise = safe_extract_metrics(
        dataset,
        raw_eval_results,
        captured_coco_eval=captured_evals.get("bbox"),
        classes=EXPECTED_CLASSES,
    )

    report_text = format_metrics_tables(overall, classwise, split=args.split, ckpt_name=os.path.basename(target_ckpt))
    print(report_text)

    if args.out_metrics:
        out_metrics_dir = os.path.dirname(os.path.abspath(args.out_metrics))
        if out_metrics_dir:
            os.makedirs(out_metrics_dir, exist_ok=True)
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
