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
import shutil
import sys
import time

try:
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)
except (AttributeError, Exception):
    pass

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
    # Performance & Colab optimizations
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


def _copy_tree_compat(src, dst):
    """Recursively copy files from src to dst in a Python 3.7+ compatible manner."""
    os.makedirs(dst, exist_ok=True)
    count = 0
    size = 0
    for item in os.listdir(src):
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        if os.path.isdir(s):
            c, sz = _copy_tree_compat(s, d)
            count += c
            size += sz
        else:
            if not os.path.exists(d) or os.path.getmtime(s) > os.path.getmtime(d):
                shutil.copy2(s, d)
            count += 1
            size += os.path.getsize(d)
    return count, size


def stage_dataset_if_needed(data_root, stage_dir="/content/dataset_local", enabled=True):
    """
    Stage dataset from slow Google Drive FUSE storage to fast local storage.
    Prevents DataLoader multi-process deadlocks and massive I/O delays.
    """
    if not enabled or not data_root:
        return data_root

    # Only auto-stage if data_root appears to be on Google Drive (or if forced via env)
    is_gdrive = data_root.startswith("/content/drive/") or "/MyDrive" in data_root
    if not is_gdrive and not os.environ.get("CODETR_FORCE_STAGE"):
        return data_root

    stage_dir = os.path.abspath(stage_dir)
    if os.path.abspath(data_root) == stage_dir:
        return data_root

    print(f"[INFO] Google Drive dataset detected at: {data_root}", flush=True)
    print(f"[INFO] Staging dataset to local fast disk: {stage_dir} ...", flush=True)
    start_time = time.time()

    os.makedirs(stage_dir, exist_ok=True)
    copied_files, total_bytes = _copy_tree_compat(data_root, stage_dir)
    elapsed = time.time() - start_time
    mb = total_bytes / (1024 * 1024)
    print(
        f"[INFO] Staging complete: {copied_files} files ({mb:.1f} MB) in {elapsed:.2f}s.",
        flush=True,
    )
    return stage_dir


def _resolve_swin_backbone(cfg, swin_arg=None):
    """
    Ensure the Swin-L backbone weights are located locally to prevent long download freezes.
    """
    if not hasattr(cfg, "model") or not hasattr(cfg.model, "backbone"):
        return
    if not hasattr(cfg.model.backbone, "init_cfg"):
        return

    init_cfg = cfg.model.backbone.init_cfg
    if not isinstance(init_cfg, dict) or init_cfg.get("type") != "Pretrained":
        return

    checkpoint = init_cfg.get("checkpoint")
    if not checkpoint:
        return

    # If already a local file that exists, nothing to do
    if os.path.isfile(checkpoint):
        print(f"[INFO] Using local Swin-L backbone checkpoint: {checkpoint}", flush=True)
        return

    # Candidate locations on Google Drive or local cache
    candidates = []
    if swin_arg and os.path.isfile(swin_arg):
        candidates.append(swin_arg)

    env_swin = os.environ.get("SWIN_PRETRAINED")
    if env_swin and os.path.isfile(env_swin):
        candidates.append(env_swin)

    hub_cache = os.path.expanduser("~/.cache/torch/hub/checkpoints/swin_large_patch4_window12_384_22k.pth")
    candidates.extend([
        hub_cache,
        "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/swin_large_patch4_window12_384_22k.pth",
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
        print(f"[INFO] Found local Swin-L checkpoint: {found_local}", flush=True)
        if found_local != hub_cache and not os.path.isfile(hub_cache):
            try:
                os.makedirs(os.path.dirname(hub_cache), exist_ok=True)
                print(f"[INFO] Caching Swin-L weights to local SSD: {hub_cache} ...", flush=True)
                shutil.copy2(found_local, hub_cache)
                init_cfg["checkpoint"] = hub_cache
            except Exception as e:
                print(f"[WARNING] Could not copy to cache ({e}), pointing directly to {found_local}", flush=True)
                init_cfg["checkpoint"] = found_local
        else:
            init_cfg["checkpoint"] = found_local
    else:
        print(
            f"[INFO] Swin-L backbone will be fetched from: {checkpoint}\n"
            "       Note: First download (~768MB) may take several minutes if not cached.",
            flush=True,
        )


def main():
    args = _parse_args()
    print("[INFO] Starting Smart Helmet Co-DETR training runner...", flush=True)

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
    data_root = stage_dataset_if_needed(
        data_root,
        stage_dir=args.stage_dir,
        enabled=(not args.no_stage_data),
    )
    _validate_and_patch_data_root(cfg, data_root)

    # Apply any CLI performance overrides
    if args.log_interval is not None:
        if hasattr(cfg, "log_config"):
            cfg.log_config.interval = args.log_interval
            print(f"[INFO] Set log_config.interval = {args.log_interval}", flush=True)

    if args.workers_per_gpu is not None:
        if hasattr(cfg, "data"):
            cfg.data.workers_per_gpu = args.workers_per_gpu
            print(f"[INFO] Set data.workers_per_gpu = {args.workers_per_gpu}", flush=True)

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
    print("[INFO] Initializing model weights ...", flush=True)
    _resolve_swin_backbone(cfg, args.swin_pretrained)
    model = build_detector(cfg.model, train_cfg=cfg.get("train_cfg"),
                           test_cfg=cfg.get("test_cfg"))
    model.init_weights()
    model.CLASSES = datasets[0].CLASSES
    print("[INFO] Model weights initialized successfully.", flush=True)

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
    log_int = cfg.log_config.get("interval", "N/A") if hasattr(cfg, "log_config") else "N/A"
    samples_gpu = cfg.data.get("samples_per_gpu", "N/A") if hasattr(cfg, "data") else "N/A"
    workers_gpu = cfg.data.get("workers_per_gpu", "N/A") if hasattr(cfg, "data") else "N/A"
    print(
        f"[INFO] Starting training detector: max_epochs={cfg.runner.max_epochs}, "
        f"log_interval={log_int}, samples_per_gpu={samples_gpu}, "
        f"workers_per_gpu={workers_gpu} ...",
        flush=True,
    )
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
