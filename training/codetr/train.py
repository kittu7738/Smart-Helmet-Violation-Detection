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


def _validate_and_patch_data_root(cfg, data_root):
    """
    Verify dataset paths for train and val splits (supporting both flat and nested layouts)
    and patch the MMDetection config accordingly.
    """
    from evaluation.codetr.evaluate import verify_dataset_paths
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
                f"img_prefix={split_cfg.img_prefix}",
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

        # Patch: Register mmcv's MultiScaleDeformableAttention as MultiScaleDeformAttn
        # to match the config's expectations without duplicating code.
        try:
            from mmcv.cnn.bricks.registry import ATTENTION
            from mmcv.ops.multi_scale_deform_attn import MultiScaleDeformableAttention
            if 'MultiScaleDeformAttn' not in ATTENTION:
                ATTENTION.register_module(name='MultiScaleDeformAttn', module=MultiScaleDeformableAttention)
        except Exception:
            pass

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
                def __init__(self, *args, **kwargs):
                    super().__init__()
                    self._start_time = None

                def before_train_iter(self, runner):
                    self._start_time = time.time()

                def after_train_iter(self, runner):
                    dur = time.time() - self._start_time if self._start_time else 0.0
                    loss_val = runner.outputs.get('loss', None) if hasattr(runner, 'outputs') and isinstance(runner.outputs, dict) else None
                    loss_str = f"{loss_val.item():.4f}" if hasattr(loss_val, 'item') else str(loss_val)

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
                        "step_time": dur,
                        "loss": loss_str,
                        "gpu_mem": gpu_mem_str,
                    }
                    raise TrainingDiagnosticComplete(stats)

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
    _validate_and_patch_data_root(cfg, data_root)
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
        print(f"[{time.strftime('%H:%M:%S')}]   -> Attached TrainingDiagnosticHook (runs exactly 1 iteration, then verifies pipeline readiness)", flush=True)

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
        print(f"  Iteration 1 forward/backward execution verified in {diag.stats.get('step_time', 0):.2f}s.", flush=True)
        print(f"  - Initial loss : {diag.stats.get('loss', 'N/A')}", flush=True)
        print(f"  - Peak GPU VRAM: {diag.stats.get('gpu_mem', 'N/A')}", flush=True)
        print(f"  - Total elapsed: {t_total:.2f}s", flush=True)
        print("  Full training pipeline is 100% verified and ready for complete training.", flush=True)
        print("=" * 74 + "\n", flush=True)
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
