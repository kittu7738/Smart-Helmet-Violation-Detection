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

# Ensure repository root is on sys.path
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

# Immediate visual confirmation that Python process is running
print(f"[{time.strftime('%H:%M:%S')}] >>> Co-DETR train.py initializing (PID {os.getpid()}) <<<", flush=True)

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


def stage_marker(step, total, name, detail="", elapsed=None):
    """Print an unbuffered, timestamped stage progress marker with timing."""
    ts = time.strftime("%H:%M:%S")
    dur_str = f" in {elapsed:.2f}s" if elapsed is not None else ""
    extra = f" [{detail}]" if detail else ""
    msg = f"[{ts}] [Stage {step}/{total}] {name}{extra}{dur_str}"
    print(msg, flush=True)
    try:
        sys.stdout.flush()
        os.fsync(sys.stdout.fileno())
    except Exception:
        pass


def _copy_tree_compat(src, dst):
    """Recursively copy files from src to dst in a Python 3.7+ compatible manner with progress."""
    os.makedirs(dst, exist_ok=True)
    count = 0
    size = 0
    for item in os.listdir(src):
        s = os.path.join(src, item)
        d = os.path.join(dst, item)
        if os.path.isdir(s):
            sub_count, sub_size = _copy_tree_compat(s, d)
            count += sub_count
            size += sub_size
            sub_mb = sub_size / (1024 * 1024)
            print(f"[{time.strftime('%H:%M:%S')}]   -> Staged '{item}/' ({sub_count} files, {sub_mb:.1f} MB)", flush=True)
        else:
            if not os.path.exists(d) or os.path.getmtime(s) > os.path.getmtime(d):
                shutil.copy2(s, d)
            count += 1
            size += os.path.getsize(d)
    return count, size


def stage_dataset_if_needed(data_root, stage_dir="/content/dataset_local", enabled=True):
    """
    Stage dataset from slow Google Drive FUSE storage to fast local NVMe storage.
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

    # Fast-path check: Is stage_dir already staged with images and annotations?
    train_ann_flat = os.path.join(stage_dir, "instances_train.json")
    train_ann_nested = os.path.join(stage_dir, "train", "instances_train.json")
    train_img_flat = os.path.join(stage_dir, "train", "images")
    train_img_direct = os.path.join(stage_dir, "images")

    has_ann = os.path.isfile(train_ann_flat) or os.path.isfile(train_ann_nested)
    img_dir = train_img_flat if os.path.isdir(train_img_flat) else (train_img_direct if os.path.isdir(train_img_direct) else None)
    if has_ann and img_dir and len(os.listdir(img_dir)) >= 300:
        print(f"[{time.strftime('%H:%M:%S')}] [INFO] Dataset already staged and verified at: {stage_dir} (skipping re-copy)", flush=True)
        return stage_dir

    print(f"[{time.strftime('%H:%M:%S')}] [INFO] Google Drive dataset detected at: {data_root}", flush=True)
    print(f"[{time.strftime('%H:%M:%S')}] [INFO] Staging dataset to local fast disk: {stage_dir} ...", flush=True)
    start_time = time.time()

    os.makedirs(stage_dir, exist_ok=True)
    copied_files, total_bytes = _copy_tree_compat(data_root, stage_dir)
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
    if not checkpoint:
        return

    # If already a local file that exists, nothing to do
    if os.path.isfile(checkpoint):
        print(f"[{time.strftime('%H:%M:%S')}] [INFO] Using local Swin-L backbone checkpoint: {checkpoint}", flush=True)
        return

    # Candidate locations on Google Drive or local cache
    candidates = []
    if swin_arg and os.path.isfile(swin_arg):
        candidates.append(swin_arg)

    env_swin = os.environ.get("SWIN_PRETRAINED")
    if env_swin and os.path.isfile(env_swin):
        candidates.append(env_swin)

    hub_cache = os.path.expanduser("~/.cache/torch/hub/checkpoints/swin_large_patch4_window12_384_22k.pth")
    drive_cache_dir = "/content/drive/MyDrive/Smart-Helmet-Violation-Detection"
    drive_ckpt = os.path.join(drive_cache_dir, "swin_large_patch4_window12_384_22k.pth")

    candidates.extend([
        hub_cache,
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


def main():
    t_start = time.time()
    args = _parse_args()

    # ── Stage 1/8: Configuration ──────────────────────────────────────────────
    t_stage = time.time()
    stage_marker(1, 8, "Loading configuration", f"config={args.config}")
    if not os.path.isfile(args.config):
        sys.exit(f"[ERROR] Config not found: {args.config}")

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

        from mmcv.runner.hooks import HOOKS, Hook
        if 'StartupLivenessHook' not in HOOKS:
            @HOOKS.register_module()
            class StartupLivenessHook(Hook):
                def __init__(self, log_first_n=3):
                    self.log_first_n = log_first_n
                    self._iter_start_time = None

                def before_train_epoch(self, runner):
                    if runner.epoch == 0:
                        ts = time.strftime("%H:%M:%S")
                        print(f"\n[{ts}] [Liveness] >>> Epoch 1/{runner.max_epochs} started! ({len(runner.data_loader)} iterations per epoch) <<<", flush=True)

                def before_train_iter(self, runner):
                    if runner.iter < self.log_first_n:
                        self._iter_start_time = time.time()
                        ts = time.strftime("%H:%M:%S")
                        print(
                            f"[{ts}] [Liveness] Iteration {runner.iter + 1}/{len(runner.data_loader)} "
                            f"forward pass starting (CUDA warmup & loss graph)...",
                            flush=True
                        )

                def after_train_iter(self, runner):
                    if runner.iter < self.log_first_n:
                        dur = time.time() - self._iter_start_time if self._iter_start_time else 0.0
                        ts = time.strftime("%H:%M:%S")
                        loss_val = runner.outputs.get('loss', 'computed') if hasattr(runner, 'outputs') and isinstance(runner.outputs, dict) else 'computed'
                        if hasattr(loss_val, 'item'):
                            loss_val = f"{loss_val.item():.4f}"
                        print(
                            f"[{ts}] [Liveness] Iteration {runner.iter + 1}/{len(runner.data_loader)} "
                            f"SUCCESS: step completed in {dur:.2f}s | loss={loss_val}",
                            flush=True
                        )
                        if runner.iter + 1 == self.log_first_n:
                            print(
                                f"[{ts}] [Liveness] Warmup iterations complete! Streaming standard metrics every 10 iterations.\n",
                                flush=True
                            )

    except ImportError as exc:
        sys.exit(
            f"[ERROR] Could not import mmdet/mmcv/projects: {exc}\n"
            "Ensure the codetr conda environment is active and "
            "PYTHONPATH includes the Co-DETR repo root."
        )

    cfg = Config.fromfile(args.config)
    if args.cfg_options:
        cfg.merge_from_dict(args.cfg_options)
    stage_marker(1, 8, "Configuration loaded successfully", elapsed=time.time() - t_stage)

    # ── Stage 2/8: Dataset Staging & Validation ──────────────────────────────
    t_stage = time.time()
    stage_marker(2, 8, "Staging & validating dataset", f"data_root={args.data_root or 'default'}")
    data_root = _resolve_data_root(args)
    data_root = stage_dataset_if_needed(
        data_root,
        stage_dir=args.stage_dir,
        enabled=(not args.no_stage_data),
    )
    _validate_and_patch_data_root(cfg, data_root)
    stage_marker(2, 8, "Dataset validated and patched into config", f"root={data_root}", elapsed=time.time() - t_stage)

    # ── Stage 3/8: Work Directory & Output Logging ────────────────────────────
    t_stage = time.time()
    work_dir = _resolve_work_dir(args)
    cfg.work_dir = work_dir
    os.makedirs(work_dir, exist_ok=True)
    if args.log_interval is not None:
        if hasattr(cfg, "log_config"):
            cfg.log_config.interval = args.log_interval
    if args.workers_per_gpu is not None:
        if hasattr(cfg, "data"):
            cfg.data.workers_per_gpu = args.workers_per_gpu
    stage_marker(3, 8, "Work directory ready", f"work_dir={work_dir}", elapsed=time.time() - t_stage)

    # ── Stage 4/8: Checkpoint Resuming & Device Setup ─────────────────────────
    t_stage = time.time()
    stage_marker(4, 8, "Configuring runtime device & reproducibility")
    if args.resume_from:
        cfg.resume_from = args.resume_from
    elif args.auto_resume:
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
    stage_marker(4, 8, "Runtime device verified", dev_info, elapsed=time.time() - t_stage)

    # ── Stage 5/8: Build Dataset(s) ───────────────────────────────────────────
    t_stage = time.time()
    stage_marker(5, 8, "Building training dataset with MMDetection pipeline")
    datasets = [build_dataset(cfg.data.train)]
    if len(cfg.get('workflow', [('train', 1)])) == 2:
        val_dataset = copy.deepcopy(cfg.data.val)
        val_dataset.pipeline = cfg.data.train.get(
            'pipeline', cfg.data.train.dataset.get('pipeline', []))
        datasets.append(build_dataset(val_dataset))
    stage_marker(
        5, 8,
        "Training dataset ready",
        f"{len(datasets[0])} images, {len(datasets[0].CLASSES)} classes",
        elapsed=time.time() - t_stage
    )

    # ── Stage 6/8: Backbone Resolution & Model Initialization ─────────────────
    t_stage = time.time()
    stage_marker(6, 8, "Resolving Swin-L backbone & building Co-DETR model")
    _resolve_swin_backbone(cfg, args.swin_pretrained)
    model = build_detector(cfg.model, train_cfg=cfg.get("train_cfg"),
                           test_cfg=cfg.get("test_cfg"))
    stage_marker(6, 8, "Initializing model weights (backbone & detection heads)...")
    t_init = time.time()
    model.init_weights()
    model.CLASSES = datasets[0].CLASSES
    stage_marker(6, 8, "Model initialized successfully", elapsed=time.time() - t_stage)

    # ── Stage 7/8: Setup Logging & Register Hooks ─────────────────────────────
    t_stage = time.time()
    stage_marker(7, 8, "Configuring logger, metadata, and runner hooks")
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

    meta = dict()
    meta['env_info'] = env_info
    meta['config'] = cfg.pretty_text
    meta['seed'] = cfg.seed
    meta['exp_name'] = os.path.basename(args.config)

    # Attach StartupLivenessHook for immediate iteration feedback
    if not hasattr(cfg, "custom_hooks") or cfg.custom_hooks is None:
        cfg.custom_hooks = []
    cfg.custom_hooks.append(dict(type='StartupLivenessHook', priority='VERY_LOW'))
    stage_marker(7, 8, "Hooks configured", f"interval={cfg.log_config.interval}", elapsed=time.time() - t_stage)

    # ── Stage 8/8: Launch Training Loop ───────────────────────────────────────
    log_int = cfg.log_config.get("interval", "N/A") if hasattr(cfg, "log_config") else "N/A"
    samples_gpu = cfg.data.get("samples_per_gpu", "N/A") if hasattr(cfg, "data") else "N/A"
    workers_gpu = cfg.data.get("workers_per_gpu", "N/A") if hasattr(cfg, "data") else "N/A"
    stage_marker(
        8, 8,
        "Entering training loop (train_detector)",
        f"epochs={cfg.runner.max_epochs}, iters/epoch={len(datasets[0])}, log_interval={log_int}, batch={samples_gpu}, workers={workers_gpu}",
        elapsed=time.time() - t_start
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
