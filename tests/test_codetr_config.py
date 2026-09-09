"""
tests/test_codetr_config.py
===========================
Validation tests for the Co-DETR helmet detection configuration and training pipeline.
"""

import os
import runpy
import sys
import pytest


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CONFIG_PATH = os.path.join(REPO_ROOT, "configs", "codetr", "helmet_codetr_swin_large.py")
TRAIN_PY_PATH = os.path.join(REPO_ROOT, "training", "codetr", "train.py")


def test_config_file_exists():
    assert os.path.isfile(CONFIG_PATH), f"Config file not found at {CONFIG_PATH}"


def test_config_structure_and_classes():
    cfg = runpy.run_path(CONFIG_PATH)

    assert cfg["num_classes"] == 7
    expected_classes = (
        "driver_with_helmet",
        "bike",
        "driver",
        "passenger_with_helmet",
        "passenger",
        "driver_without_helmet",
        "passenger_without_helmet",
    )
    assert cfg["CLASSES"] == expected_classes
    assert len(cfg["CLASSES"]) == 7


def test_config_schedule_and_epochs():
    cfg = runpy.run_path(CONFIG_PATH)

    assert cfg["max_epochs"] == 12
    assert cfg["runner"]["type"] == "EpochBasedRunner"
    assert cfg["runner"]["max_epochs"] == 12
    assert cfg["lr_config"]["policy"] == "step"
    assert cfg["lr_config"]["step"] == [8, 11]


def test_config_evaluation_and_checkpointing():
    cfg = runpy.run_path(CONFIG_PATH)

    assert cfg["evaluation"]["interval"] == 1
    assert cfg["evaluation"]["metric"] == "bbox"
    assert cfg["evaluation"]["save_best"] == "bbox_mAP"

    assert cfg["checkpoint_config"]["interval"] == 1
    assert cfg["checkpoint_config"]["max_keep_ckpts"] == 3


def test_config_model_and_losses():
    cfg = runpy.run_path(CONFIG_PATH)

    model = cfg["model"]
    assert model["type"] == "CoDETR"
    assert model["backbone"]["type"] == "SwinTransformer"
    assert model["neck"]["type"] == "ChannelMapper"
    assert model["neck"]["num_outs"] == 5

    # Query head (Co-DINO)
    query_head = model["query_head"]
    assert query_head["type"] == "CoDINOHead"
    assert query_head["num_classes"] == 7
    assert query_head["loss_cls"]["type"] == "QualityFocalLoss"
    assert query_head["loss_cls"]["use_sigmoid"] is True
    assert query_head["loss_bbox"]["type"] == "L1Loss"
    assert query_head["loss_iou"]["type"] == "GIoULoss"

    # Denoising configuration
    assert "dn_cfg" in query_head
    dn_cfg = query_head["dn_cfg"]
    assert dn_cfg["type"] == "CdnQueryGenerator"
    assert dn_cfg["group_cfg"]["num_dn_queries"] == 100

    # Auxiliary heads loss weights (aligned with upstream Co-DETR)
    # RPN
    assert model["rpn_head"]["loss_cls"]["loss_weight"] == 12.0
    assert model["rpn_head"]["loss_bbox"]["loss_weight"] == 12.0

    # RoI Head
    roi_bbox = model["roi_head"][0]["bbox_head"]
    assert roi_bbox["loss_cls"]["loss_weight"] == 12.0
    assert roi_bbox["loss_bbox"]["loss_weight"] == 120.0

    # ATSS Head
    atss = model["bbox_head"][0]
    assert atss["loss_cls"]["loss_weight"] == 12.0
    assert atss["loss_bbox"]["loss_weight"] == 24.0
    assert atss["loss_centerness"]["loss_weight"] == 12.0


def test_train_py_argument_parser():
    # Load _parse_args without executing main()
    module = runpy.run_path(TRAIN_PY_PATH)
    parse_args_func = module["_parse_args"]

    # Test parser flags
    orig_argv = sys.argv
    try:
        sys.argv = [
            "train.py",
            "--config", CONFIG_PATH,
            "--data-root", "data/coco",
            "--work-dir", "work_dirs/test",
            "--auto-resume",
            "--seed", "123",
        ]
        args = parse_args_func()
        assert args.config == CONFIG_PATH
        assert args.data_root == "data/coco"
        assert args.work_dir == "work_dirs/test"
        assert args.auto_resume is True
        assert args.seed == 123
        assert args.resume_from is None
    finally:
        sys.argv = orig_argv
