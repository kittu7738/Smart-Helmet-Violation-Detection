"""
tests/test_evaluation_script.py
===============================
Unit tests for the Co-DETR evaluation pipeline, log parsing, checkpoint
discovery, dataset path verification, and COCO metric extraction.
"""

import json
import os
import sys
import numpy as np
import pytest

from evaluation.codetr.evaluate import (
    EXPECTED_CLASSES,
    _parse_args,
    _patch_config_data_root,
    extract_coco_metrics,
    find_best_checkpoint,
    format_metrics_tables,
    parse_training_logs,
    verify_dataset_paths,
)


def test_expected_classes_integrity():
    assert len(EXPECTED_CLASSES) == 7
    expected = (
        "driver_with_helmet",
        "bike",
        "driver",
        "passenger_with_helmet",
        "passenger",
        "driver_without_helmet",
        "passenger_without_helmet",
    )
    assert EXPECTED_CLASSES == expected


def test_dataset_paths_verification(tmp_path):
    data_root = str(tmp_path / "data" / "coco")
    os.makedirs(os.path.join(data_root, "train", "images"), exist_ok=True)
    os.makedirs(os.path.join(data_root, "vaid", "images"), exist_ok=True)
    os.makedirs(os.path.join(data_root, "test", "images"), exist_ok=True)

    dummy_coco = {"images": [{"id": 1}], "annotations": [{"id": 1}], "categories": []}
    for split in ["train", "val", "test"]:
        with open(os.path.join(data_root, f"instances_{split}.json"), "w") as f:
            json.dump(dummy_coco, f)

    ok, report = verify_dataset_paths(data_root, target_split="test")
    assert ok is True
    assert report["train"]["valid"] is True
    assert report["val"]["valid"] is True
    assert report["test"]["valid"] is True
    assert report["test"]["num_images"] == 1


def test_parse_training_logs_text(tmp_path):
    log_file = tmp_path / "train_20260910.log"
    content = """
2026-09-09 18:24:10,123 - mmdet - INFO - Epoch(val) [1][65]  bbox_mAP: 0.0860, bbox_mAP_50: 0.2330, bbox_mAP_75: 0.0470, bbox_mAP_s: 0.0000, bbox_mAP_m: 0.0760, bbox_mAP_l: 0.1740
2026-09-09 18:32:15,456 - mmdet - INFO - Epoch(val) [2][65]  bbox_mAP: 0.1450, bbox_mAP_50: 0.3120, bbox_mAP_75: 0.0980, bbox_mAP_s: 0.0100, bbox_mAP_m: 0.1200, bbox_mAP_l: 0.2500
2026-09-09 18:40:20,789 - mmdet - INFO - Epoch(val) [3][65]  bbox_mAP: 0.2180, bbox_mAP_50: 0.4350, bbox_mAP_75: 0.1820, bbox_mAP_s: 0.0250, bbox_mAP_m: 0.1950, bbox_mAP_l: 0.3600
"""
    log_file.write_text(content)

    records = parse_training_logs(str(log_file))
    assert len(records) == 3
    assert records[1]["bbox_mAP"] == 0.0860
    assert records[2]["bbox_mAP"] == 0.1450
    assert records[3]["bbox_mAP"] == 0.2180
    assert records[3]["bbox_mAP_50"] == 0.4350


def test_find_best_checkpoint(tmp_path):
    work_dir = str(tmp_path / "work_dirs")
    os.makedirs(work_dir, exist_ok=True)

    # Create dummy checkpoint files
    for ep in [1, 2, 3]:
        ckpt_path = os.path.join(work_dir, f"best_bbox_mAP_epoch_{ep}.pth")
        with open(ckpt_path, "wb") as f:
            f.write(b"dummy")

    log_data = {
        1: {"epoch": 1, "bbox_mAP": 0.0860, "bbox_mAP_50": 0.2330, "bbox_mAP_75": 0.0470},
        2: {"epoch": 2, "bbox_mAP": 0.1450, "bbox_mAP_50": 0.3120, "bbox_mAP_75": 0.0980},
        3: {"epoch": 3, "bbox_mAP": 0.2180, "bbox_mAP_50": 0.4350, "bbox_mAP_75": 0.1820},
    }

    best_ckpt, best_ep, best_mAP, all_ckpts = find_best_checkpoint(work_dir, log_data)
    assert best_ep == 3
    assert best_mAP == 0.2180
    assert os.path.basename(best_ckpt) == "best_bbox_mAP_epoch_3.pth"
    assert len(all_ckpts) == 3


def test_extract_coco_metrics_and_formatting():
    # Construct a mock COCOeval object
    class MockCOCOeval:
        stats = np.array([0.250, 0.450, 0.220, 0.050, 0.200, 0.400, 0.150, 0.300, 0.380, 0.100, 0.320, 0.510])
        eval = {
            "precision": np.full((10, 101, 7, 4, 3), 0.35),
            "recall": np.full((10, 7, 4, 3), 0.42),
        }

    mock_eval = MockCOCOeval()
    overall, classwise = extract_coco_metrics(mock_eval, EXPECTED_CLASSES)

    assert overall["mAP"] == 0.250
    assert overall["AP50"] == 0.450
    assert overall["AP75"] == 0.220
    assert overall["AR"] == 0.380

    assert len(classwise) == 7
    for cname in EXPECTED_CLASSES:
        assert cname in classwise
        assert classwise[cname]["AP"] == pytest.approx(0.35, rel=1e-3)
        assert classwise[cname]["AR"] == pytest.approx(0.42, rel=1e-3)

    table = format_metrics_tables(overall, classwise, split="test", ckpt_name="best_bbox_mAP_epoch_10.pth")
    assert "FINAL EVALUATION REPORT — SPLIT: TEST" in table
    assert "mAP (0.50:0.95)" in table
    assert "driver_with_helmet" in table
    assert "passenger_without_helmet" in table


def test_cli_parser_defaults():
    orig_argv = sys.argv
    try:
        sys.argv = ["evaluate.py"]
        args = _parse_args()
        assert args.split == "test"
        assert args.classwise is True
        assert args.config == "configs/codetr/helmet_codetr_swin_large.py"
    finally:
        sys.argv = orig_argv
