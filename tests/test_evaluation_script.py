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
from inference.codetr.infer import (
    filter_and_format_detections,
    load_processed_image_ids,
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


def test_dataset_paths_verification_flat(tmp_path):
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


def test_dataset_paths_verification_nested(tmp_path):
    """Test verification on user's exact Google Drive layout where instances_*.json are inside split subdirectories."""
    data_root = str(tmp_path / "data")
    os.makedirs(os.path.join(data_root, "train", "images"), exist_ok=True)
    os.makedirs(os.path.join(data_root, "vaid", "images"), exist_ok=True)
    os.makedirs(os.path.join(data_root, "test", "images"), exist_ok=True)

    dummy_train = {"images": [{"id": i} for i in range(366)], "annotations": []}
    dummy_val = {"images": [{"id": i} for i in range(65)], "annotations": []}
    dummy_test = {"images": [{"id": i} for i in range(52)], "annotations": []}

    with open(os.path.join(data_root, "train", "instances_train.json"), "w") as f:
        json.dump(dummy_train, f)
    with open(os.path.join(data_root, "vaid", "instances_val.json"), "w") as f:
        json.dump(dummy_val, f)
    with open(os.path.join(data_root, "test", "instances_test.json"), "w") as f:
        json.dump(dummy_test, f)

    ok, report = verify_dataset_paths(data_root, target_split="test")
    assert ok is True
    assert report["train"]["num_images"] == 366
    assert report["val"]["num_images"] == 65
    assert report["test"]["num_images"] == 52
    assert report["test"]["valid"] is True


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


def test_find_best_checkpoint_with_logs(tmp_path):
    work_dir = str(tmp_path / "work_dirs")
    os.makedirs(work_dir, exist_ok=True)

    for ep in [8, 9, 10]:
        ckpt_path = os.path.join(work_dir, f"epoch_{ep}.pth")
        with open(ckpt_path, "wb") as f:
            f.write(b"dummy")

    with open(os.path.join(work_dir, "best_bbox_mAP_epoch_9.pth"), "wb") as f:
        f.write(b"dummy_best")

    log_data = {
        8: {"epoch": 8, "bbox_mAP": 0.4500, "bbox_mAP_50": 0.6800, "bbox_mAP_75": 0.4200},
        9: {"epoch": 9, "bbox_mAP": 0.4850, "bbox_mAP_50": 0.7250, "bbox_mAP_75": 0.4600},
        10: {"epoch": 10, "bbox_mAP": 0.4790, "bbox_mAP_50": 0.7180, "bbox_mAP_75": 0.4550},
    }

    best_ckpt, best_ep, best_mAP, all_ckpts = find_best_checkpoint(work_dir, log_data)
    assert best_ep == 9
    assert best_mAP == 0.4850
    assert os.path.basename(best_ckpt) == "best_bbox_mAP_epoch_9.pth"


def test_find_best_checkpoint_filename_fallback(tmp_path):
    """Test identifying best_bbox_mAP_epoch_9.pth directly when no log file is present."""
    work_dir = str(tmp_path / "work_dirs")
    os.makedirs(work_dir, exist_ok=True)

    for name in ["epoch_8.pth", "epoch_9.pth", "epoch_10.pth", "best_bbox_mAP_epoch_9.pth", "latest.pth"]:
        with open(os.path.join(work_dir, name), "wb") as f:
            f.write(b"content")

    best_ckpt, best_ep, best_mAP, all_ckpts = find_best_checkpoint(work_dir, log_data=None)
    assert best_ep == 9
    assert os.path.basename(best_ckpt) == "best_bbox_mAP_epoch_9.pth"


def test_extract_coco_metrics_and_formatting():
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

    table = format_metrics_tables(overall, classwise, split="test", ckpt_name="best_bbox_mAP_epoch_9.pth")
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


def test_inference_helpers(tmp_path):
    # Test filter_and_format_detections
    mock_results = [
        np.array([[10, 20, 50, 60, 0.85], [15, 25, 55, 65, 0.20]]),  # class 0: 1 pass, 1 below 0.3
        np.array([]),  # class 1: empty
        np.array([[30, 40, 70, 80, 0.92]]),  # class 2: 1 pass
    ]
    detections = filter_and_format_detections(mock_results, score_thr=0.3, classes=EXPECTED_CLASSES)
    assert len(detections) == 2
    assert detections[0]["class_name"] == "driver_with_helmet"
    assert detections[0]["score"] == 0.85
    assert detections[1]["class_name"] == "driver"
    assert detections[1]["score"] == 0.92

    # Test load_processed_image_ids
    jsonl_file = tmp_path / "detections.jsonl"
    with open(jsonl_file, "w") as f:
        f.write(json.dumps({"image_file": "img1.jpg"}) + "\n")
        f.write(json.dumps({"image_file": "img2.jpg"}) + "\n")

    done = load_processed_image_ids(str(jsonl_file))
    assert "img1.jpg" in done
    assert "img2.jpg" in done
    assert len(done) == 2
