"""
python-service/model_loader.py
==============================
Initializes the Co-DETR environment, applies FP16 compatibility bridges,
and loads the model checkpoint ONCE into memory.
"""

import os
import sys
import time
from typing import Tuple, Any

# Ensure repository root and Co-DETR source are on sys.path
_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_SERVICE_DIR, ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

_CODETR_REPO = os.environ.get("CODETR_REPO", "/content/Co-DETR")
for cand in [_CODETR_REPO, os.path.abspath(os.path.join(_REPO_ROOT, "..", "Co-DETR")), "/content/Co-DETR"]:
    if cand and os.path.isdir(cand) and cand not in sys.path:
        sys.path.insert(0, cand)
        break


def apply_codetr_compatibility_patches():
    """
    Applies the FP16 stability and SoftNMS patches for Co-DETR / MMCV.
    Safe to call multiple times (idempotent).
    """
    try:
        import torch
        import mmcv.ops.multi_scale_deform_attn as msda_mod
        from mmcv.cnn.bricks.registry import ATTENTION

        # Resolve function class
        func_cls = getattr(msda_mod, 'MultiScaleDeformableAttnFunction', None)
        if func_cls is None:
            func_cls = getattr(msda_mod, 'MultiScaleDeformAttnFunction', None)

        # 1. Register MultiScaleDeformAttn
        attn_cls = getattr(msda_mod, 'MultiScaleDeformableAttention', None)
        if attn_cls is not None and "MultiScaleDeformAttn" not in ATTENTION:
            ATTENTION.register_module(name="MultiScaleDeformAttn", module=attn_cls)

        # 2. MultiScaleDeformAttnFunction FP32 kernel bridge
        if func_cls is not None and not getattr(func_cls, "_fp16_patched", False):
            _orig_forward = func_cls.forward

            @staticmethod
            def _fp16_safe_forward(ctx, value, spatial_shapes, level_start_index,
                                   sampling_locations, attention_weights, im2col_step):
                orig_dtype = value.dtype
                if value.dtype == torch.float16:
                    value = value.float()
                if sampling_locations.dtype == torch.float16:
                    sampling_locations = sampling_locations.float()
                if attention_weights.dtype == torch.float16:
                    attention_weights = attention_weights.float()
                out = _orig_forward(ctx, value, spatial_shapes, level_start_index,
                                    sampling_locations, attention_weights, im2col_step)
                if orig_dtype == torch.float16 and out.dtype != torch.float16:
                    out = out.half()
                return out

            func_cls.forward = _fp16_safe_forward
            func_cls._fp16_patched = True

        # 3. Patch CoDeformDETRHead & CoDINOHead get_bboxes & _get_bboxes_single for Float32 NMS
        try:
            from projects.models.co_deformable_detr_head import CoDeformDETRHead
            from projects.models.co_dino_head import CoDINOHead

            def _make_fp16_safe_get_bboxes(orig_fn):
                def get_bboxes_fp16_safe(self, *args, **kwargs):
                    def _to_float(item):
                        if hasattr(item, 'dtype') and item.dtype == torch.float16:
                            return item.float()
                        elif isinstance(item, (list, tuple)):
                            return type(item)(_to_float(x) for x in item)
                        elif isinstance(item, dict):
                            return {k: _to_float(v) for k, v in item.items()}
                        return item
                    args = [_to_float(a) for a in args]
                    kwargs = {k: _to_float(v) for k, v in kwargs.items()}
                    return orig_fn(self, *args, **kwargs)
                return get_bboxes_fp16_safe

            def _make_fp16_safe_get_bboxes_single(orig_fn):
                def _get_bboxes_single_fp16_safe(self, cls_score, bbox_pred, *args, **kwargs):
                    if hasattr(cls_score, 'dtype') and cls_score.dtype == torch.float16:
                        cls_score = cls_score.float()
                    if hasattr(bbox_pred, 'dtype') and bbox_pred.dtype == torch.float16:
                        bbox_pred = bbox_pred.float()
                    return orig_fn(self, cls_score, bbox_pred, *args, **kwargs)
                return _get_bboxes_single_fp16_safe

            if not getattr(CoDeformDETRHead, '_fp16_eval_patched', False):
                if hasattr(CoDeformDETRHead, 'get_bboxes'):
                    CoDeformDETRHead.get_bboxes = _make_fp16_safe_get_bboxes(CoDeformDETRHead.get_bboxes)
                if hasattr(CoDeformDETRHead, '_get_bboxes_single'):
                    CoDeformDETRHead._get_bboxes_single = _make_fp16_safe_get_bboxes_single(CoDeformDETRHead._get_bboxes_single)
                CoDeformDETRHead._fp16_eval_patched = True

            if not getattr(CoDINOHead, '_fp16_eval_patched', False):
                if hasattr(CoDINOHead, 'get_bboxes') and CoDINOHead.get_bboxes is not CoDeformDETRHead.get_bboxes:
                    CoDINOHead.get_bboxes = _make_fp16_safe_get_bboxes(CoDINOHead.get_bboxes)
                if hasattr(CoDINOHead, '_get_bboxes_single') and CoDINOHead._get_bboxes_single is not CoDeformDETRHead._get_bboxes_single:
                    CoDINOHead._get_bboxes_single = _make_fp16_safe_get_bboxes_single(CoDINOHead._get_bboxes_single)
                CoDINOHead._fp16_eval_patched = True
        except Exception as e:
            print(f"[WARN] CoDeformDETRHead eval patch note: {e}")

    except Exception as e:
        print(f"[WARN] Compatibility patch note: {e}")


def load_model_and_config(config_path: str, checkpoint_path: str, device_name: str = "cuda") -> Tuple[Any, Any]:
    """
    Builds the Co-DETR model, loads checkpoint weights, and transfers to target device.
    Returns (model, cfg).
    """
    import torch
    from mmcv import Config
    from mmcv.runner import load_checkpoint
    from mmdet.models import build_detector
    import projects

    # Apply patches before building
    apply_codetr_compatibility_patches()

    if not os.path.isfile(config_path):
        raise FileNotFoundError(f"Config file not found: {config_path}")

    if not os.path.isfile(checkpoint_path):
        raise FileNotFoundError(f"Checkpoint file not found: {checkpoint_path}")

    print(f"[{time.strftime('%H:%M:%S')}] Loading Co-DETR configuration: {config_path}")
    cfg = Config.fromfile(config_path)
    cfg.model.pretrained = None

    print(f"[{time.strftime('%H:%M:%S')}] Building detector...")
    model = build_detector(cfg.model, test_cfg=cfg.get("test_cfg"))
    model.cfg = cfg

    print(f"[{time.strftime('%H:%M:%S')}] Loading checkpoint weights: {checkpoint_path}")
    checkpoint = load_checkpoint(model, checkpoint_path, map_location="cpu")

    from config import EXPECTED_CLASSES
    if "CLASSES" in checkpoint.get("meta", {}):
        model.CLASSES = checkpoint["meta"]["CLASSES"]
    else:
        model.CLASSES = EXPECTED_CLASSES

    # Device allocation
    target_device = torch.device(device_name if (device_name.startswith("cuda") and torch.cuda.is_available()) else "cpu")
    print(f"[{time.strftime('%H:%M:%S')}] Moving model to target device: {target_device}")
    model.to(target_device)
    model.eval()

    return model, cfg
