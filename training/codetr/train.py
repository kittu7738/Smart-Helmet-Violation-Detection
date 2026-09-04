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
                           train/  (image directory)
                           val/    (image directory)
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

import argparse
import copy
import os
import sys
import time

# ---------------------------------------------------------------------------
# Ensure Co-DETR source is on sys.path before importing mmdet / Co-DETR.
# The Co-DETR repo is expected at /content/Co-DETR in Colab, or at the
# path given by the CODETR_REPO env var.
# ---------------------------------------------------------------------------
_CODETR_REPO = os.environ.get("CODETR_REPO", "/content/Co-DETR")
if _CODETR_REPO and os.path.isdir(_CODETR_REPO) and _CODETR_REPO not in sys.path:
    sys.path.insert(0, _CODETR_REPO)


def _parse_args():
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
             "train/ and val/ subdirectories.",
    )
    parser.add_argument(
        "--resume-from",
        default=None,
        help="Checkpoint .pth to resume training from.",
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
    # Allow passing arbitrary MMDetection cfg-options as KEY=VALUE pairs.
    parser.add_argument(
        "--cfg-options",
        nargs="+",
        action=_DictAction,
        help="Override config key/values: e.g. --cfg-options "
             "optimizer.lr=2e-4 data.samples_per_gpu=1",
    )
    return parser.parse_args()


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


def _validate_data_root(data_root):
    """Check that the required COCO files exist under data_root."""
    required = [
        "instances_train.json",
        "instances_val.json",
    ]
    required_dirs = ["train", "val"]

    missing = []
    for f in required:
        if not os.path.isfile(os.path.join(data_root, f)):
            missing.append(os.path.join(data_root, f))
    for d in required_dirs:
        if not os.path.isdir(os.path.join(data_root, d)):
            missing.append(os.path.join(data_root, d) + "/")

    if missing:
        raise FileNotFoundError(
            "Dataset not found. The following required paths are missing:\n"
            + "\n".join(f"  {p}" for p in missing)
            + "\n\nSet --data-root or CODETR_DATA_ROOT to the correct path."
        )


def _patch_config_data_root(cfg, data_root):
    """Override data.{train,val,test}.ann_file and img_prefix in the config."""
    splits = {
        "train": ("instances_train.json", "train/"),
        "val": ("instances_val.json", "val/"),
        "test": ("instances_test.json", "test/"),
    }
    for split, (ann_file, img_prefix) in splits.items():
        if hasattr(cfg.data, split):
            split_cfg = getattr(cfg.data, split)
            split_cfg.ann_file = os.path.join(data_root, ann_file)
            split_cfg.img_prefix = os.path.join(data_root, img_prefix)


def main():
    args = _parse_args()

    # -- Late import so the script can be imported without mmdet installed. --
    try:
        import mmcv
        from mmcv import Config
        from mmcv.runner import set_random_seed
        from mmdet.apis import train_detector
        from mmdet.datasets import build_dataset
        from mmdet.models import build_detector
        from mmdet.utils import collect_env, get_root_logger
    except ImportError as exc:
        sys.exit(
            f"[ERROR] Could not import mmdet/mmcv: {exc}\n"
            "Ensure the codetr conda environment is active and "
            "PYTHONPATH includes the Co-DETR repo root."
        )

    # ── 1. Load config ────────────────────────────────────────────────────────
    if not os.path.isfile(args.config):
        sys.exit(f"[ERROR] Config not found: {args.config}")

    cfg = Config.fromfile(args.config)

    # Apply any --cfg-options overrides
    if args.cfg_options:
        cfg.merge_from_dict(args.cfg_options)

    # ── 2. Resolve and patch dataset root ─────────────────────────────────────
    data_root = _resolve_data_root(args)
    _validate_data_root(data_root)
    _patch_config_data_root(cfg, data_root)

    # ── 3. Work directory ─────────────────────────────────────────────────────
    work_dir = _resolve_work_dir(args)
    cfg.work_dir = work_dir
    os.makedirs(work_dir, exist_ok=True)

    # ── 4. Optional checkpoint loading / resuming ─────────────────────────────
    if args.resume_from:
        cfg.resume_from = args.resume_from
    if args.load_from:
        cfg.load_from = args.load_from

    # ── 5. Distributed / launcher setup ──────────────────────────────────────
    if args.launcher == "none":
        distributed = False
    else:
        import torch.distributed as dist
        dist.init_process_group(backend=cfg.get("dist_params", {}).get("backend", "nccl"))
        distributed = True

    # ── 6. Reproducibility ────────────────────────────────────────────────────
    set_random_seed(args.seed, deterministic=False)
    cfg.seed = args.seed

    # ── 7. Logging ────────────────────────────────────────────────────────────
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(work_dir, f"train_{timestamp}.log")
    logger = get_root_logger(log_file=log_file, log_level=cfg.log_level)
    logger.info("Environment info:\n" + "-" * 60 + "\n" + collect_env())
    logger.info(f"Config:\n{cfg.pretty_text}")
    logger.info(f"Data root: {data_root}")
    logger.info(f"Work dir : {work_dir}")

    # ── 8. Build dataset(s) ───────────────────────────────────────────────────
    datasets = [build_dataset(cfg.data.train)]
    if not args.no_validate:
        datasets.append(build_dataset(cfg.data.val))

    # ── 9. Build model ────────────────────────────────────────────────────────
    model = build_detector(cfg.model, train_cfg=cfg.get("train_cfg"),
                           test_cfg=cfg.get("test_cfg"))
    model.init_weights()

    # ── 10. Launch training ───────────────────────────────────────────────────
    train_detector(
        model,
        datasets,
        cfg,
        distributed=distributed,
        validate=(not args.no_validate),
        timestamp=timestamp,
    )


if __name__ == "__main__":
    main()
