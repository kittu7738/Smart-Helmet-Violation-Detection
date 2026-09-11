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
    assert cfg["lr_config"]["warmup"] == "linear"
    assert cfg["lr_config"]["warmup_iters"] == 250
    assert cfg["lr_config"]["warmup_ratio"] == 0.001


def test_config_generalization_improvements():
    cfg = runpy.run_path(CONFIG_PATH)

    # 1. PhotoMetricDistortion in train_pipeline
    pipeline = cfg["train_pipeline"]
    has_pmd = any(step.get("type") == "PhotoMetricDistortion" for step in pipeline)
    assert has_pmd is True, "PhotoMetricDistortion must be enabled in train_pipeline"

    # 2. Multi-scale scale expansion
    auto_aug = [s for s in pipeline if s.get("type") == "AutoAugment"][0]
    scales_policy0 = auto_aug["policies"][0][0]["img_scale"]
    assert (960, 1333) in scales_policy0, "Expected scale (960, 1333) in AutoAugment policy 0"

    # 3. Regularization: Weight decay >= 0.01
    assert cfg["optimizer"]["weight_decay"] == 0.01

    # 4. IoU precision enhancement
    assert cfg["model"]["query_head"]["loss_iou"]["loss_weight"] == 3.0
    assert cfg["model"]["train_cfg"][0]["assigner"]["iou_cost"]["weight"] == 3.0


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


def test_validate_and_patch_data_root_nested_and_flat(tmp_path):
    import json
    from types import SimpleNamespace

    module = runpy.run_path(TRAIN_PY_PATH)
    patch_func = module["_validate_and_patch_data_root"]

    # Test nested layout (Google Drive structure)
    data_root = tmp_path / "data"
    os.makedirs(data_root / "train" / "images", exist_ok=True)
    os.makedirs(data_root / "vaid" / "images", exist_ok=True)
    os.makedirs(data_root / "test" / "images", exist_ok=True)

    dummy_coco = {"images": [{"id": 1}], "annotations": []}
    with open(data_root / "train" / "instances_train.json", "w") as f:
        json.dump(dummy_coco, f)
    with open(data_root / "vaid" / "instances_val.json", "w") as f:
        json.dump(dummy_coco, f)
    with open(data_root / "test" / "instances_test.json", "w") as f:
        json.dump(dummy_coco, f)

    cfg = SimpleNamespace(
        data=SimpleNamespace(
            train=SimpleNamespace(ann_file="", img_prefix=""),
            val=SimpleNamespace(ann_file="", img_prefix=""),
            test=SimpleNamespace(ann_file="", img_prefix=""),
        )
    )

    patch_func(cfg, str(data_root))
    assert cfg.data.train.ann_file == str(data_root / "train" / "instances_train.json")
    assert cfg.data.train.img_prefix.endswith("train/images/")
    assert cfg.data.val.ann_file == str(data_root / "vaid" / "instances_val.json")
    assert cfg.data.val.img_prefix.endswith("vaid/images/")
    assert cfg.data.test.ann_file == str(data_root / "test" / "instances_test.json")
    assert cfg.data.test.img_prefix.endswith("test/images/")

