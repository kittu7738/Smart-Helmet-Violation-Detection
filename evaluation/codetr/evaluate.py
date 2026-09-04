#!/usr/bin/env python3
"""
evaluation/codetr/evaluate.py
=============================
Evaluate a trained Co-DETR checkpoint on the helmet detection dataset.

This script wraps MMDetection's test API to run inference on the
validation or test split and compute COCO mAP metrics.

Environment variables (all optional – CLI args take priority):
    CODETR_DATA_ROOT   Root of the COCO-format dataset.
    CODETR_REPO        Path to the Co-DETR source repo.

Usage (Google Colab):
    python evaluation/codetr/evaluate.py \
        --config configs/codetr/helmet_codetr_swin_large.py \
        --checkpoint work_dirs/helmet_codetr/latest.pth \
        --data-root /content/drive/MyDrive/helmet_dataset/coco \
        --eval bbox

    # Evaluate on the test split instead of val:
    python evaluation/codetr/evaluate.py \
        --config configs/codetr/helmet_codetr_swin_large.py \
        --checkpoint work_dirs/helmet_codetr/latest.pth \
        --split test \
        --eval bbox
"""

import argparse
import os
import sys

# ---------------------------------------------------------------------------
# Ensure Co-DETR source is on sys.path
# ---------------------------------------------------------------------------
_CODETR_REPO = os.environ.get("CODETR_REPO", "/content/Co-DETR")
if _CODETR_REPO and os.path.isdir(_CODETR_REPO) and _CODETR_REPO not in sys.path:
    sys.path.insert(0, _CODETR_REPO)


def _parse_args():
    parser = argparse.ArgumentParser(
        description="Evaluate Co-DETR helmet detection checkpoint"
    )
    parser.add_argument(
        "--config",
        default="configs/codetr/helmet_codetr_swin_large.py",
        help="MMDetection config file.",
    )
    parser.add_argument(
        "--checkpoint",
        required=True,
        help="Path to a trained .pth checkpoint.",
    )
    parser.add_argument(
        "--data-root",
        default=None,
        help="COCO dataset root (env: CODETR_DATA_ROOT).",
    )
    parser.add_argument(
        "--split",
        choices=["val", "test"],
        default="val",
        help="Evaluate on val or test split (default: val).",
    )
    parser.add_argument(
        "--eval",
        nargs="+",
        default=["bbox"],
        help="Evaluation metrics (default: bbox).",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Output .pkl file for raw prediction results.",
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


def _patch_config_data_root(cfg, data_root, split):
    """Patch the target split's ann_file and img_prefix."""
    ann_map = {
        "val": "instances_val.json",
        "test": "instances_test.json",
    }
    img_map = {
        "val": "val/",
        "test": "test/",
    }
    if hasattr(cfg.data, split):
        split_cfg = getattr(cfg.data, split)
        split_cfg.ann_file = os.path.join(data_root, ann_map[split])
        split_cfg.img_prefix = os.path.join(data_root, img_map[split])


def main():
    args = _parse_args()

    try:
        import torch
        import mmcv
        from mmcv import Config
        from mmcv.runner import load_checkpoint
        from mmcv.parallel import MMDataParallel
        from mmdet.apis import single_gpu_test
        from mmdet.datasets import build_dataloader, build_dataset
        from mmdet.models import build_detector
    except ImportError as exc:
        sys.exit(
            f"[ERROR] Could not import mmdet/mmcv: {exc}\n"
            "Ensure the codetr conda environment is active and "
            "PYTHONPATH includes the Co-DETR repo root."
        )

    # ── 1. Load config ────────────────────────────────────────────────────
    if not os.path.isfile(args.config):
        sys.exit(f"[ERROR] Config not found: {args.config}")
    if not os.path.isfile(args.checkpoint):
        sys.exit(f"[ERROR] Checkpoint not found: {args.checkpoint}")

    cfg = Config.fromfile(args.config)

    # Apply --cfg-options
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

    # ── 2. Patch dataset root ─────────────────────────────────────────────
    data_root = _resolve_data_root(args)
    _patch_config_data_root(cfg, data_root, args.split)

    # Force batch=1 for testing
    cfg.data.samples_per_gpu = 1

    # ── 3. Build dataset ──────────────────────────────────────────────────
    dataset = build_dataset(getattr(cfg.data, args.split))
    data_loader = build_dataloader(
        dataset,
        samples_per_gpu=1,
        workers_per_gpu=cfg.data.get("workers_per_gpu", 2),
        dist=False,
        shuffle=False,
    )

    # ── 4. Build model & load checkpoint ──────────────────────────────────
    cfg.model.pretrained = None  # avoid re-downloading backbone weights
    model = build_detector(cfg.model, test_cfg=cfg.get("test_cfg"))
    checkpoint = load_checkpoint(model, args.checkpoint, map_location="cpu")

    # Attach classes from checkpoint meta or config
    if "CLASSES" in checkpoint.get("meta", {}):
        model.CLASSES = checkpoint["meta"]["CLASSES"]
    else:
        model.CLASSES = dataset.CLASSES

    model = MMDataParallel(model, device_ids=[args.gpu_id])

    # ── 5. Run inference ──────────────────────────────────────────────────
    outputs = single_gpu_test(
        model, data_loader,
        show=args.show,
        out_dir=args.show_dir,
    )

    # ── 6. Save raw outputs ──────────────────────────────────────────────
    if args.out:
        print(f"\nSaving results to {args.out}")
        mmcv.dump(outputs, args.out)

    # ── 7. Evaluate ──────────────────────────────────────────────────────
    print(f"\n{'=' * 60}")
    print(f"  Evaluating {args.split} split  |  metrics: {args.eval}")
    print(f"{'=' * 60}")

    eval_kwargs = {"metric": args.eval}
    results = dataset.evaluate(outputs, **eval_kwargs)

    print(f"\n{'=' * 60}")
    print("  Results:")
    for key, val in results.items():
        print(f"    {key}: {val:.4f}" if isinstance(val, float) else f"    {key}: {val}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()
