#!/usr/bin/env python3
"""
training/codetr/train.py
========================
Co-DETR training entry point for Smart-Helmet-Violation-Detection.

This script is a thin wrapper around MMDetection's standard training loop.
It does NOT modify the upstream Co-DETR repository.

Environment variables (all optional – CLI args take priority):
    CODETR_DATA_ROOT   Path to the COCO-format dataset root directory.
                       Must contain:
                           instances_train.json
                           instances_val.json
                           train/images/  (image directory)
                           vaid/images/   (image directory)
                       Default: data/coco
    CODETR_WORK_DIR    Directory for checkpoints and logs.
                       Default: work_dirs/helmet_codetr

Usage (Google Colab):
    # From /content/Smart-Helmet-Violation-Detection
    CODETR_DATA_ROOT=/content/drive/MyDrive/helmet_dataset/coco \\
    python training/codetr/train.py \\
        --config configs/codetr/helmet_codetr_swin_large.py \\
        --work-dir work_dirs/helmet_codetr

    # Or using python -m torch.distributed.launch for multi-GPU:
    python -m torch.distributed.launch --nproc_per_node=1 \\
        training/codetr/train.py \\
        --config configs/codetr/helmet_codetr_swin_large.py \\
        --launcher pytorch

See docs/colab_codetr_setup.md for full Colab setup instructions.
"""

import os
import sys
import time

# ---------------------------------------------------------------------------
# 1. Immediate visual confirmation (FIRST EXECUTABLE ACTION)
# ---------------------------------------------------------------------------
print(f"[{time.strftime('%H:%M:%S')}] >>> Co-DETR train.py initializing (PID {os.getpid()}) <<<", flush=True)
try:
    sys.stdout.flush()
except Exception:
    pass

try:
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)
except (AttributeError, Exception):
    pass

# Prevent OpenCV & OpenMP threadpool deadlock in PyTorch DataLoader worker forks
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")
os.environ.setdefault("CV_NUM_THREADS", "0")

try:
    import cv2
    cv2.setNumThreads(0)
    cv2.ocl.setUseOpenCL(False)
except Exception:
    pass

import argparse
import copy
import shutil

# Ensure repository root is on sys.path
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

# Ensure Co-DETR source is on sys.path before importing mmdet / Co-DETR.
_CODETR_REPO = os.environ.get("CODETR_REPO", "/content/Co-DETR")
for cand in [_CODETR_REPO, os.path.abspath(os.path.join(_REPO_ROOT, "..", "Co-DETR")), "/content/Co-DETR"]:
    if cand and os.path.isdir(cand) and cand not in sys.path:
        sys.path.insert(0, cand)
        break


def _parse_args(args_list=None):
    parser = argparse.ArgumentParser(
        description="Train Co-DETR for Smart-Helmet-Violation-Detection"
    )
    parser.add_argument(
        "--config",
        default="configs/codetr/helmet_codetr_swin_large.py",
        help="Path to MMDetection config file. "
             "(default: configs/codetr/helmet_codetr_swin_large.py)",
    )
    parser.add_argument(
        "--work-dir",
        default=None,
        help="Directory to save checkpoints and logs. "
             "Overrides CODETR_WORK_DIR env var.",
    )
    parser.add_argument(
        "--data-root",
        default=None,
        help="Root of the COCO-format dataset. "
             "Overrides CODETR_DATA_ROOT env var. "
             "Must contain instances_train.json, instances_val.json, "
             "train/images/ and vaid/images/ subdirectories, or annotations/ and images/.",
    )
    parser.add_argument(
        "--val-data-root",
        default=None,
        help="Separate root directory for original validation dataset if not located under --data-root. "
             "Overrides CODETR_VAL_DATA_ROOT env var. Useful when --data-root points to a training-only directory.",
    )
    parser.add_argument(
        "--resume-from",
        default=None,
        help="Checkpoint .pth to resume training from.",
    )
    parser.add_argument(
        "--auto-resume",
        action="store_true",
        help="Automatically resume from work_dir/latest.pth if it exists.",
    )
    parser.add_argument(
        "--load-from",
        default=None,
        help="Checkpoint .pth to load weights from (no optimizer state).",
    )
    parser.add_argument(
        "--no-validate",
        action="store_true",
        help="Disable validation during training.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility (default: 42).",
    )
    parser.add_argument(
        "--launcher",
        choices=["none", "pytorch", "slurm", "mpi"],
        default="none",
        help="Job launcher for distributed training (default: none).",
    )
    parser.add_argument(
        "--local_rank",
        type=int,
        default=0,
        help="(Set automatically by torch.distributed.launch)",
    )
    # Performance & Colab optimizations
    parser.add_argument(
        "--max-epochs",
        "--epochs",
        dest="max_epochs",
        type=int,
        default=None,
        help="Override total number of training epochs (e.g. 2 for pilot run). "
             "Overrides config runner.max_epochs, max_epochs, and total_epochs.",
    )
    parser.add_argument(
        "--log-interval",
        type=int,
        default=None,
        help="Logging interval in iterations (overrides config log_config.interval).",
    )
    parser.add_argument(
        "--workers-per-gpu",
        type=int,
        default=None,
        help="DataLoader workers per GPU (overrides config data.workers_per_gpu).",
    )
    parser.add_argument(
        "--batch-size",
        "--samples-per-gpu",
        dest="batch_size",
        type=int,
        default=None,
        help="Batch size (samples per GPU) for training (overrides config data.samples_per_gpu).",
    )
    parser.add_argument(
        "--no-stage-data",
        action="store_true",
        help="Do not automatically stage Google Drive dataset to local disk.",
    )
    parser.add_argument(
        "--stage-dir",
        default="/content/dataset_local",
        help="Local directory to stage dataset into when on Google Drive (default: /content/dataset_local).",
    )
    parser.add_argument(
        "--swin-pretrained",
        default=None,
        help="Path to local Swin-L backbone checkpoint .pth.",
    )
    parser.add_argument(
        "--startup-diagnostic",
        action="store_true",
        help="Run through full startup sequence, configuration, data staging, and model initialization to verify readiness without launching training loop.",
    )
    parser.add_argument(
        "--training-diagnostic",
        action="store_true",
        help="Run full training pipeline through exactly 1 iteration to verify DataLoader, CUDA forward/backward pass, and loss computation, then exit cleanly.",
    )
    parser.add_argument(
        "--benchmark-throughput",
        action="store_true",
        help="Run full training pipeline for exactly 10 iterations to measure throughput, memory, and training speed, then exit cleanly.",
    )
    # Allow passing arbitrary MMDetection cfg-options as KEY=VALUE pairs.
    parser.add_argument(
        "--cfg-options",
        nargs="+",
        action=_DictAction,
        help="Override config key/values: e.g. --cfg-options "
             "optimizer.lr=2e-4 data.samples_per_gpu=1",
    )
    return parser.parse_args(args_list)


class _DictAction(argparse.Action):
    """Parse KEY=VALUE pairs into a flat dict, identical to mmcv.DictAction."""

    def __call__(self, parser, namespace, values, option_string=None):
        result = {}
        for kv in values:
            if "=" not in kv:
                parser.error(f"--cfg-options: expected KEY=VALUE, got '{kv}'")
            k, v = kv.split("=", 1)
            # Best-effort type coercion
            for converter in (int, float):
                try:
                    v = converter(v)
                    break
                except ValueError:
                    pass
            result[k] = v
        setattr(namespace, self.dest, result)


def _resolve_data_root(args):
    """Return data_root from CLI arg or environment variable."""
    root = args.data_root or os.environ.get("CODETR_DATA_ROOT", "data/coco")
    # Normalise: remove trailing slash
    return root.rstrip("/").rstrip(os.sep)


def _resolve_work_dir(args):
    """Return work_dir from CLI arg or environment variable."""
    return (
        args.work_dir
        or os.environ.get("CODETR_WORK_DIR", "work_dirs/helmet_codetr")
    )


def _discover_split_paths(data_dir: str, split_name: str) -> dict:
    """
    Discover annotation file and image directory for a split under data_dir.
    Robustly supports:
      1. COCO layout: annotations/instances_{split}.json + images/
      2. Flat layout: instances_{split}.json + images/ or {split}/images/
      3. Nested layout: {split}/instances_{split}.json + {split}/images/ (or vaid/ for val)
    """
    if not data_dir:
        return {
            "valid": False,
            "ann_path": "",
            "img_path": "",
            "ann_exists": False,
            "img_exists": False,
            "num_images": 0,
            "num_annotations": 0,
            "ann_candidates": [],
            "img_candidates": [],
        }

    data_dir = os.path.abspath(os.path.expanduser(str(data_dir).strip()))
    primary_folder = "vaid" if split_name == "val" else split_name
    alt_folder = "val" if split_name == "val" else split_name

    ann_candidates = [
        # 1. Standard COCO layout: annotations/instances_{split}.json
        os.path.join(data_dir, "annotations", f"instances_{split_name}.json"),
        # 2. Flat layout: instances_{split}.json
        os.path.join(data_dir, f"instances_{split_name}.json"),
        # 3. Nested layout: {folder}/instances_{split}.json (e.g. vaid/instances_val.json)
        os.path.join(data_dir, primary_folder, f"instances_{split_name}.json"),
        os.path.join(data_dir, alt_folder, f"instances_{split_name}.json"),
        # 4. Fallbacks: annotations/{split}.json, {split}.json
        os.path.join(data_dir, "annotations", f"{split_name}.json"),
        os.path.join(data_dir, f"{split_name}.json"),
        os.path.join(data_dir, primary_folder, f"{split_name}.json"),
    ]

    img_candidates = [
        # For val, prioritize primary_folder (vaid/images/); for train, prioritize top-level images/
        os.path.join(data_dir, "images") if split_name == "train" else os.path.join(data_dir, primary_folder, "images"),
        os.path.join(data_dir, primary_folder, "images") if split_name == "train" else os.path.join(data_dir, "images"),
        os.path.join(data_dir, alt_folder, "images"),
        os.path.join(data_dir, primary_folder),
        os.path.join(data_dir, alt_folder),
        os.path.join(data_dir, "images", primary_folder),
        os.path.join(data_dir, "images", alt_folder),
    ]

    # Deduplicate while preserving order
    ann_candidates = list(dict.fromkeys(ann_candidates))
    img_candidates = list(dict.fromkeys(img_candidates))

    resolved_ann = None
    for ac in ann_candidates:
        if os.path.exists(ac) and not os.path.isdir(ac):
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
            import json
            with open(resolved_ann, "r") as f:
                meta = json.load(f)
                num_imgs = len(meta.get("images", []))
                num_anns = len(meta.get("annotations", []))
        except Exception:
            pass

    valid = (resolved_ann is not None) and (resolved_img is not None)
    return {
        "valid": valid,
        "ann_path": resolved_ann or ann_candidates[0],
        "img_path": resolved_img or img_candidates[0],
        "ann_exists": resolved_ann is not None,
        "img_exists": resolved_img is not None,
        "num_images": num_imgs,
        "num_annotations": num_anns,
        "ann_candidates": ann_candidates,
        "img_candidates": img_candidates,
    }


def _validate_and_patch_data_root(cfg, data_root, val_data_root=None, no_validate=False):
    """
    Verify dataset paths for train and val splits (supporting flat, nested, and COCO layouts)
    and patch the MMDetection config accordingly.

    If data_root only contains the training split (e.g. combined_train), val split is resolved
    from --val-data-root, existing config paths, or standard candidate locations to keep the
    original validation set intact and separate.
    """
    # 1. Train split
    if hasattr(cfg.data, "train"):
        sinfo = _discover_split_paths(data_root, "train")
        if not sinfo.get("valid", False):
            checked_anns = "\n    ".join(sinfo.get("ann_candidates", [])[:4])
            checked_imgs = "\n    ".join(sinfo.get("img_candidates", [])[:4])
            raise FileNotFoundError(
                f"Required dataset split 'train' is invalid or missing under {data_root}.\n"
                f"Annotation exists: {sinfo.get('ann_exists')} ({sinfo.get('ann_path')})\n"
                f"Image dir exists: {sinfo.get('img_exists')} ({sinfo.get('img_path')})\n"
                f"Checked annotation locations:\n    {checked_anns}\n"
                f"Checked image locations:\n    {checked_imgs}\n"
                "Ensure data_root contains instances_train.json, annotations/instances_train.json, "
                "or train/instances_train.json with an images/ or train/images/ directory."
            )
        split_cfg = cfg.data.train
        if sinfo.get("ann_exists"):
            split_cfg.ann_file = sinfo["ann_path"]
        if sinfo.get("img_exists"):
            img_p = sinfo["img_path"]
            split_cfg.img_prefix = img_p + ("" if img_p.endswith("/") else "/")
        print(
            f"[INFO] Configured 'train' split: ann_file={split_cfg.ann_file} "
            f"({sinfo.get('num_images', 0)} images, {sinfo.get('num_annotations', 0)} annotations), "
            f"img_prefix={split_cfg.img_prefix}",
            flush=True,
        )

    # 2. Val split
    if hasattr(cfg.data, "val"):
        val_configured = False
        val_sinfo = _discover_split_paths(data_root, "val")

        # (a) Check if val exists under data_root
        if val_sinfo.get("valid", False):
            cfg.data.val.ann_file = val_sinfo["ann_path"]
            img_p = val_sinfo["img_path"]
            cfg.data.val.img_prefix = img_p + ("" if img_p.endswith("/") else "/")
            print(
                f"[INFO] Configured 'val' split from data_root: ann_file={cfg.data.val.ann_file} "
                f"({val_sinfo.get('num_images', 0)} images, {val_sinfo.get('num_annotations', 0)} annotations), "
                f"img_prefix={cfg.data.val.img_prefix}",
                flush=True,
            )
            val_configured = True

        # (b) Check if explicitly passed val_data_root has val
        elif val_data_root:
            v_sinfo = _discover_split_paths(val_data_root, "val")
            if v_sinfo.get("valid", False):
                cfg.data.val.ann_file = v_sinfo["ann_path"]
                img_p = v_sinfo["img_path"]
                cfg.data.val.img_prefix = img_p + ("" if img_p.endswith("/") else "/")
                print(
                    f"[INFO] Configured 'val' split from val_data_root ({val_data_root}): "
                    f"ann_file={cfg.data.val.ann_file} ({v_sinfo.get('num_images', 0)} images, "
                    f"{v_sinfo.get('num_annotations', 0)} annotations), "
                    f"img_prefix={cfg.data.val.img_prefix}",
                    flush=True,
                )
                val_configured = True
            else:
                raise FileNotFoundError(
                    f"Validation split not found under --val-data-root={val_data_root}.\n"
                    f"Annotation exists: {v_sinfo.get('ann_exists')} ({v_sinfo.get('ann_path')})\n"
                    f"Image dir exists: {v_sinfo.get('img_exists')} ({v_sinfo.get('img_path')})"
                )

        # (c) Check if config's existing val paths are already valid on disk
        if not val_configured:
            curr_ann = getattr(cfg.data.val, "ann_file", "")
            curr_img = getattr(cfg.data.val, "img_prefix", "")
            if curr_ann and os.path.isfile(curr_ann) and curr_img and os.path.isdir(curr_img):
                print(
                    f"[INFO] Preserving existing config 'val' split: ann_file={curr_ann}, "
                    f"img_prefix={curr_img}",
                    flush=True,
                )
                val_configured = True

        # (d) Auto-discover original validation dataset from standard locations
        if not val_configured:
            candidate_val_roots = [
                "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/data",
                "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/data/coco",
                "/content/drive/MyDrive/helmet_dataset/coco",
                "/content/dataset_local",
                "data/coco",
                "data",
            ]
            for cand in candidate_val_roots:
                if os.path.isdir(cand):
                    c_sinfo = _discover_split_paths(cand, "val")
                    if c_sinfo.get("valid", False):
                        cfg.data.val.ann_file = c_sinfo["ann_path"]
                        img_p = c_sinfo["img_path"]
                        cfg.data.val.img_prefix = img_p + ("" if img_p.endswith("/") else "/")
                        print(
                            f"[INFO] Discovered original 'val' split at {cand}: "
                            f"ann_file={cfg.data.val.ann_file} ({c_sinfo.get('num_images', 0)} images, "
                            f"{c_sinfo.get('num_annotations', 0)} annotations), "
                            f"img_prefix={cfg.data.val.img_prefix}",
                            flush=True,
                        )
                        val_configured = True
                        break

        # (e) If still not configured:
        if not val_configured:
            if no_validate:
                print(
                    f"[WARNING] 'val' split not found under {data_root} and no original validation set found. "
                    "Proceeding because validation is disabled.",
                    flush=True,
                )
            else:
                raise FileNotFoundError(
                    f"Required dataset split 'val' was not found under {data_root} (training-only root), "
                    "and no separate validation set was located at standard candidate locations.\n"
                    "Please specify the path to your original validation set using --val-data-root "
                    "(e.g. --val-data-root /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data) "
                    "or pass --no-validate."
                )

    # 3. Test split (only patch if test is found under data_root, otherwise preserve untouched)
    if hasattr(cfg.data, "test"):
        test_sinfo = _discover_split_paths(data_root, "test")
        if test_sinfo.get("valid", False):
            cfg.data.test.ann_file = test_sinfo["ann_path"]
            img_p = test_sinfo["img_path"]
            cfg.data.test.img_prefix = img_p + ("" if img_p.endswith("/") else "/")
            print(
                f"[INFO] Configured 'test' split: ann_file={cfg.data.test.ann_file} "
                f"({test_sinfo.get('num_images', 0)} images), img_prefix={cfg.data.test.img_prefix}",
                flush=True,
            )
        else:
            curr_test_ann = getattr(cfg.data.test, "ann_file", "N/A")
            print(
                f"[INFO] Preserving original 'test' split untouched (not in data_root): ann_file={curr_test_ann}",
                flush=True,
            )


def stage_marker(step, total, name, detail="", elapsed=None):
    """Print an unbuffered, timestamped stage progress marker with timing."""
    ts = time.strftime("%H:%M:%S")
    dur_str = f" in {elapsed:.2f}s" if elapsed is not None else ""
    extra = f" [{detail}]" if detail else ""
    msg = f"[{ts}] [Stage {step}/{total}] {name}{extra}{dur_str}"
    print(msg, flush=True)
    try:
        sys.stdout.flush()
    except Exception:
        pass


def _copy_tree_compat(src, dst):
    """Recursively copy files from src to dst in a Python 3.7+ compatible manner with fast local checks."""
    os.makedirs(dst, exist_ok=True)
    count = 0
    size = 0
    items = sorted(os.listdir(src))
    total_items = len(items)
    for idx, item in enumerate(items):
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        if os.path.isdir(s):
            sub_count, sub_size = _copy_tree_compat(s, d)
            count += sub_count
            size += sub_size
            sub_mb = sub_size / (1024 * 1024)
            print(f"[{time.strftime('%H:%M:%S')}]   -> Staged '{item}/' ({sub_count} files, {sub_mb:.1f} MB)", flush=True)
        else:
            if not os.path.exists(d) or os.path.getsize(d) == 0:
                shutil.copy2(s, d)
            count += 1
            try:
                size += os.path.getsize(d)
            except Exception:
                pass
            if total_items > 50 and (idx + 1) % 100 == 0:
                print(f"[{time.strftime('%H:%M:%S')}]     ... copied {idx + 1}/{total_items} files", flush=True)
    return count, size


def stage_dataset_if_needed(data_root, stage_dir="/content/dataset_local", enabled=True):
    """
    Stage dataset from slow Google Drive FUSE storage to fast local NVMe storage.
    Prevents DataLoader multi-process deadlocks and massive I/O delays.
    """
    if not enabled or not data_root:
        return data_root

    stage_dir = os.path.abspath(stage_dir)
    
    # Fast-path check: Is stage_dir already staged with images and annotations?
    if os.path.abspath(data_root) != stage_dir:
        train_ann_coco = os.path.join(stage_dir, "annotations", "instances_train.json")
        train_ann_flat = os.path.join(stage_dir, "instances_train.json")
        train_ann_nested = os.path.join(stage_dir, "train", "instances_train.json")
        train_img_flat = os.path.join(stage_dir, "train", "images")
        train_img_direct = os.path.join(stage_dir, "images")
        
        has_ann = os.path.isfile(train_ann_flat) or os.path.isfile(train_ann_coco) or os.path.isfile(train_ann_nested)
        img_dir = train_img_flat if os.path.isdir(train_img_flat) else (train_img_direct if os.path.isdir(train_img_direct) else None)
        if has_ann and img_dir and len(os.listdir(img_dir)) >= 300:
            print(f"[{time.strftime('%H:%M:%S')}] [INFO] Dataset already staged and verified at: {stage_dir} (skipping re-copy)", flush=True)
            return stage_dir

    # Only auto-stage if data_root appears to be on Google Drive (or if forced via env)
    is_gdrive = data_root.startswith("/content/drive/") or "/MyDrive" in data_root
    if not is_gdrive and not os.environ.get("CODETR_FORCE_STAGE"):
        return data_root
        
    if os.path.abspath(data_root) == stage_dir:
        return data_root

    print(f"[{time.strftime('%H:%M:%S')}] [INFO] Google Drive dataset detected at: {data_root}", flush=True)
    print(f"[{time.strftime('%H:%M:%S')}] [INFO] Staging dataset to local fast disk: {stage_dir} ...", flush=True)
    start_time = time.time()

    os.makedirs(stage_dir, exist_ok=True)
    
    # Safely stage ONLY required dataset components to avoid recursive copy bugs
    copied_files = 0
    total_bytes = 0
    
    # Discover actual dataset root if data_root points to a parent/project directory
    actual_data_root = data_root
    for candidate in [
        data_root,
        os.path.join(data_root, "data"),
        os.path.join(data_root, "data", "coco"),
        os.path.join(data_root, "dataset")
    ]:
        if os.path.isdir(os.path.join(candidate, "train", "images")) or \
           os.path.isdir(os.path.join(candidate, "images")) or \
           os.path.isfile(os.path.join(candidate, "instances_train.json")) or \
           os.path.isfile(os.path.join(candidate, "annotations", "instances_train.json")) or \
           os.path.isfile(os.path.join(candidate, "train", "instances_train.json")):
            actual_data_root = candidate
            break

    # 1. Stage specific split directories (images and labels)
    for split_dir in ["train", "vaid", "test"]:
        for sub_dir in ["images", "labels"]:
            src_sub = os.path.join(actual_data_root, split_dir, sub_dir)
            dst_sub = os.path.join(stage_dir, split_dir, sub_dir)
            if os.path.isdir(src_sub):
                c, s = _copy_tree_compat(src_sub, dst_sub)
                copied_files += c
                total_bytes += s

    # 1b. Stage top-level images/ directory if present
    if os.path.isdir(os.path.join(actual_data_root, "images")):
        c, s = _copy_tree_compat(os.path.join(actual_data_root, "images"), os.path.join(stage_dir, "images"))
        copied_files += c
        total_bytes += s
                
    # 2. Stage COCO annotation JSON files (either flat in data_root or inside split/annotations dirs)
    for json_file in ["instances_train.json", "instances_val.json", "instances_test.json"]:
        for base_dir in [actual_data_root, os.path.join(actual_data_root, "annotations"), os.path.join(actual_data_root, "train"), os.path.join(actual_data_root, "vaid"), os.path.join(actual_data_root, "test")]:
            src_json = os.path.join(base_dir, json_file)
            if os.path.isfile(src_json):
                # Calculate relative path to maintain structure
                rel_path = os.path.relpath(src_json, actual_data_root)
                dst_json = os.path.join(stage_dir, rel_path)
                os.makedirs(os.path.dirname(dst_json), exist_ok=True)
                
                if not os.path.exists(dst_json) or os.path.getsize(dst_json) == 0:
                    shutil.copy2(src_json, dst_json)
                copied_files += 1
                total_bytes += os.path.getsize(dst_json)
                print(f"[{time.strftime('%H:%M:%S')}]   -> Staged '{rel_path}'", flush=True)

    elapsed = time.time() - start_time
    mb = total_bytes / (1024 * 1024)
    print(
        f"[{time.strftime('%H:%M:%S')}] [INFO] Staging complete: {copied_files} files ({mb:.1f} MB) in {elapsed:.2f}s.",
        flush=True,
    )
    return stage_dir


def _download_with_progress(url, dest_path):
    """Download a large file with explicit timestamped progress updates every 10% or 5 seconds."""
    import urllib.request
    print(f"[{time.strftime('%H:%M:%S')}] [Download] Fetching weights from: {url}", flush=True)
    print(f"[{time.strftime('%H:%M:%S')}] [Download] Destination: {dest_path}", flush=True)

    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    temp_path = dest_path + ".tmp"

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    )

    start_time = time.time()
    last_log_time = start_time
    last_log_percent = 0

    with urllib.request.urlopen(req) as response, open(temp_path, "wb") as out_file:
        total_size = int(response.info().get("Content-Length", 0))
        downloaded = 0
        chunk_size = 1024 * 1024  # 1MB chunks

        while True:
            chunk = response.read(chunk_size)
            if not chunk:
                break
            out_file.write(chunk)
            downloaded += len(chunk)
            now = time.time()
            if total_size > 0:
                percent = int(downloaded * 100 / total_size)
                if percent >= last_log_percent + 10 or (now - last_log_time) >= 5.0:
                    mb_down = downloaded / (1024 * 1024)
                    mb_total = total_size / (1024 * 1024)
                    elapsed = now - start_time
                    speed = mb_down / elapsed if elapsed > 0 else 0
                    eta = (total_size - downloaded) / (speed * 1024 * 1024) if speed > 0 else 0
                    print(
                        f"[{time.strftime('%H:%M:%S')}] [Download] {percent}% "
                        f"({mb_down:.1f}/{mb_total:.1f} MB, {speed:.1f} MB/s, ETA: {eta:.0f}s)",
                        flush=True
                    )
                    last_log_percent = percent
                    last_log_time = now

    os.rename(temp_path, dest_path)
    elapsed = time.time() - start_time
    mb = os.path.getsize(dest_path) / (1024 * 1024)
    print(
        f"[{time.strftime('%H:%M:%S')}] [Download] Download complete: {mb:.1f} MB in {elapsed:.1f}s.",
        flush=True
    )
    return dest_path


def _resolve_swin_backbone(cfg, swin_arg=None):
    """
    Ensure the Swin-L backbone weights are located locally to prevent long download freezes.
    If downloading is necessary, performs it with visible progress and caches to Google Drive.
    """
    if not hasattr(cfg, "model") or not hasattr(cfg.model, "backbone"):
        return
    if not hasattr(cfg.model.backbone, "init_cfg"):
        return

    init_cfg = cfg.model.backbone.init_cfg
    if not isinstance(init_cfg, dict) or init_cfg.get("type") != "Pretrained":
        return

    checkpoint = init_cfg.get("checkpoint")
    if not checkpoint or "swin" not in checkpoint.lower():
        return

    # If already a local file that exists, nothing to do
    if os.path.isfile(checkpoint):
        print(f"[{time.strftime('%H:%M:%S')}] [INFO] Using local Swin-L backbone checkpoint: {checkpoint}", flush=True)
        return

    # Fast path: already cached in user's torch hub directory on local fast disk
    hub_cache = os.path.expanduser("~/.cache/torch/hub/checkpoints/swin_large_patch4_window12_384_22k.pth")
    if os.path.isfile(hub_cache) and os.path.getsize(hub_cache) > 500 * 1024 * 1024:
        print(f"[{time.strftime('%H:%M:%S')}] [INFO] Using cached Swin-L weights on local SSD: {hub_cache}", flush=True)
        init_cfg["checkpoint"] = hub_cache
        return

    print(f"[{time.strftime('%H:%M:%S')}] [INFO] Searching local directories and Google Drive for Swin-L backbone...", flush=True)
    candidates = []
    if swin_arg and os.path.isfile(swin_arg):
        candidates.append(swin_arg)

    env_swin = os.environ.get("SWIN_PRETRAINED")
    if env_swin and os.path.isfile(env_swin):
        candidates.append(env_swin)

    drive_cache_dir = "/content/drive/MyDrive/Smart-Helmet-Violation-Detection"
    drive_ckpt = os.path.join(drive_cache_dir, "swin_large_patch4_window12_384_22k.pth")

    if os.path.isdir("/content/drive"):
        candidates.extend([
            drive_ckpt,
            "/content/drive/MyDrive/swin_large_patch4_window12_384_22k.pth",
            "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_codetr_swin_large/swin_large_patch4_window12_384_22k.pth",
            "/content/drive/MyDrive/checkpoints/swin_large_patch4_window12_384_22k.pth",
            "/content/drive/MyDrive/weights/swin_large_patch4_window12_384_22k.pth",
        ])

    found_local = None
    for cand in candidates:
        if cand and os.path.isfile(cand) and os.path.getsize(cand) > 500 * 1024 * 1024:
            found_local = cand
            break

    if found_local:
        print(f"[{time.strftime('%H:%M:%S')}] [INFO] Found local Swin-L checkpoint: {found_local}", flush=True)
        if found_local != hub_cache and not os.path.isfile(hub_cache):
            try:
                os.makedirs(os.path.dirname(hub_cache), exist_ok=True)
                print(f"[{time.strftime('%H:%M:%S')}] [INFO] Caching Swin-L weights to local SSD: {hub_cache} ...", flush=True)
                shutil.copy2(found_local, hub_cache)
                init_cfg["checkpoint"] = hub_cache
            except Exception as e:
                print(f"[{time.strftime('%H:%M:%S')}] [WARNING] Could not copy to cache ({e}), pointing directly to {found_local}", flush=True)
                init_cfg["checkpoint"] = found_local
        else:
            init_cfg["checkpoint"] = found_local
    else:
        # Download with explicit progress to hub_cache
        print(
            f"[{time.strftime('%H:%M:%S')}] [INFO] Swin-L backbone not cached locally (~768MB). Starting download with progress...",
            flush=True,
        )
        try:
            _download_with_progress(checkpoint, hub_cache)
            init_cfg["checkpoint"] = hub_cache

            # Also cache to Google Drive if Drive is mounted so future sessions skip downloading
            if os.path.isdir(drive_cache_dir) and not os.path.isfile(drive_ckpt):
                try:
                    print(f"[{time.strftime('%H:%M:%S')}] [INFO] Saving Swin-L weights to Google Drive for future runs: {drive_ckpt} ...", flush=True)
                    shutil.copy2(hub_cache, drive_ckpt)
                except Exception as e:
                    print(f"[{time.strftime('%H:%M:%S')}] [WARNING] Could not save to Google Drive ({e})", flush=True)
        except Exception as exc:
            print(f"[{time.strftime('%H:%M:%S')}] [WARNING] Custom download failed ({exc}); falling back to standard loader", flush=True)


class TrainingDiagnosticComplete(Exception):
    """Sentinel exception raised by TrainingDiagnosticHook to terminate training after iteration 1."""
    def __init__(self, stats=None):
        self.stats = stats or {}
        super().__init__("Training diagnostic iteration 1 completed successfully.")


def install_deformable_attention_fp16_bridge():
    """Install FP16 compatibility bridge for MMCV's MultiScaleDeformableAttnFunction.

    Allows the surrounding Co-DETR model to train in mixed precision (FP16/AMP)
    while the custom CUDA deformable attention kernel (which only supports float32/float64)
    executes safely in float32.
    """
    try:
        import torch
        import mmcv.ops.multi_scale_deform_attn as msda_mod
        from mmcv.cnn.bricks.registry import ATTENTION

        # Use the exact MMCV 1.5.0 symbol: MultiScaleDeformableAttnFunction
        func_cls = getattr(msda_mod, 'MultiScaleDeformableAttnFunction', None)
        if func_cls is None:
            func_cls = getattr(msda_mod, 'MultiScaleDeformAttnFunction', None)

        if func_cls is None:
            print(f"[{time.strftime('%H:%M:%S')}] [FP16 WARNING] Could not locate MultiScaleDeformableAttnFunction in mmcv.ops.multi_scale_deform_attn", flush=True)
            return False

        if getattr(func_cls, '_fp16_patched', False):
            return True

        orig_forward = func_cls.forward
        orig_backward = func_cls.backward

        @staticmethod
        def _fp16_safe_forward(ctx, value, spatial_shapes, level_start_index,
                               sampling_locations, attention_weights, im2col_step):
            ctx.spatial_shapes = spatial_shapes
            ctx.level_start_index = level_start_index
            ctx.im2col_step = im2col_step
            is_half = (value.dtype == torch.float16)
            ctx.is_half = is_half

            if is_half:
                value = value.float()
                sampling_locations = sampling_locations.float()
                attention_weights = attention_weights.float()

            out = orig_forward(ctx, value, spatial_shapes, level_start_index,
                               sampling_locations, attention_weights, im2col_step)
            if is_half:
                out = out.half()
            return out

        @staticmethod
        def _fp16_safe_backward(ctx, grad_output):
            is_half = getattr(ctx, 'is_half', False)
            if is_half and grad_output.dtype == torch.float16:
                grad_output = grad_output.float()

            grads = orig_backward(ctx, grad_output)
            if is_half:
                grads = tuple(
                    g.half() if (g is not None and torch.is_tensor(g) and g.is_floating_point()) else g
                    for g in grads
                )
            return grads

        func_cls.forward = _fp16_safe_forward
        func_cls.backward = _fp16_safe_backward
        func_cls._fp16_patched = True

        attn_cls = getattr(msda_mod, 'MultiScaleDeformableAttention', None)
        if attn_cls is not None and 'MultiScaleDeformAttn' not in ATTENTION:
            ATTENTION.register_module(name='MultiScaleDeformAttn', module=attn_cls)

        print(f"[{time.strftime('%H:%M:%S')}] [FP16] MultiScaleDeformableAttnFunction FP32 kernel bridge installed", flush=True)
        return True
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [FP16 WARNING] Failed to install MultiScaleDeformableAttnFunction bridge: {e}", flush=True)
        return False


def patch_codetr_fp16_target_assignment():
    """Install FP16 compatibility patches for Co-DETR target assignment and loss paths.

    Prevents PyTorch 1.11 runtime errors where Float ground truth / cost matrices
    interact with Half model predictions:
      - RuntimeError: Index put requires the source and destination dtypes match,
        got Half for the destination and Float for the source.
      - RuntimeError: Index put requires the source and destination dtypes match,
        got Float for the destination and Half for the source.
      - ValueError: matrix contains invalid numeric entries (scipy linear_sum_assignment).
    """
    try:
        import torch
    except ImportError:
        return False

    try:
        import projects
    except ImportError:
        # Co-DETR repository / projects plugin not on sys.path in this environment
        return False

    # 1. Patch CoDeformDETRHead & CoDINOHead target assignment
    try:
        from projects.models.co_deformable_detr_head import CoDeformDETRHead
        from projects.models.co_dino_head import CoDINOHead
        from mmdet.core.bbox.transforms import bbox_xyxy_to_cxcywh

        def _get_target_single_fp16_safe(self, cls_score, bbox_pred, gt_bboxes,
                                         gt_labels, img_meta, gt_bboxes_ignore=None):
            num_bboxes = bbox_pred.size(0)
            assign_result = self.assigner.assign(bbox_pred, cls_score, gt_bboxes,
                                                 gt_labels, img_meta, gt_bboxes_ignore)
            sampling_result = self.sampler.sample(assign_result, bbox_pred, gt_bboxes)
            pos_inds = sampling_result.pos_inds
            neg_inds = sampling_result.neg_inds

            labels = gt_bboxes.new_full((num_bboxes, ), self.num_classes, dtype=torch.long)
            labels[pos_inds] = gt_labels[sampling_result.pos_assigned_gt_inds]
            label_weights = gt_bboxes.new_ones(num_bboxes)

            # bbox targets: preserve float precision during normalization & conversion,
            # then match destination dtype upon indexed assignment to avoid PyTorch 1.11 Index put error
            bbox_targets = torch.zeros_like(bbox_pred)
            bbox_weights = torch.zeros_like(bbox_pred)
            bbox_weights[pos_inds] = 1.0
            img_h, img_w, _ = img_meta['img_shape']

            factor = bbox_pred.new_tensor([img_w, img_h, img_w, img_h]).unsqueeze(0)
            pos_gt_bboxes_normalized = sampling_result.pos_gt_bboxes / factor
            pos_gt_bboxes_targets = bbox_xyxy_to_cxcywh(pos_gt_bboxes_normalized)
            bbox_targets[pos_inds] = pos_gt_bboxes_targets.to(bbox_targets.dtype)

            return (labels, label_weights, bbox_targets, bbox_weights, pos_inds, neg_inds)

        CoDeformDETRHead._get_target_single = _get_target_single_fp16_safe
        CoDeformDETRHead._fp16_target_patched = True
        CoDINOHead._get_target_single = _get_target_single_fp16_safe
        CoDINOHead._fp16_target_patched = True
        print(f"[{time.strftime('%H:%M:%S')}] [FP16] CoDeformDETRHead & CoDINOHead target assignment patch applied", flush=True)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [FP16 ERROR] CoDeformDETRHead / CoDINOHead target assignment patch failed: {e}", flush=True)
        raise

    # 2. Patch CoDINOHead denoising targets and loss methods
    try:
        from projects.models.co_dino_head import CoDINOHead
        from mmdet.core.bbox.transforms import bbox_xyxy_to_cxcywh, bbox_cxcywh_to_xyxy
        from mmdet.core.bbox.iou_calculators import bbox_overlaps
        from mmdet.core.utils import reduce_mean

        if not getattr(CoDINOHead, '_fp16_dn_target_patched', False):
            def _get_dn_target_single_fp16_safe(self, dn_bbox_pred, gt_bboxes, gt_labels,
                                                img_meta, dn_meta):
                num_groups = dn_meta['num_dn_group']
                pad_size = dn_meta['pad_size']
                assert pad_size % num_groups == 0
                single_pad = pad_size // num_groups
                num_bboxes = dn_bbox_pred.size(0)

                device = gt_labels.device if hasattr(gt_labels, 'device') else dn_bbox_pred.device
                if len(gt_labels) > 0:
                    t = torch.arange(0, len(gt_labels), device=device).long()
                    t = t.unsqueeze(0).repeat(num_groups, 1)
                    pos_assigned_gt_inds = t.flatten()
                    pos_inds = (torch.arange(num_groups, device=device) * single_pad).long().unsqueeze(1) + t
                    pos_inds = pos_inds.flatten()
                else:
                    pos_inds = pos_assigned_gt_inds = torch.tensor([], device=device, dtype=torch.long)
                neg_inds = pos_inds + single_pad // 2

                labels = gt_bboxes.new_full((num_bboxes, ), self.num_classes, dtype=torch.long)
                labels[pos_inds] = gt_labels[pos_assigned_gt_inds]
                label_weights = gt_bboxes.new_ones(num_bboxes)

                bbox_targets = torch.zeros_like(dn_bbox_pred)
                bbox_weights = torch.zeros_like(dn_bbox_pred)
                bbox_weights[pos_inds] = 1.0
                img_h, img_w, _ = img_meta['img_shape']

                factor = dn_bbox_pred.new_tensor([img_w, img_h, img_w, img_h]).unsqueeze(0)
                gt_bboxes_normalized = gt_bboxes / factor
                gt_bboxes_targets = bbox_xyxy_to_cxcywh(gt_bboxes_normalized)
                bbox_targets[pos_inds] = gt_bboxes_targets.repeat([num_groups, 1]).to(bbox_targets.dtype)

                return (labels, label_weights, bbox_targets, bbox_weights, pos_inds, neg_inds)

            CoDINOHead._get_dn_target_single = _get_dn_target_single_fp16_safe

            def loss_dn_single_fp16_safe(self, dn_cls_scores, dn_bbox_preds, gt_bboxes_list,
                                         gt_labels_list, img_metas, dn_meta):
                num_imgs = dn_cls_scores.size(0)
                bbox_preds_list = [dn_bbox_preds[i] for i in range(num_imgs)]
                cls_reg_targets = self.get_dn_target(bbox_preds_list, gt_bboxes_list,
                                                     gt_labels_list, img_metas, dn_meta)
                (labels_list, label_weights_list, bbox_targets_list, bbox_weights_list,
                 num_total_pos, num_total_neg) = cls_reg_targets
                labels = torch.cat(labels_list, 0)
                label_weights = torch.cat(label_weights_list, 0)
                bbox_targets = torch.cat(bbox_targets_list, 0)
                bbox_weights = torch.cat(bbox_weights_list, 0)

                cls_scores = dn_cls_scores.reshape(-1, self.cls_out_channels)
                cls_avg_factor = num_total_pos * 1.0 + num_total_neg * self.bg_cls_weight
                if self.sync_cls_avg_factor:
                    cls_avg_factor = reduce_mean(cls_scores.new_tensor([cls_avg_factor]))
                cls_avg_factor = max(cls_avg_factor, 1)

                if len(cls_scores) > 0:
                    bg_class_ind = self.num_classes
                    pos_inds = ((labels >= 0) & (labels < bg_class_ind)).nonzero().squeeze(1)
                    scores = label_weights.new_zeros(labels.shape)
                    pos_bbox_targets = bbox_targets[pos_inds]
                    pos_decode_bbox_targets = bbox_cxcywh_to_xyxy(pos_bbox_targets)
                    pos_bbox_pred = dn_bbox_preds.reshape(-1, 4)[pos_inds]
                    pos_decode_bbox_pred = bbox_cxcywh_to_xyxy(pos_bbox_pred)
                    overlaps = bbox_overlaps(
                        pos_decode_bbox_pred.detach(),
                        pos_decode_bbox_targets,
                        is_aligned=True)
                    scores[pos_inds] = overlaps.to(scores.dtype)
                    loss_cls = self.loss_cls(
                        cls_scores, (labels, scores),
                        weight=label_weights,
                        avg_factor=cls_avg_factor)
                else:
                    loss_cls = torch.zeros(1, dtype=cls_scores.dtype, device=cls_scores.device)

                num_total_pos = loss_cls.new_tensor([num_total_pos])
                num_total_pos = torch.clamp(reduce_mean(num_total_pos), min=1).item()

                factors = []
                for img_meta, bbox_pred in zip(img_metas, dn_bbox_preds):
                    img_h, img_w, _ = img_meta['img_shape']
                    factor = bbox_pred.new_tensor([img_w, img_h, img_w, img_h]).unsqueeze(0).repeat(
                        bbox_pred.size(0), 1)
                    factors.append(factor)
                factors = torch.cat(factors, 0)

                bbox_preds = dn_bbox_preds.reshape(-1, 4)
                bboxes = bbox_cxcywh_to_xyxy(bbox_preds) * factors
                bboxes_gt = bbox_cxcywh_to_xyxy(bbox_targets) * factors

                loss_iou = self.loss_iou(bboxes, bboxes_gt, bbox_weights, avg_factor=num_total_pos)
                loss_bbox = self.loss_bbox(bbox_preds, bbox_targets, bbox_weights, avg_factor=num_total_pos)
                return loss_cls, loss_bbox, loss_iou

            CoDINOHead.loss_dn_single = loss_dn_single_fp16_safe

            def loss_single_fp16_safe(self, cls_scores, bbox_preds, gt_bboxes_list,
                                      gt_labels_list, img_metas, gt_bboxes_ignore_list=None):
                num_imgs = cls_scores.size(0)
                cls_scores_list = [cls_scores[i] for i in range(num_imgs)]
                bbox_preds_list = [bbox_preds[i] for i in range(num_imgs)]
                cls_reg_targets = self.get_targets(cls_scores_list, bbox_preds_list,
                                                   gt_bboxes_list, gt_labels_list,
                                                   img_metas, gt_bboxes_ignore_list)
                (labels_list, label_weights_list, bbox_targets_list, bbox_weights_list,
                 num_total_pos, num_total_neg) = cls_reg_targets
                labels = torch.cat(labels_list, 0)
                label_weights = torch.cat(label_weights_list, 0)
                bbox_targets = torch.cat(bbox_targets_list, 0)
                bbox_weights = torch.cat(bbox_weights_list, 0)

                cls_scores = cls_scores.reshape(-1, self.cls_out_channels)
                cls_avg_factor = num_total_pos * 1.0 + num_total_neg * self.bg_cls_weight
                if self.sync_cls_avg_factor:
                    cls_avg_factor = reduce_mean(cls_scores.new_tensor([cls_avg_factor]))
                cls_avg_factor = max(cls_avg_factor, 1)

                bg_class_ind = self.num_classes
                pos_inds = ((labels >= 0) & (labels < bg_class_ind)).nonzero().squeeze(1)
                scores = label_weights.new_zeros(labels.shape)
                pos_bbox_targets = bbox_targets[pos_inds]
                pos_decode_bbox_targets = bbox_cxcywh_to_xyxy(pos_bbox_targets)
                pos_bbox_pred = bbox_preds.reshape(-1, 4)[pos_inds]
                pos_decode_bbox_pred = bbox_cxcywh_to_xyxy(pos_bbox_pred)
                overlaps = bbox_overlaps(
                    pos_decode_bbox_pred.detach(),
                    pos_decode_bbox_targets,
                    is_aligned=True)
                scores[pos_inds] = overlaps.to(scores.dtype)
                loss_cls = self.loss_cls(
                    cls_scores, (labels, scores),
                    weight=label_weights,
                    avg_factor=cls_avg_factor)

                num_total_pos = loss_cls.new_tensor([num_total_pos])
                num_total_pos = torch.clamp(reduce_mean(num_total_pos), min=1).item()

                factors = []
                for img_meta, bbox_pred in zip(img_metas, bbox_preds):
                    img_h, img_w, _ = img_meta['img_shape']
                    factor = bbox_pred.new_tensor([img_w, img_h, img_w, img_h]).unsqueeze(0).repeat(
                        bbox_pred.size(0), 1)
                    factors.append(factor)
                factors = torch.cat(factors, 0)

                bbox_preds = bbox_preds.reshape(-1, 4)
                bboxes = bbox_cxcywh_to_xyxy(bbox_preds) * factors
                bboxes_gt = bbox_cxcywh_to_xyxy(bbox_targets) * factors

                loss_iou = self.loss_iou(bboxes, bboxes_gt, bbox_weights, avg_factor=num_total_pos)
                loss_bbox = self.loss_bbox(bbox_preds, bbox_targets, bbox_weights, avg_factor=num_total_pos)
                return loss_cls, loss_bbox, loss_iou

            CoDINOHead.loss_single = loss_single_fp16_safe

            if hasattr(CoDINOHead, 'loss_single_aux'):
                def loss_single_aux_fp16_safe(self, cls_scores, bbox_preds, gt_bboxes_list,
                                              gt_labels_list, img_metas, gt_bboxes_ignore_list=None):
                    num_imgs = cls_scores.size(0)
                    cls_scores_list = [cls_scores[i] for i in range(num_imgs)]
                    bbox_preds_list = [bbox_preds[i] for i in range(num_imgs)]
                    cls_reg_targets = self.get_targets(cls_scores_list, bbox_preds_list,
                                                       gt_bboxes_list, gt_labels_list,
                                                       img_metas, gt_bboxes_ignore_list)
                    (labels_list, label_weights_list, bbox_targets_list, bbox_weights_list,
                     num_total_pos, num_total_neg) = cls_reg_targets
                    labels = torch.cat(labels_list, 0)
                    label_weights = torch.cat(label_weights_list, 0)
                    bbox_targets = torch.cat(bbox_targets_list, 0)
                    bbox_weights = torch.cat(bbox_weights_list, 0)

                    cls_scores = cls_scores.reshape(-1, self.cls_out_channels)
                    cls_avg_factor = num_total_pos * 1.0 + num_total_neg * self.bg_cls_weight
                    if self.sync_cls_avg_factor:
                        cls_avg_factor = reduce_mean(cls_scores.new_tensor([cls_avg_factor]))
                    cls_avg_factor = max(cls_avg_factor, 1)

                    bg_class_ind = self.num_classes
                    pos_inds = ((labels >= 0) & (labels < bg_class_ind)).nonzero().squeeze(1)
                    scores = label_weights.new_zeros(labels.shape)
                    pos_bbox_targets = bbox_targets[pos_inds]
                    pos_decode_bbox_targets = bbox_cxcywh_to_xyxy(pos_bbox_targets)
                    pos_bbox_pred = bbox_preds.reshape(-1, 4)[pos_inds]
                    pos_decode_bbox_pred = bbox_cxcywh_to_xyxy(pos_bbox_pred)
                    overlaps = bbox_overlaps(
                        pos_decode_bbox_pred.detach(),
                        pos_decode_bbox_targets,
                        is_aligned=True)
                    scores[pos_inds] = overlaps.to(scores.dtype)
                    loss_cls = self.loss_cls(
                        cls_scores, (labels, scores),
                        weight=label_weights,
                        avg_factor=cls_avg_factor)

                    num_total_pos = loss_cls.new_tensor([num_total_pos])
                    num_total_pos = torch.clamp(reduce_mean(num_total_pos), min=1).item()

                    factors = []
                    for img_meta, bbox_pred in zip(img_metas, bbox_preds):
                        img_h, img_w, _ = img_meta['img_shape']
                        factor = bbox_pred.new_tensor([img_w, img_h, img_w, img_h]).unsqueeze(0).repeat(
                            bbox_pred.size(0), 1)
                        factors.append(factor)
                    factors = torch.cat(factors, 0)

                    bbox_preds = bbox_preds.reshape(-1, 4)
                    bboxes = bbox_cxcywh_to_xyxy(bbox_preds) * factors
                    bboxes_gt = bbox_cxcywh_to_xyxy(bbox_targets) * factors

                    loss_iou = self.loss_iou(bboxes, bboxes_gt, bbox_weights, avg_factor=num_total_pos)
                    loss_bbox = self.loss_bbox(bbox_preds, bbox_targets, bbox_weights, avg_factor=num_total_pos)
                    return loss_cls, loss_bbox, loss_iou

                CoDINOHead.loss_single_aux = loss_single_aux_fp16_safe

            CoDINOHead._fp16_dn_target_patched = True
            print(f"[{time.strftime('%H:%M:%S')}] [FP16] CoDINOHead dn_target and loss dtype patches applied", flush=True)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [FP16 NOTE] CoDINOHead patch skipped: {e}", flush=True)

    # 3. Patch DnQueryGenerator in query_denoising
    try:
        from projects.models.query_denoising import DnQueryGenerator
        from mmdet.models.utils.transformer import inverse_sigmoid
        from mmdet.core.bbox.transforms import bbox_xyxy_to_cxcywh

        if not getattr(DnQueryGenerator, '_fp16_query_dn_patched', False):
            def dn_call_fp16_safe(self, gt_bboxes, gt_labels=None, label_enc=None, img_metas=None):
                if gt_labels is not None:
                    assert len(gt_bboxes) == len(gt_labels)
                assert gt_labels is not None and label_enc is not None and img_metas is not None
                batch_size = len(gt_bboxes)

                gt_bboxes_list = []
                for img_meta, bboxes in zip(img_metas, gt_bboxes):
                    img_h, img_w, _ = img_meta['img_shape']
                    factor = bboxes.new_tensor([img_w, img_h, img_w, img_h]).unsqueeze(0)
                    bboxes_normalized = bbox_xyxy_to_cxcywh(bboxes) / factor
                    gt_bboxes_list.append(bboxes_normalized)
                gt_bboxes = gt_bboxes_list

                known = [torch.ones_like(labels) for labels in gt_labels]
                known_num = [sum(k) for k in known]
                num_groups = self.get_num_groups(int(max(known_num)))

                unmask_bbox = unmask_label = torch.cat(known)
                labels = torch.cat(gt_labels)
                boxes = torch.cat(gt_bboxes)
                batch_idx = torch.cat([torch.full_like(t.long(), i) for i, t in enumerate(gt_labels)])

                known_indice = torch.nonzero(unmask_label + unmask_bbox).view(-1)
                known_indice = known_indice.repeat(2 * num_groups, 1).view(-1)
                known_labels = labels.repeat(2 * num_groups, 1).view(-1)
                known_bid = batch_idx.repeat(2 * num_groups, 1).view(-1)
                known_bboxs = boxes.repeat(2 * num_groups, 1)
                known_labels_expand = known_labels.clone()
                known_bbox_expand = known_bboxs.clone()

                if self.label_noise_scale > 0:
                    p = torch.rand_like(known_labels_expand.float())
                    chosen_indice = torch.nonzero(p < (self.label_noise_scale * 0.5)).view(-1)
                    new_label = torch.randint_like(chosen_indice, 0, self.num_classes)
                    known_labels_expand.scatter_(0, chosen_indice, new_label)
                single_pad = int(max(known_num))
                pad_size = int(single_pad * 2 * num_groups)

                if self.box_noise_scale > 0:
                    known_bbox_ = torch.zeros_like(known_bboxs)
                    known_bbox_[:, :2] = known_bboxs[:, :2] - known_bboxs[:, 2:] / 2
                    known_bbox_[:, 2:] = known_bboxs[:, :2] + known_bboxs[:, 2:] / 2
                    diff = torch.zeros_like(known_bboxs)
                    diff[:, :2] = known_bboxs[:, 2:] / 2
                    diff[:, 2:] = known_bboxs[:, 2:] / 2
                    rand_sign = torch.randint_like(known_bboxs, low=0, high=2, dtype=torch.float32)
                    rand_sign = rand_sign * 2.0 - 1.0
                    rand_part = torch.rand_like(known_bboxs)
                    rand_part = (rand_part >= 0.5).float() * (rand_part - 1.0) + (rand_part < 0.5).float() * (1.0 - rand_part)
                    rand_part = torch.mul(rand_sign, rand_part)
                    device = boxes.device if hasattr(boxes, 'device') else 'cuda'
                    known_bbox_ = known_bbox_ + torch.mul(rand_part, diff).to(device) * self.box_noise_scale
                    known_bbox_ = known_bbox_.clamp(min=0.0, max=1.0)
                    known_bbox_expand[:, :2] = (known_bbox_[:, :2] + known_bbox_[:, 2:]) / 2
                    known_bbox_expand[:, 2:] = known_bbox_[:, 2:] - known_bbox_[:, :2]

                device = boxes.device if hasattr(boxes, 'device') else 'cuda'
                m = known_labels_expand.long().to(device)
                input_label_embed = label_enc(m)
                input_bbox_embed = inverse_sigmoid(known_bbox_expand, eps=1e-3)

                padding_label = torch.zeros(pad_size, self.hidden_dim, dtype=input_label_embed.dtype, device=device)
                padding_bbox = torch.zeros(pad_size, 4, dtype=input_bbox_embed.dtype, device=device)

                input_query_label = padding_label.repeat(batch_size, 1, 1)
                input_query_bbox = padding_bbox.repeat(batch_size, 1, 1)

                if len(known_num):
                    map_known_indice = torch.cat([torch.arange(num, device=device) for num in known_num])
                    map_known_indice = torch.cat([map_known_indice + single_pad * i for i in range(2 * num_groups)]).long()
                if len(known_bid):
                    input_query_label[(known_bid.long(), map_known_indice)] = input_label_embed.to(input_query_label.dtype)
                    input_query_bbox[(known_bid.long(), map_known_indice)] = input_bbox_embed.to(input_query_bbox.dtype)

                tgt_size = pad_size + self.num_queries
                attn_mask = torch.ones(tgt_size, tgt_size, device=device) < 0
                attn_mask[pad_size:, :pad_size] = True
                for i in range(num_groups):
                    if i == 0:
                        attn_mask[single_pad * 2 * i:single_pad * 2 * (i + 1), single_pad * 2 * (i + 1):pad_size] = True
                    if i == num_groups - 1:
                        attn_mask[single_pad * 2 * i:single_pad * 2 * (i + 1), :single_pad * i * 2] = True
                    else:
                        attn_mask[single_pad * 2 * i:single_pad * 2 * (i + 1), single_pad * 2 * (i + 1):pad_size] = True
                        attn_mask[single_pad * 2 * i:single_pad * 2 * (i + 1), :single_pad * 2 * i] = True

                dn_meta = {'pad_size': pad_size, 'num_dn_group': num_groups}
                return input_query_label, input_query_bbox, attn_mask, dn_meta

            DnQueryGenerator.__call__ = dn_call_fp16_safe
            DnQueryGenerator._fp16_query_dn_patched = True
            try:
                from projects.models.query_denoising import CdnQueryGenerator
                CdnQueryGenerator.__call__ = dn_call_fp16_safe
                CdnQueryGenerator._fp16_query_dn_patched = True
            except Exception:
                pass
            print(f"[{time.strftime('%H:%M:%S')}] [FP16] DnQueryGenerator & CdnQueryGenerator query denoising patch applied", flush=True)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [FP16 NOTE] DnQueryGenerator patch skipped: {e}", flush=True)

    # 4. Patch HungarianAssigner for float32 matching & cost sanitization
    try:
        from mmdet.core.bbox.assigners.hungarian_assigner import HungarianAssigner
        from mmdet.core.bbox.transforms import bbox_cxcywh_to_xyxy
        from mmdet.core.bbox.assigners.assign_result import AssignResult
        try:
            from scipy.optimize import linear_sum_assignment
        except ImportError:
            linear_sum_assignment = None

        if not getattr(HungarianAssigner, '_fp16_cost_patched', False):
            def assign_fp16_safe(self, bbox_pred, cls_score, gt_bboxes, gt_labels,
                                 img_meta, gt_bboxes_ignore=None):
                assert gt_bboxes_ignore is None, 'Only support gt_bboxes_ignore is None.'
                num_gts, num_bboxes = gt_bboxes.size(0), bbox_pred.size(0)

                assigned_gt_inds = bbox_pred.new_full((num_bboxes, ), 0, dtype=torch.long)
                assigned_labels = bbox_pred.new_full((num_bboxes, ), -1, dtype=torch.long)
                if num_gts == 0 or num_bboxes == 0:
                    return AssignResult(num_gts, assigned_gt_inds, None, labels=assigned_labels)

                img_h, img_w, _ = img_meta['img_shape']
                factor = gt_bboxes.new_tensor([img_w, img_h, img_w, img_h]).unsqueeze(0)

                cls_cost = self.cls_cost(cls_score.float(), gt_labels)
                normalize_gt_bboxes = gt_bboxes / factor
                reg_cost = self.reg_cost(bbox_pred.float(), normalize_gt_bboxes.float())
                bboxes = bbox_cxcywh_to_xyxy(bbox_pred.float()) * factor.float()
                iou_cost = self.iou_cost(bboxes, gt_bboxes.float())
                cost = cls_cost + reg_cost + iou_cost

                cost = torch.nan_to_num(cost.float(), nan=1e5, posinf=1e5, neginf=-1e5)
                cost = cost.detach().cpu()
                if linear_sum_assignment is None:
                    raise ImportError('Please run "pip install scipy" to install scipy first.')
                matched_row_inds, matched_col_inds = linear_sum_assignment(cost)
                matched_row_inds = torch.from_numpy(matched_row_inds).to(bbox_pred.device)
                matched_col_inds = torch.from_numpy(matched_col_inds).to(bbox_pred.device)

                assigned_gt_inds[:] = 0
                assigned_gt_inds[matched_row_inds] = matched_col_inds + 1
                assigned_labels[matched_row_inds] = gt_labels[matched_col_inds]
                return AssignResult(num_gts, assigned_gt_inds, None, labels=assigned_labels)

            HungarianAssigner.assign = assign_fp16_safe
            HungarianAssigner._fp16_cost_patched = True
            print(f"[{time.strftime('%H:%M:%S')}] [FP16] HungarianAssigner float32 cost & nan_to_num patch applied", flush=True)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [FP16 NOTE] HungarianAssigner patch skipped: {e}", flush=True)

    # 5. Patch CoATSSHead auxiliary head
    try:
        from projects.models.co_atss_head import CoATSSHead
        if not getattr(CoATSSHead, '_fp16_target_patched', False):
            orig_atss_get_target_single = CoATSSHead._get_target_single
            def atss_get_target_single_fp16_safe(self, flat_anchors, valid_flags,
                                                 num_level_anchors, gt_bboxes,
                                                 gt_bboxes_ignore, gt_labels,
                                                 img_meta, label_channels=1,
                                                 unmap_outputs=True):
                orig_dtype = flat_anchors.dtype
                res = orig_atss_get_target_single(
                    self, flat_anchors.float(), valid_flags, num_level_anchors,
                    gt_bboxes.float(), gt_bboxes_ignore, gt_labels, img_meta,
                    label_channels=label_channels, unmap_outputs=unmap_outputs)
                labels, label_weights, bbox_targets, bbox_weights, pos_inds, neg_inds = res
                return (labels, label_weights, bbox_targets.to(orig_dtype), bbox_weights.to(orig_dtype), pos_inds, neg_inds)

            CoATSSHead._get_target_single = atss_get_target_single_fp16_safe
            CoATSSHead._fp16_target_patched = True
            print(f"[{time.strftime('%H:%M:%S')}] [FP16] CoATSSHead target assignment patch applied", flush=True)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [FP16 NOTE] CoATSSHead patch skipped: {e}", flush=True)

    # 6. Patch AnchorHead (RPN) and BBoxHead (RoI) auxiliary heads
    try:
        from mmdet.models.dense_heads.anchor_head import AnchorHead
        if not getattr(AnchorHead, '_fp16_target_patched', False):
            orig_anchor_get_target_single = AnchorHead._get_target_single
            def anchor_get_target_single_fp16_safe(self, flat_anchors, valid_flags,
                                                   gt_bboxes, gt_bboxes_ignore,
                                                   gt_labels, img_meta,
                                                   label_channels=1, unmap_outputs=True):
                orig_dtype = flat_anchors.dtype
                res = orig_anchor_get_target_single(
                    self, flat_anchors.float(), valid_flags, gt_bboxes.float(),
                    gt_bboxes_ignore, gt_labels, img_meta,
                    label_channels=label_channels, unmap_outputs=unmap_outputs)
                labels, label_weights, bbox_targets, bbox_weights, pos_inds, neg_inds = res
                return (labels, label_weights, bbox_targets.to(orig_dtype), bbox_weights.to(orig_dtype), pos_inds, neg_inds)

            AnchorHead._get_target_single = anchor_get_target_single_fp16_safe
            AnchorHead._fp16_target_patched = True
            print(f"[{time.strftime('%H:%M:%S')}] [FP16] AnchorHead (RPN) target assignment patch applied", flush=True)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [FP16 NOTE] AnchorHead patch skipped: {e}", flush=True)

    try:
        from mmdet.models.roi_heads.bbox_heads.bbox_head import BBoxHead
        if not getattr(BBoxHead, '_fp16_target_patched', False):
            orig_bbox_get_target_single = BBoxHead._get_target_single
            def bbox_get_target_single_fp16_safe(self, pos_bboxes, neg_bboxes,
                                                 pos_gt_bboxes, pos_gt_labels, cfg):
                orig_dtype = pos_bboxes.dtype
                labels, label_weights, bbox_targets, bbox_weights = orig_bbox_get_target_single(
                    self, pos_bboxes.float(), neg_bboxes.float(), pos_gt_bboxes.float(), pos_gt_labels, cfg)
                return labels, label_weights, bbox_targets.to(orig_dtype), bbox_weights.to(orig_dtype)

            BBoxHead._get_target_single = bbox_get_target_single_fp16_safe
            BBoxHead._fp16_target_patched = True
            print(f"[{time.strftime('%H:%M:%S')}] [FP16] BBoxHead (RoI) target assignment patch applied", flush=True)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [FP16 NOTE] BBoxHead patch skipped: {e}", flush=True)

    # 7. Explicit Verification of Active Methods on Active Classes
    try:
        from projects.models.co_deformable_detr_head import CoDeformDETRHead
        from projects.models.co_dino_head import CoDINOHead
        assert getattr(CoDeformDETRHead, '_fp16_target_patched', False), "CoDeformDETRHead not patched!"
        assert getattr(CoDINOHead, '_fp16_target_patched', False), "CoDINOHead _get_target_single not patched!"
        assert getattr(CoDINOHead, '_fp16_dn_target_patched', False), "CoDINOHead _get_dn_target_single not patched!"
        print(f"[{time.strftime('%H:%M:%S')}] [FP16 VERIFIED] All active Co-DETR target and loss patches confirmed active!", flush=True)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] [FP16 VERIFICATION ERROR] Active head verification failed: {e}", flush=True)
        raise

    return True


def main():
    t_start = time.time()
    args = _parse_args()

    # ── Stage 1/8: Configuration ──────────────────────────────────────────────
    t_stage = time.time()
    stage_marker(1, 8, "Starting: Configuration loading and parsing", f"config={args.config}")
    if not os.path.isfile(args.config):
        sys.exit(f"[ERROR] Config not found: {args.config}")

    print(f"[{time.strftime('%H:%M:%S')}]   -> Importing MMDetection, MMCV, and Co-DETR plugins...", flush=True)
    # -- Late import so the script can be imported without mmdet installed. --
    try:
        import mmcv
        from mmcv import Config
        from mmcv.runner import set_random_seed
        from mmdet.apis import train_detector
        from mmdet.datasets import build_dataset
        from mmdet.models import build_detector
        from mmdet.utils import collect_env, get_root_logger

        # Explicitly import Co-DETR projects module to register the model if available
        try:
            import projects
        except ImportError:
            pass

        # Install FP16 compatibility bridge and register MultiScaleDeformAttn
        install_deformable_attention_fp16_bridge()
        patch_codetr_fp16_target_assignment()

        from mmcv.runner.hooks import HOOKS, Hook
        if 'StartupLivenessHook' not in HOOKS:
            @HOOKS.register_module()
            class StartupLivenessHook(Hook):
                def __init__(self, log_first_n=3, *args, **kwargs):
                    super().__init__()
                    self.log_first_n = log_first_n
                    self._iter_start_time = None

                def before_run(self, runner):
                    ts = time.strftime("%H:%M:%S")
                    n_iters = len(runner.data_loader) if hasattr(runner, 'data_loader') and runner.data_loader else 'N/A'
                    print(
                        f"[{ts}] [Training Lifecycle] runner.before_run complete. "
                        f"Total epochs: {runner.max_epochs}, iterations/epoch: {n_iters}.",
                        flush=True
                    )

                def before_train_epoch(self, runner):
                    ts = time.strftime("%H:%M:%S")
                    n_iters = len(runner.data_loader) if hasattr(runner, 'data_loader') and runner.data_loader else 'N/A'
                    print(
                        f"\n[{ts}] [Training Lifecycle] >>> Epoch {runner.epoch + 1}/{runner.max_epochs} started! "
                        f"Awaiting batch 1 from DataLoader ({n_iters} iterations per epoch) <<<",
                        flush=True
                    )

                def before_train_iter(self, runner):
                    if runner.iter < self.log_first_n:
                        self._iter_start_time = time.time()
                        ts = time.strftime("%H:%M:%S")
                        n_iters = len(runner.data_loader) if hasattr(runner, 'data_loader') and runner.data_loader else 'N/A'
                        print(
                            f"[{ts}] [Training Lifecycle] Iteration {runner.iter + 1}/{n_iters}: "
                            f"Data batch received! Running forward pass & loss computation...",
                            flush=True
                        )

                def after_train_iter(self, runner):
                    if runner.iter < self.log_first_n:
                        dur = time.time() - self._iter_start_time if self._iter_start_time else 0.0
                        ts = time.strftime("%H:%M:%S")
                        n_iters = len(runner.data_loader) if hasattr(runner, 'data_loader') and runner.data_loader else 'N/A'
                        loss_val = runner.outputs.get('loss', 'computed') if hasattr(runner, 'outputs') and isinstance(runner.outputs, dict) else 'computed'
                        if hasattr(loss_val, 'item'):
                            loss_val = f"{loss_val.item():.4f}"
                        lr = runner.current_lr()[0] if hasattr(runner, 'current_lr') and runner.current_lr() else 'N/A'
                        lr_str = f"{lr:.2e}" if isinstance(lr, (int, float)) else str(lr)
                        print(
                            f"[{ts}] [Training Lifecycle] Iteration {runner.iter + 1}/{n_iters}: "
                            f"SUCCESS: step completed in {dur:.2f}s | loss={loss_val} | lr={lr_str}",
                            flush=True
                        )
                        if runner.iter + 1 == self.log_first_n:
                            print(
                                f"[{ts}] [Training Lifecycle] Warmup iterations verified! Streaming logs every interval.\n",
                                flush=True
                            )

        if 'TrainingDiagnosticHook' not in HOOKS:
            @HOOKS.register_module()
            class TrainingDiagnosticHook(Hook):
                def __init__(self, max_iters=3, *args, **kwargs):
                    super().__init__()
                    self.max_iters = max_iters
                    self._start_time = None
                    self._step_times = []

                def before_train_iter(self, runner):
                    self._start_time = time.time()

                def after_train_iter(self, runner):
                    dur = time.time() - self._start_time if self._start_time else 0.0
                    self._step_times.append(dur)
                    loss_val = runner.outputs.get('loss', None) if hasattr(runner, 'outputs') and isinstance(runner.outputs, dict) else None
                    loss_str = f"{loss_val.item():.4f}" if hasattr(loss_val, 'item') else str(loss_val)

                    ts = time.strftime("%H:%M:%S")
                    print(f"[{ts}] [DIAGNOSTIC] Iteration {runner.iter + 1}/{self.max_iters} complete: loss={loss_str}, step_time={dur:.3f}s, optimizer.step() OK", flush=True)

                    if runner.iter + 1 >= self.max_iters:
                        gpu_mem_str = "N/A"
                        try:
                            import torch
                            if torch.cuda.is_available():
                                alloc = torch.cuda.max_memory_allocated(0) / (1024**3)
                                total = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                                gpu_mem_str = f"{alloc:.2f} GB / {total:.2f} GB"
                        except Exception:
                            pass

                        stats = {
                            "step_time": sum(self._step_times) / len(self._step_times),
                            "loss": loss_str,
                            "gpu_mem": gpu_mem_str,
                            "iters": len(self._step_times),
                        }
                        raise TrainingDiagnosticComplete(stats)

        if 'ThroughputBenchmarkHook' not in HOOKS:
            @HOOKS.register_module()
            class ThroughputBenchmarkHook(Hook):
                def __init__(self, *args, **kwargs):
                    super().__init__()
                    self._start_time = None
                    self._iter_times = []
                    self._max_iters = 10

                def before_train_iter(self, runner):
                    try:
                        import torch
                        if torch.cuda.is_available():
                            torch.cuda.synchronize()
                    except Exception:
                        pass
                    self._start_time = time.time()

                def after_train_iter(self, runner):
                    try:
                        import torch
                        if torch.cuda.is_available():
                            torch.cuda.synchronize()
                    except Exception:
                        pass
                    dur = time.time() - self._start_time if self._start_time else 0.0
                    if runner.iter > 0:  # Skip first iteration for warmup
                        self._iter_times.append(dur)
                    
                    if runner.iter + 1 >= self._max_iters:
                        avg_time = sum(self._iter_times) / len(self._iter_times) if self._iter_times else 0.0
                        samples = getattr(runner.data_loader, 'batch_size', 1)
                        img_sec = samples / avg_time if avg_time > 0 else 0.0
                        
                        gpu_mem_alloc = "N/A"
                        gpu_mem_res = "N/A"
                        gpu_name = "N/A"
                        try:
                            import torch
                            if torch.cuda.is_available():
                                gpu_name = torch.cuda.get_device_name(0)
                                alloc = torch.cuda.max_memory_allocated(0) / (1024**3)
                                res = torch.cuda.max_memory_reserved(0) / (1024**3)
                                total = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                                gpu_mem_alloc = f"{alloc:.2f} GB / {total:.2f} GB"
                                gpu_mem_res = f"{res:.2f} GB"
                        except Exception:
                            pass

                        print("\n" + "=" * 74, flush=True)
                        print("  THROUGHPUT BENCHMARK COMPLETED", flush=True)
                        print(f"  Iterations           : {runner.iter + 1}")
                        print(f"  Avg sec/iteration    : {avg_time:.3f}s (ignoring first warmup step)")
                        print(f"  Images/sec           : {img_sec:.2f}")
                        print(f"  Batch size           : {samples}")
                        
                        # Safest parser: read the full merged config text from runner.meta
                        input_res = "N/A"
                        num_query = "N/A"
                        decoder_depth = "N/A"
                        bb_frozen = "N/A"
                        width = "N/A"
                        is_fp16 = "FP32 (Safe Baseline)"
                        exp_name = "Baseline"

                        try:
                            import sys, os, re
                            config_path = next((arg for arg in sys.argv if arg.endswith('.py') and 'configs/' in arg), "")
                            if "exp_" in config_path:
                                exp_name = os.path.basename(config_path).replace('.py', '')
                            
                            cfg_text = getattr(runner, 'meta', {}).get('cfg_text', '')
                            if not cfg_text and hasattr(runner, 'model') and hasattr(runner.model, 'cfg'):
                                cfg_text = runner.model.cfg.pretty_text if hasattr(runner.model.cfg, 'pretty_text') else str(runner.model.cfg)
                                
                            if cfg_text:
                                res_match = re.search(r"image_size\s*=\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)", cfg_text)
                                if res_match:
                                    input_res = f"{res_match.group(1)}x{res_match.group(2)}"
                                
                                q_match = re.search(r"num_query\s*=\s*(\d+)", cfg_text)
                                if q_match:
                                    num_query = q_match.group(1)
                                    
                                d_match = re.search(r"decoder=dict\([^)]*num_layers\s*=\s*(\d+)", cfg_text)
                                if d_match:
                                    decoder_depth = d_match.group(1)
                                    
                                f_match = re.search(r"frozen_stages\s*=\s*(\d+)", cfg_text)
                                if f_match:
                                    bb_frozen = f_match.group(1)
                                    
                                w_match = re.search(r"out_channels\s*=\s*(\d+)", cfg_text)
                                if w_match:
                                    width = w_match.group(1)
                                    
                                if "fp16" in cfg_text.lower() and "loss_scale" in cfg_text.lower():
                                    is_fp16 = "FP16 (Enabled)"
                        except Exception as e:
                            exp_name = f"Parse Error: {str(e)}"
                            
                        # Estimate epoch time dynamically from actual dataloader
                        total_dataset_imgs = len(getattr(runner.data_loader, 'dataset', []))
                        if total_dataset_imgs > 0:
                            iters_per_epoch = len(runner.data_loader)
                        else:
                            iters_per_epoch = 1890 if samples == 2 else int(3780 / samples)
                        est_epoch_sec = avg_time * iters_per_epoch
                        est_epoch_min = est_epoch_sec / 60.0

                        print(f"  Experiment Name      : {exp_name}")
                        print(f"  Total Dataset Images : {total_dataset_imgs if total_dataset_imgs > 0 else '3780 (est)'}")
                        print(f"  Iterations/epoch     : {iters_per_epoch}")
                        print(f"  Est. epoch time      : {est_epoch_sec:.1f}s ({est_epoch_min:.2f} min)")
                        print(f"  Batch size           : {samples}")
                        print(f"  Input Resolution     : {input_res}")
                        print(f"  Number of Queries    : {num_query}")
                        print(f"  Decoder Depth        : {decoder_depth}")
                        print(f"  Backbone Frozen      : {bb_frozen}")
                        print(f"  Channel/Trans Width  : {width}")
                        print(f"  Precision            : {is_fp16}")
                        print(f"  Peak CUDA Allocated  : {gpu_mem_alloc}")
                        print(f"  Peak CUDA Reserved   : {gpu_mem_res}")
                        print(f"  GPU Name             : {gpu_name}")
                        print("=" * 74 + "\n", flush=True)
                        import sys
                        sys.exit(0)
    except ImportError as exc:
        curr_py = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        known_pythons = [
            "/content/codetr_env/bin/python",
            "/content/miniconda3/envs/codetr/bin/python",
            "/content/miniconda3/bin/python",
            os.path.abspath(os.path.join(_REPO_ROOT, ".codetr_env", "bin", "python")),
        ]
        found_env = [p for p in known_pythons if os.path.isfile(p) and os.access(p, os.X_OK)]
        lines = [
            "",
            "=" * 78,
            f"  [ENVIRONMENT ERROR] Co-DETR dependencies could not be imported: {exc}",
            f"  Current Python : {curr_py} ({sys.executable})",
            "",
            "  Co-DETR requires Python 3.7-3.10 with PyTorch 1.11.0+cu113, MMCV-full 1.5.0,",
            "  and MMDetection 2.25.3. Python >= 3.11 is incompatible with MMCV 1.x.",
            "",
        ]
        if found_env:
            lines.extend([
                f"  A valid Co-DETR environment was DETECTED at: {found_env[0]}",
                "",
                "  Please run your command using that Python binary, for example:",
                f"    {found_env[0]} {' '.join(sys.argv)}",
                "  or using the runner wrapper:",
                f"    bash run_codetr.sh {' '.join(sys.argv)}",
            ])
        else:
            lines.extend([
                "  To create the isolated Co-DETR environment in Google Colab, run:",
                "    bash scripts/setup_codetr_colab.sh",
                "  Then execute via:",
                f"    bash run_codetr.sh {' '.join(sys.argv)}",
            ])
        lines.append("=" * 78 + "\n")
        sys.exit("\n".join(lines))

    print(f"[{time.strftime('%H:%M:%S')}]   -> Parsing config file: {args.config} ...", flush=True)
    cfg = Config.fromfile(args.config)
    if args.cfg_options:
        cfg.merge_from_dict(args.cfg_options)
    if args.max_epochs is not None:
        if args.max_epochs <= 0:
            sys.exit(f"[ERROR] --max-epochs must be a positive integer, got {args.max_epochs}")
        if hasattr(cfg, "runner"):
            cfg.runner.max_epochs = args.max_epochs
        cfg.max_epochs = args.max_epochs
        cfg.total_epochs = args.max_epochs
        print(f"[{time.strftime('%H:%M:%S')}]   -> Overriding max_epochs to {args.max_epochs} (pilot/custom schedule)", flush=True)
    stage_marker(1, 8, "Completed: Configuration loaded successfully", elapsed=time.time() - t_stage)

    # ── Stage 2/8: Dataset Staging & Validation ──────────────────────────────
    t_stage = time.time()
    stage_marker(2, 8, "Starting: Dataset staging & validation", f"data_root={args.data_root or 'default'}")
    data_root = _resolve_data_root(args)
    data_root = stage_dataset_if_needed(
        data_root,
        stage_dir=args.stage_dir,
        enabled=(not args.no_stage_data),
    )
    val_data_root = getattr(args, "val_data_root", None) or os.environ.get("CODETR_VAL_DATA_ROOT")
    _validate_and_patch_data_root(
        cfg,
        data_root,
        val_data_root=val_data_root,
        no_validate=args.no_validate,
    )
    stage_marker(2, 8, "Completed: Dataset staged and validated", f"root={data_root}", elapsed=time.time() - t_stage)

    # ── Stage 3/8: Work Directory & Output Logging ────────────────────────────
    t_stage = time.time()
    stage_marker(3, 8, "Starting: Work directory & output logging setup")
    work_dir = _resolve_work_dir(args)
    cfg.work_dir = work_dir
    os.makedirs(work_dir, exist_ok=True)
    if args.log_interval is not None:
        if hasattr(cfg, "log_config"):
            cfg.log_config.interval = args.log_interval
    if args.workers_per_gpu is not None:
        if hasattr(cfg, "data"):
            cfg.data.workers_per_gpu = args.workers_per_gpu
    if getattr(args, "batch_size", None) is not None:
        if hasattr(cfg, "data"):
            cfg.data.samples_per_gpu = args.batch_size
    workers_cnt = cfg.data.get("workers_per_gpu", 0) if hasattr(cfg, "data") else 0
    if workers_cnt == 0:
        print(f"[{time.strftime('%H:%M:%S')}]   -> DataLoader workers: 0 (synchronous in-process loading; completely immune to OpenCV fork deadlocks)", flush=True)
    else:
        print(f"[{time.strftime('%H:%M:%S')}]   -> DataLoader workers: {workers_cnt} (multiprocessing enabled; cv2.setNumThreads(0) enforced)", flush=True)
    stage_marker(3, 8, "Completed: Work directory ready", f"work_dir={work_dir}", elapsed=time.time() - t_stage)

    # ── Stage 4/8: Checkpoint Resuming & Device Setup ─────────────────────────
    t_stage = time.time()
    stage_marker(4, 8, "Starting: GPU device verification & reproducibility")

    # Ensure standard MMDetection 2.25.3 root attributes exist with sensible defaults
    if not hasattr(cfg, "resume_from"):
        cfg.resume_from = None
    if not hasattr(cfg, "load_from"):
        cfg.load_from = None
    if not hasattr(cfg, "auto_resume"):
        cfg.auto_resume = False
    if not hasattr(cfg, "workflow") or not cfg.workflow:
        cfg.workflow = [('train', 1)]

    if args.resume_from:
        cfg.resume_from = args.resume_from
    elif args.auto_resume:
        cfg.auto_resume = True
        latest_ckpt = os.path.join(work_dir, "latest.pth")
        if os.path.isfile(latest_ckpt):
            cfg.resume_from = latest_ckpt
            print(f"[{time.strftime('%H:%M:%S')}] [INFO] Auto-resuming from: {latest_ckpt}", flush=True)
        else:
            print(
                f"[{time.strftime('%H:%M:%S')}] [INFO] --auto-resume requested, but {latest_ckpt} does not exist yet. Starting fresh.",
                flush=True
            )
    if args.load_from:
        cfg.load_from = args.load_from

    if 'LOCAL_RANK' not in os.environ:
        os.environ['LOCAL_RANK'] = str(args.local_rank)

    if args.launcher == "none":
        distributed = False
        cfg.gpu_ids = [0]
    else:
        distributed = True
        import torch.distributed as dist
        from mmcv.runner import get_dist_info
        dist.init_process_group(backend=cfg.get("dist_params", {}).get("backend", "nccl"))
        _, world_size = get_dist_info()
        cfg.gpu_ids = range(world_size)

    import torch
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        dev_info = f"GPU: {gpu_name} ({vram_gb:.1f} GB VRAM)"
        cfg.device = "cuda"
    else:
        dev_info = "CPU (Warning: CUDA not available)"
        cfg.device = "cpu"

    set_random_seed(args.seed, deterministic=False)
    cfg.seed = args.seed
    if cfg.get('cudnn_benchmark', False):
        torch.backends.cudnn.benchmark = True
    stage_marker(4, 8, "Completed: GPU & environment verified", dev_info, elapsed=time.time() - t_stage)

    # ── Stage 5/8: Build Dataset(s) ───────────────────────────────────────────
    t_stage = time.time()
    stage_marker(5, 8, "Starting: Building training dataset with MMDetection pipeline")
    datasets = [build_dataset(cfg.data.train)]
    if len(cfg.get('workflow', [('train', 1)])) == 2:
        val_dataset = copy.deepcopy(cfg.data.val)
        val_dataset.pipeline = cfg.data.train.get(
            'pipeline', cfg.data.train.dataset.get('pipeline', []))
        datasets.append(build_dataset(val_dataset))
    stage_marker(
        5, 8,
        "Completed: Training dataset ready",
        f"{len(datasets[0])} images, {len(datasets[0].CLASSES)} classes",
        elapsed=time.time() - t_stage
    )

    # ── Stage 6/8: Backbone Resolution & Model Initialization ─────────────────
    t_stage = time.time()
    stage_marker(6, 8, "Starting: Resolving Swin-L backbone & building Co-DETR model")
    _resolve_swin_backbone(cfg, args.swin_pretrained)
    model = build_detector(cfg.model, train_cfg=cfg.get("train_cfg"),
                           test_cfg=cfg.get("test_cfg"))
    print(f"[{time.strftime('%H:%M:%S')}]   -> Initializing model weights (backbone & detection heads)...", flush=True)
    t_init = time.time()
    model.init_weights()
    model.CLASSES = datasets[0].CLASSES
    stage_marker(6, 8, "Completed: Model initialized successfully", elapsed=time.time() - t_stage)

    # ── Stage 7/8: Setup Logging & Register Hooks ─────────────────────────────
    t_stage = time.time()
    stage_marker(7, 8, "Starting: Configuring logger, metadata, and runner hooks")
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(work_dir, f"train_{timestamp}.log")
    logger = get_root_logger(log_file=log_file, log_level=cfg.log_level)
    env_info = collect_env()
    if isinstance(env_info, dict):
        env_info = "\n".join([f"{k}: {v}" for k, v in env_info.items()])
    logger.info("Environment info:\n" + "-" * 60 + "\n" + str(env_info))
    logger.info(f"Data root: {data_root}")
    logger.info(f"Work dir : {work_dir}")

    if cfg.get("checkpoint_config") is not None:
        try:
            import mmdet
            from mmdet.utils import get_git_hash
            mmdet_version = mmdet.__version__ + get_git_hash()[:7]
        except ImportError:
            mmdet_version = "unknown"
        cfg.checkpoint_config.meta = dict(
            mmdet_version=mmdet_version,
            CLASSES=datasets[0].CLASSES
        )

    try:
        config_text = cfg.pretty_text
    except TypeError:
        # MMCV 1.5.0 and YAPF >= 0.40.0 compatibility fallback
        config_text = cfg.text

    meta = dict()
    meta['env_info'] = env_info
    meta['config'] = config_text
    meta['seed'] = cfg.seed
    meta['exp_name'] = os.path.basename(args.config)

    # Attach StartupLivenessHook for immediate iteration feedback
    if not hasattr(cfg, "custom_hooks") or cfg.custom_hooks is None:
        cfg.custom_hooks = []
    cfg.custom_hooks.append(dict(type='StartupLivenessHook', priority='VERY_LOW'))
    stage_marker(7, 8, "Completed: Hooks and checkpoint rotation configured", f"interval={cfg.log_config.interval}", elapsed=time.time() - t_stage)

    # ── Stage 8/8: Launch Training Loop ───────────────────────────────────────
    if args.training_diagnostic:
        cfg.runner.max_epochs = 1
        cfg.max_epochs = 1
        cfg.total_epochs = 1
        if not hasattr(cfg, "custom_hooks") or cfg.custom_hooks is None:
            cfg.custom_hooks = []
        cfg.custom_hooks.append(dict(type='TrainingDiagnosticHook', priority='LOWEST'))
        print(f"[{time.strftime('%H:%M:%S')}]   -> Attached TrainingDiagnosticHook (runs 3 full iterations to verify forward, target assignment, loss, backward, and optimizer.step)", flush=True)

    if args.benchmark_throughput:
        cfg.runner.max_epochs = 1
        cfg.max_epochs = 1
        cfg.total_epochs = 1
        if not hasattr(cfg, "custom_hooks") or cfg.custom_hooks is None:
            cfg.custom_hooks = []

        # Optional: enable detailed component profiling
        if os.environ.get("CODETR_PROFILE_COMPONENTS") == "1":
            from training.codetr.profiler import patch_model_for_profiling
            model = patch_model_for_profiling(model)

        cfg.custom_hooks.append(dict(type='ThroughputBenchmarkHook', priority='LOWEST'))
        print(f"[{time.strftime('%H:%M:%S')}]   -> Attached ThroughputBenchmarkHook (runs exactly 10 iterations to benchmark throughput)", flush=True)

    log_int = cfg.log_config.get("interval", "N/A") if hasattr(cfg, "log_config") else "N/A"
    samples_gpu = cfg.data.get("samples_per_gpu", "N/A") if hasattr(cfg, "data") else "N/A"
    workers_gpu = cfg.data.get("workers_per_gpu", "N/A") if hasattr(cfg, "data") else "N/A"
    stage_marker(
        8, 8,
        "Starting: Entering training loop (train_detector)",
        f"epochs={cfg.runner.max_epochs}, iters/epoch={len(datasets[0])}, log_interval={log_int}, batch={samples_gpu}, workers={workers_gpu}",
        elapsed=time.time() - t_start
    )

    if args.startup_diagnostic:
        print("\n" + "=" * 74, flush=True)
        print("  STARTUP DIAGNOSTIC PASSED", flush=True)
        print(f"  All 8 stages validated successfully in {time.time() - t_start:.2f}s.", flush=True)
        print("  System, environment, dataset, and model are fully ready for training.", flush=True)
        print("=" * 74 + "\n", flush=True)
        return 0

    try:
        train_detector(
            model,
            datasets,
            cfg,
            distributed=distributed,
            validate=(not args.no_validate and not args.training_diagnostic),
            timestamp=timestamp,
            meta=meta,
        )
    except TrainingDiagnosticComplete as diag:
        t_total = time.time() - t_start
        print("\n" + "=" * 74, flush=True)
        print("  TRAINING DIAGNOSTIC PASSED", flush=True)
        print(f"  Execution of {diag.stats.get('iters', 3)} training iterations verified in {diag.stats.get('step_time', 0):.2f}s avg/iter.", flush=True)
        print(f"  - Final loss   : {diag.stats.get('loss', 'N/A')}", flush=True)
        print(f"  - Peak GPU VRAM: {diag.stats.get('gpu_mem', 'N/A')}", flush=True)
        print(f"  - Total elapsed: {t_total:.2f}s", flush=True)
        print("  Forward pass, target assignment, loss computation, backward pass, and optimizer.step() 100% OPERATIONAL.", flush=True)
        print("=" * 74 + "\n", flush=True)
        return 0
    except SystemExit as e:
        if getattr(e, 'code', 1) == 0:
            if os.environ.get("CODETR_PROFILE_COMPONENTS") == "1":
                try:
                    from training.codetr.profiler import global_profiler
                    global_profiler.print_summary()
                except Exception:
                    pass
            return 0
        raise

    return 0

if __name__ == "__main__":
    sys.exit(main())
