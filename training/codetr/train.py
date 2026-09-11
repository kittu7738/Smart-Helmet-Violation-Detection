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
             "train/images/ and vaid/images/ subdirectories.",
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


from evaluation.codetr.evaluate import verify_dataset_paths


def _validate_and_patch_data_root(cfg, data_root):
    """
    Verify dataset paths for train and val splits (supporting both flat and nested layouts)
    and patch the MMDetection config accordingly.
    """
    ok, report = verify_dataset_paths(data_root)
    for split in ["train", "val", "test"]:
        if hasattr(cfg.data, split):
            sinfo = report.get(split, {})
            if split in ["train", "val"] and not sinfo.get("valid", False):
                raise FileNotFoundError(
                    f"Required dataset split '{split}' is invalid or missing under {data_root}.\n"
                    f"Annotation exists: {sinfo.get('ann_exists')} ({sinfo.get('ann_path')})\n"
                    f"Image dir exists: {sinfo.get('img_exists')} ({sinfo.get('img_path')})\n"
                    "Ensure data_root contains instances_{split}.json or {split}/instances_{split}.json."
                )
            split_cfg = getattr(cfg.data, split)
            if sinfo.get("ann_exists"):
                split_cfg.ann_file = sinfo["ann_path"]
            if sinfo.get("img_exists"):
                img_p = sinfo["img_path"]
                split_cfg.img_prefix = img_p + ("" if img_p.endswith("/") else "/")
            print(
                f"[INFO] Configured '{split}' split: ann_file={split_cfg.ann_file} "
                f"({sinfo.get('num_images', 0)} images, {sinfo.get('num_annotations', 0)} annotations), "
                f"img_prefix={split_cfg.img_prefix}"
            )


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
        
        # Explicitly import Co-DETR projects module to register the model
        import projects
        
        # Patch: Register mmcv's MultiScaleDeformableAttention as MultiScaleDeformAttn
        # to match the config's expectations without duplicating code.
        from mmcv.cnn.bricks.registry import ATTENTION
        from mmcv.ops.multi_scale_deform_attn import MultiScaleDeformableAttention
        if 'MultiScaleDeformAttn' not in ATTENTION:
            ATTENTION.register_module(name='MultiScaleDeformAttn', module=MultiScaleDeformableAttention)
    except ImportError as exc:
        sys.exit(
            f"[ERROR] Could not import mmdet/mmcv/projects: {exc}\n"
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
    _validate_and_patch_data_root(cfg, data_root)

    # ── 3. Work directory ─────────────────────────────────────────────────────
    work_dir = _resolve_work_dir(args)
    cfg.work_dir = work_dir
    os.makedirs(work_dir, exist_ok=True)

    # ── 4. Optional checkpoint loading / resuming ─────────────────────────────
    if args.resume_from:
        cfg.resume_from = args.resume_from
    elif args.auto_resume:
        latest_ckpt = os.path.join(work_dir, "latest.pth")
        if os.path.isfile(latest_ckpt):
            cfg.resume_from = latest_ckpt
            print(f"[INFO] Auto-resuming from: {latest_ckpt}")
        else:
            print(
                f"[INFO] --auto-resume requested, but {latest_ckpt} does not exist yet. "
                "Starting fresh training from epoch 1."
            )
    if args.load_from:
        cfg.load_from = args.load_from

    # ── 5. Distributed / launcher setup ──────────────────────────────────────
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

    # Set device configuration expected by MMDet 2.25.3
    try:
        from mmdet.utils import get_device
        cfg.device = get_device()
    except ImportError:
        import torch
        cfg.device = "cuda" if torch.cuda.is_available() else "cpu"

    # ── 6. Reproducibility ────────────────────────────────────────────────────
    set_random_seed(args.seed, deterministic=False)
    cfg.seed = args.seed
    
    if cfg.get('cudnn_benchmark', False):
        import torch
        torch.backends.cudnn.benchmark = True

    # ── 7. Logging ────────────────────────────────────────────────────────────
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(work_dir, f"train_{timestamp}.log")
    logger = get_root_logger(log_file=log_file, log_level=cfg.log_level)
    env_info = collect_env()
    if isinstance(env_info, dict):
        env_info = "\n".join([f"{k}: {v}" for k, v in env_info.items()])
    logger.info("Environment info:\n" + "-" * 60 + "\n" + str(env_info))
    logger.info(f"Config:\n{cfg.pretty_text}")
    logger.info(f"Data root: {data_root}")
    logger.info(f"Work dir : {work_dir}")

    # ── 8. Build dataset(s) ───────────────────────────────────────────────────
    datasets = [build_dataset(cfg.data.train)]
    # In MMDetection 2.x, EvalHook handles validation datasets directly.
    # We only append to `datasets` if the workflow explicitly contains 'val'.
    if len(cfg.get('workflow', [('train', 1)])) == 2:
        val_dataset = copy.deepcopy(cfg.data.val)
        val_dataset.pipeline = cfg.data.train.get(
            'pipeline', cfg.data.train.dataset.get('pipeline', []))
        datasets.append(build_dataset(val_dataset))

    # ── 9. Build model ────────────────────────────────────────────────────────
    model = build_detector(cfg.model, train_cfg=cfg.get("train_cfg"),
                           test_cfg=cfg.get("test_cfg"))
    model.init_weights()
    model.CLASSES = datasets[0].CLASSES

    # Set up checkpoint meta expected by MMDetection 2.x
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
    
    # Initialize meta dict for logger/runner
    meta = dict()
    meta['env_info'] = env_info
    meta['config'] = cfg.pretty_text
    meta['seed'] = cfg.seed
    meta['exp_name'] = os.path.basename(args.config)

    # ── 10. Launch training ───────────────────────────────────────────────────
    train_detector(
        model,
        datasets,
        cfg,
        distributed=distributed,
        validate=(not args.no_validate),
        timestamp=timestamp,
        meta=meta,
    )


if __name__ == "__main__":
    main()
