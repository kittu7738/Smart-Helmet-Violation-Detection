#!/usr/bin/env python3
"""
training/codetr/sanity_check.py
===============================
Pre-training sanity check for the Co-DETR pipeline.

Verifies — WITHOUT launching training — that:
  1. The config file parses without errors.
  2. The COCO-format dataset exists and loads successfully.
  3. The dataset class count matches the config (7 classes).
  4. At least one image can be loaded from the train split.
  5. PyTorch CUDA / GPU is available.
  6. The Co-DETR model can be instantiated on the GPU.

Usage (Google Colab):
    CODETR_DATA_ROOT=/content/drive/MyDrive/helmet_dataset/coco \
    python training/codetr/sanity_check.py

    # Or with explicit arguments:
    python training/codetr/sanity_check.py \
        --config configs/codetr/helmet_codetr_swin_large.py \
        --data-root /path/to/coco
"""

import os
import sys
import time

# Immediate visual confirmation that Python process is running
print(f"[{time.strftime('%H:%M:%S')}] >>> Co-DETR sanity_check.py initializing (PID {os.getpid()}) <<<", flush=True)
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
import json
import traceback

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

# ──────────────────────────────────────────────────────────────────────────────
# Colour helpers
# ──────────────────────────────────────────────────────────────────────────────
_GREEN = "\033[92m"
_RED = "\033[91m"
_YELLOW = "\033[93m"
_CYAN = "\033[96m"
_BOLD = "\033[1m"
_RESET = "\033[0m"


def _ok(msg):
    print(f"  {_GREEN}✔{_RESET}  {msg}")


def _fail(msg):
    print(f"  {_RED}✘{_RESET}  {msg}")


def _warn(msg):
    print(f"  {_YELLOW}!{_RESET}  {msg}")


def _header(msg):
    print(f"\n{_BOLD}{_CYAN}{msg}{_RESET}")


# ──────────────────────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────────────────────
def _parse_args():
    p = argparse.ArgumentParser(
        description="Pre-training sanity check for Co-DETR helmet detection"
    )
    p.add_argument(
        "--config",
        default="configs/codetr/helmet_codetr_swin_large.py",
        help="Path to the MMDetection config file.",
    )
    p.add_argument(
        "--data-root",
        default=None,
        help="Override COCO dataset root (env: CODETR_DATA_ROOT).",
    )
    p.add_argument(
        "--skip-model",
        action="store_true",
        help="Skip model instantiation (useful if GPU is unavailable).",
    )
    return p.parse_args()


# ──────────────────────────────────────────────────────────────────────────────
# Individual checks
# ──────────────────────────────────────────────────────────────────────────────
def check_config(config_path):
    """Check 1: Config file can be parsed and audited for training improvements."""
    _header("1. Config file")
    if not os.path.isfile(config_path):
        _fail(f"Config not found: {config_path}")
        return None
    try:
        from mmcv import Config
        cfg = Config.fromfile(config_path)
        _ok(f"Parsed successfully: {config_path}")
        num_cls = cfg.get("num_classes", None)
        classes = cfg.get("CLASSES", None)
        if num_cls is not None:
            _ok(f"num_classes = {num_cls}")
        if classes is not None:
            _ok(f"CLASSES ({len(classes)}): {classes}")

        # Check generalization improvements
        train_pipeline = cfg.get("train_pipeline", [])
        has_pmd = any(step.get("type") == "PhotoMetricDistortion" for step in train_pipeline)
        if has_pmd:
            _ok("Data Augmentation: PhotoMetricDistortion is enabled.")
        else:
            _warn("Data Augmentation: PhotoMetricDistortion not found in train_pipeline.")

        lr_cfg = cfg.get("lr_config", {})
        if lr_cfg.get("warmup") == "linear":
            _ok(f"Learning Rate Warmup: linear warmup enabled ({lr_cfg.get('warmup_iters')} iters).")
        else:
            _warn("Learning Rate Warmup: no linear warmup configured in lr_config.")

        opt = cfg.get("optimizer", {})
        wd = opt.get("weight_decay", 0.0)
        _ok(f"Optimizer: {opt.get('type')} (lr={opt.get('lr')}, weight_decay={wd})")

        return cfg
    except Exception:
        _fail(f"Failed to parse config:\n{traceback.format_exc()}")
        return None


def check_dataset(cfg, data_root):
    """Check 2–4: Dataset files exist, class count matches, images loadable."""
    _header("2. Dataset files")

    from evaluation.codetr.evaluate import verify_dataset_paths
    ds_ok, report = verify_dataset_paths(data_root)

    train_info = report.get("train", {})
    val_info = report.get("val", {})
    test_info = report.get("test", {})

    all_valid = True
    for sname, sinfo in [("Train", train_info), ("Val", val_info)]:
        if sinfo.get("ann_exists"):
            _ok(f"{sname} annotations: {sinfo['ann_path']} ({sinfo.get('num_images', 0)} images, {sinfo.get('num_annotations', 0)} annotations)")
        else:
            _fail(f"{sname} annotations NOT FOUND under {data_root}")
            all_valid = False
        if sinfo.get("img_exists"):
            _ok(f"{sname} images dir: {sinfo['img_path']}")
        else:
            _fail(f"{sname} images dir NOT FOUND under {data_root}")
            all_valid = False

    if test_info.get("valid"):
        _ok(f"Test split (held-out): {test_info['ann_path']} ({test_info.get('num_images', 0)} images, {test_info.get('num_annotations', 0)} annotations)")
    elif test_info.get("ann_exists"):
        _warn(f"Test annotations found ({test_info['ann_path']}), but image dir: {test_info.get('img_path')}")
    else:
        _warn(f"Held-out test split not found under {data_root} (optional for training, required for final evaluation)")

    if not (train_info.get("valid") and val_info.get("valid")) or not all_valid:
        return False

    ann_train = train_info["ann_path"]
    img_train = train_info["img_path"]

    # ── Inspect annotation JSON ───────────────────────────────────────────
    _header("3. Annotation contents")
    try:
        with open(ann_train, "r") as f:
            coco = json.load(f)

        categories = coco.get("categories", [])
        images = coco.get("images", [])
        annotations = coco.get("annotations", [])

        _ok(f"Categories : {len(categories)}")
        _ok(f"Images     : {len(images)}")
        _ok(f"Annotations: {len(annotations)}")

        cat_names = [c["name"] for c in categories]
        _ok(f"Category names: {cat_names}")

        # Check class count matches config
        cfg_classes = list(cfg.get("CLASSES", ()))
        cfg_num = cfg.get("num_classes", 0)

        if len(categories) == cfg_num:
            _ok(f"Category count ({len(categories)}) matches config num_classes ({cfg_num})")
        else:
            _fail(
                f"Category count ({len(categories)}) does NOT match "
                f"config num_classes ({cfg_num})"
            )
            return False

    except Exception:
        _fail(f"Failed to read annotations:\n{traceback.format_exc()}")
        return False

    # ── Try loading one image ─────────────────────────────────────────────
    _header("4. Image loading")
    if not images:
        _fail("Annotation file has no images")
        return False

    first_img = images[0]
    img_path = os.path.join(img_train, first_img["file_name"])
    if not os.path.isfile(img_path):
        _fail(f"First image not found at {img_path}")
        return False

    try:
        import cv2
        img = cv2.imread(img_path)
        if img is not None:
            h, w = img.shape[:2]
            _ok(f"Loaded {first_img['file_name']}: {w}x{h}")
            return True
        else:
            _fail(f"cv2.imread returned None for {img_path}")
            return False
    except ImportError:
        try:
            from PIL import Image
            with Image.open(img_path) as im:
                w, h = im.size
            _ok(f"Loaded {first_img['file_name']} (via PIL): {w}x{h}")
            return True
        except Exception:
            _warn("OpenCV and PIL not available — skipping pixel load test")
            return True


def check_gpu():
    """Check 5: CUDA / GPU availability."""
    _header("5. GPU / CUDA")
    try:
        import torch
        _ok(f"PyTorch {torch.__version__}")
        if torch.cuda.is_available():
            gpu = torch.cuda.get_device_name(0)
            mem = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
            _ok(f"CUDA available — GPU: {gpu} ({mem:.1f} GB)")
            return True
        else:
            _warn("CUDA not available — training will not work without a GPU")
            return False
    except Exception:
        _fail(f"PyTorch import failed:\n{traceback.format_exc()}")
        return False


def check_mmcv_mmdet():
    """Check mmcv and mmdet versions."""
    _header("5b. MMCV / MMDetection")
    ok = True
    try:
        import mmcv
        _ok(f"mmcv {mmcv.__version__}")
    except ImportError:
        _fail("mmcv not importable")
        ok = False
    try:
        import mmdet
        _ok(f"mmdet {mmdet.__version__}")
    except ImportError:
        _fail("mmdet not importable")
        ok = False
    return ok


def check_model(cfg):
    """Check 6: Model can be instantiated."""
    _header("6. Model instantiation")
    try:
        import torch
        from mmdet.models import build_detector
        
        # Explicitly import Co-DETR projects module to register the model
        try:
            import projects
            
            # Patch: Register mmcv's MultiScaleDeformableAttention as MultiScaleDeformAttn
            # to match the config's expectations without duplicating code.
            from mmcv.cnn.bricks.registry import ATTENTION
            from mmcv.ops.multi_scale_deform_attn import MultiScaleDeformableAttention
            if 'MultiScaleDeformAttn' not in ATTENTION:
                ATTENTION.register_module(name='MultiScaleDeformAttn', module=MultiScaleDeformableAttention)
        except ImportError:
            _warn("Could not import 'projects' from Co-DETR. Ensure CODETR_REPO is correct.")

        model = build_detector(
            cfg.model,
            train_cfg=cfg.get("train_cfg"),
            test_cfg=cfg.get("test_cfg"),
        )
        num_params = sum(p.numel() for p in model.parameters()) / 1e6
        _ok(f"Model built successfully: {num_params:.1f}M parameters")

        if torch.cuda.is_available():
            model = model.cuda()
            _ok("Model moved to GPU")

            # Small forward pass to verify no shape / device errors
            import torch
            dummy = torch.randn(1, 3, 256, 256).cuda()
            model.eval()
            with torch.no_grad():
                try:
                    # model.extract_feat is safer than full forward
                    feats = model.extract_feat(dummy)
                    _ok(f"Forward pass (extract_feat): {len(feats)} feature maps")
                except Exception as exc:
                    _warn(f"extract_feat raised {type(exc).__name__}: {exc}")
                    _warn("This may be normal — full forward requires annotations.")
        else:
            _warn("GPU unavailable — skipping GPU placement test")

        return True
    except Exception:
        _fail(f"Model build failed:\n{traceback.format_exc()}")
        return False


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────
def main():
    args = _parse_args()
    data_root_raw = args.data_root or os.environ.get("CODETR_DATA_ROOT")
    data_root = data_root_raw.rstrip("/").rstrip(os.sep) if data_root_raw else None

    print(f"\n{_BOLD}{'═' * 52}{_RESET}")
    print(f"{_BOLD}  Co-DETR Pre-Training Sanity Check{_RESET}")
    print(f"{_BOLD}{'═' * 52}{_RESET}")
    print(f"  Config   : {args.config}")
    print(f"  Data root: {data_root}")

    results = {}

    # 1. Config
    cfg = check_config(args.config)
    results["config"] = cfg is not None

    # 2–4. Dataset
    if cfg is not None and data_root and os.path.isdir(data_root):
        results["dataset"] = check_dataset(cfg, data_root)
    elif not data_root or not os.path.isdir(data_root):
        _header("2–4. Dataset")
        if not data_root:
            _warn("Data root not specified.")
        else:
            _warn(f"Data root does not exist: {data_root}")
        _warn("Dataset checks skipped. Supply --data-root or CODETR_DATA_ROOT.")
        results["dataset"] = None  # skipped, not failed
    else:
        results["dataset"] = False

    # 5. GPU
    results["gpu"] = check_gpu()

    # 5b. MMCV/MMDet
    results["mmcv_mmdet"] = check_mmcv_mmdet()

    # 6. Model
    if not args.skip_model and cfg is not None and results.get("mmcv_mmdet"):
        results["model"] = check_model(cfg)
    elif args.skip_model:
        _header("6. Model instantiation")
        _warn("Skipped (--skip-model)")
        results["model"] = None
    else:
        results["model"] = False

    # ── Final summary ─────────────────────────────────────────────────────
    print(f"\n{_BOLD}{'═' * 52}{_RESET}")
    all_pass = True
    for name, status in results.items():
        if status is True:
            _ok(f"{name}: PASS")
        elif status is None:
            _warn(f"{name}: SKIPPED")
        else:
            _fail(f"{name}: FAIL")
            all_pass = False

    print()
    if all_pass:
        print(f"  {_GREEN}{_BOLD}✅  All checks passed — ready to train.{_RESET}\n")
        return 0
    else:
        any_skipped = any(v is None for v in results.values())
        if any_skipped and not any(v is False for v in results.values()):
            print(
                f"  {_YELLOW}{_BOLD}⚠  Some checks skipped — "
                f"review warnings above.{_RESET}\n"
            )
            return 0
        else:
            print(
                f"  {_RED}{_BOLD}❌  Some checks failed — "
                f"fix errors above before training.{_RESET}\n"
            )
            return 1


if __name__ == "__main__":
    sys.exit(main())
