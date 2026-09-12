"""
tests/test_fast_configs.py
==========================
Validation tests for fast experimental training configs:
- configs/faster_rcnn/helmet_faster_rcnn_r50_fpn.py (Faster R-CNN R50 FPN)
- configs/codetr/helmet_codetr_r50.py (Co-DETR R50)
Verifies class consistency, 7 classes, FP16 configuration, batch sizes,
data loader safety, and CLI argument parsing.
"""

import os
import runpy
import sys
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FASTER_RCNN_CONFIG = os.path.join(REPO_ROOT, "configs", "faster_rcnn", "helmet_faster_rcnn_r50_fpn.py")
CODETR_R50_CONFIG = os.path.join(REPO_ROOT, "configs", "codetr", "helmet_codetr_r50.py")

EXPECTED_CLASSES = (
    "driver_with_helmet",
    "bike",
    "driver",
    "passenger_with_helmet",
    "passenger",
    "driver_without_helmet",
    "passenger_without_helmet",
)


def test_faster_rcnn_config_syntax_and_classes():
    """Verify Faster R-CNN R50 FPN config parses cleanly and has exact 7 classes."""
    assert os.path.isfile(FASTER_RCNN_CONFIG), f"Config missing: {FASTER_RCNN_CONFIG}"
    cfg = runpy.run_path(FASTER_RCNN_CONFIG)

    assert cfg["CLASSES"] == EXPECTED_CLASSES
    assert cfg["num_classes"] == 7
    assert len(cfg["CLASSES"]) == 7


def test_faster_rcnn_model_architecture():
    """Verify Faster R-CNN model structure, ResNet-50 backbone, FPN neck, and RoI head."""
    cfg = runpy.run_path(FASTER_RCNN_CONFIG)

    model = cfg["model"]
    assert model["type"] == "FasterRCNN"
    assert model["backbone"]["type"] == "ResNet"
    assert model["backbone"]["depth"] == 50
    assert model["neck"]["type"] == "FPN"
    assert model["roi_head"]["bbox_head"]["num_classes"] == 7


def test_faster_rcnn_speed_and_fp16_optimizations():
    """Verify Faster R-CNN enables FP16 mixed precision, batch size 4, and workers=0."""
    cfg = runpy.run_path(FASTER_RCNN_CONFIG)

    assert "fp16" in cfg, "Faster R-CNN config must enable fp16 for Tensor Core acceleration"
    assert cfg["fp16"]["loss_scale"] == 512.0

    assert cfg["data"]["samples_per_gpu"] == 4, "Batch size must be >= 4 for high GPU throughput"
    assert cfg["data"]["workers_per_gpu"] == 0, "workers_per_gpu must be 0 to prevent fork deadlocks"
    assert cfg["evaluation"]["interval"] == 1
    assert cfg["evaluation"]["save_best"] == "bbox_mAP"


def test_codetr_r50_config_syntax_and_classes():
    """Verify Co-DETR ResNet-50 config parses cleanly and has exact 7 classes."""
    assert os.path.isfile(CODETR_R50_CONFIG), f"Config missing: {CODETR_R50_CONFIG}"
    cfg = runpy.run_path(CODETR_R50_CONFIG)

    assert cfg["CLASSES"] == EXPECTED_CLASSES
    assert cfg["num_classes"] == 7
    assert len(cfg["CLASSES"]) == 7


def test_codetr_r50_model_and_optimizations():
    """Verify Co-DETR R50 model structure, query count reduction, and FP16."""
    cfg = runpy.run_path(CODETR_R50_CONFIG)

    model = cfg["model"]
    assert model["type"] == "CoDETR"
    assert model["backbone"]["type"] == "ResNet"
    assert model["backbone"]["depth"] == 50
    assert model["query_head"]["num_query"] == 300, "Query count should be reduced to 300 for speed"
    assert "fp16" in cfg, "Co-DETR R50 should have fp16 enabled"
    assert cfg["data"]["samples_per_gpu"] == 2
    assert cfg["data"]["workers_per_gpu"] == 0


def test_train_cli_with_fast_configs():
    """Verify train.py CLI accepts the fast configs without errors."""
    from training.codetr.train import _parse_args

    args = _parse_args(["--config", FASTER_RCNN_CONFIG, "--max-epochs", "2"])
    assert args.config == FASTER_RCNN_CONFIG
    assert args.max_epochs == 2

    args2 = _parse_args(["--config", CODETR_R50_CONFIG, "--epochs", "1"])
    assert args2.config == CODETR_R50_CONFIG
    assert args2.max_epochs == 1


def test_all_configs_define_lifecycle_fields():
    """Verify that all configs define standard MMDetection lifecycle fields (resume_from, load_from, auto_resume, workflow)."""
    swin_config = os.path.join(REPO_ROOT, "configs", "codetr", "helmet_codetr_swin_large.py")

    for cfg_path in [FASTER_RCNN_CONFIG, CODETR_R50_CONFIG, swin_config]:
        cfg = runpy.run_path(cfg_path)
        assert "resume_from" in cfg, f"{cfg_path} must define resume_from"
        assert cfg["resume_from"] is None, f"{cfg_path} resume_from should default to None"
        assert "load_from" in cfg, f"{cfg_path} must define load_from"
        assert cfg["load_from"] is None, f"{cfg_path} load_from should default to None"
        assert "auto_resume" in cfg, f"{cfg_path} must define auto_resume"
        assert cfg["auto_resume"] is False, f"{cfg_path} auto_resume should default to False"
        assert "workflow" in cfg, f"{cfg_path} must define workflow"
        assert cfg["workflow"] == [("train", 1)]

