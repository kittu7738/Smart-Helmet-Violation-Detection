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
    DEFAULT_MINORITY_THRESHOLDS,
    EXPECTED_CLASSES,
    _parse_args,
    _patch_config_data_root,
    _sanitize_float,
    apply_minority_optimizer,
    extract_coco_metrics,
    find_best_checkpoint,
    format_metrics_tables,
    parse_training_logs,
    safe_extract_metrics,
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


def test_sanitize_float():
    assert _sanitize_float(0.123456) == 0.1235
    assert _sanitize_float(float("nan")) == 0.0
    assert _sanitize_float(float("inf")) == 0.0
    assert _sanitize_float(-1.0) == 0.0
    assert _sanitize_float("invalid") == 0.0
    assert _sanitize_float(None) == 0.0


def test_safe_extract_metrics_short_copypaste_no_index_error():
    """
    Regression test: In MMDet 2.25.3, bbox_mAP_copypaste has only 6 tokens:
    '0.321 0.714 0.226 0.255 0.348 0.447'.
    Prior code crashed with IndexError: list index out of range when indexing [8].
    This test verifies that safe_extract_metrics handles 6 tokens, empty string,
    and missing copypaste without any IndexError, and recovers AR from alternate keys.
    """
    # 6 tokens: standard MMDet 2.25.3 copypaste output
    raw_6_tokens = {
        "bbox_mAP": 0.321,
        "bbox_mAP_50": 0.714,
        "bbox_mAP_75": 0.226,
        "bbox_mAP_s": 0.255,
        "bbox_mAP_m": 0.348,
        "bbox_mAP_l": 0.447,
        "bbox_mAP_copypaste": "0.321 0.714 0.226 0.255 0.348 0.447",
        "bbox_AR@100": 0.615,
        "driver_with_helmet_precision": 0.287,
        "bike_precision": 0.431,
        "driver_precision": 0.379,
        "passenger_with_helmet_precision": 0.215,
        "passenger_precision": 0.354,
        "driver_without_helmet_precision": 0.313,
        "passenger_without_helmet_precision": 0.273,
    }

    overall, classwise = safe_extract_metrics(None, raw_6_tokens, classes=EXPECTED_CLASSES)
    assert overall["mAP"] == 0.321
    assert overall["AP50"] == 0.714
    assert overall["AP75"] == 0.226
    assert overall["AR"] == 0.615  # safely extracted from bbox_AR@100
    assert classwise["driver_with_helmet"]["AP"] == 0.287
    assert classwise["bike"]["AP"] == 0.431
    assert classwise["passenger_without_helmet"]["AP"] == 0.273

    # Empty raw results
    overall_empty, classwise_empty = safe_extract_metrics(None, {}, classes=EXPECTED_CLASSES)
    assert overall_empty["mAP"] == 0.0
    assert overall_empty["AR"] == 0.0
    assert len(classwise_empty) == 7

    # Non-empty copypaste with no AR key
    raw_no_ar = {
        "bbox_mAP_copypaste": "0.100 0.200 0.050",
    }
    overall_no_ar, _ = safe_extract_metrics(None, raw_no_ar, classes=EXPECTED_CLASSES)
    assert overall_no_ar["mAP"] == 0.100
    assert overall_no_ar["AR"] == 0.0


def test_safe_extract_metrics_nan_resilience_and_json_serialization(tmp_path):
    """
    Verify that if precision or recall arrays contain NaNs or negative numbers,
    they are safely sanitized and json.dump produces compliant JSON.
    """
    class MockNaNCOCOeval:
        stats = np.array([float("nan"), 0.5, -1.0, float("inf")] + [0.0] * 8)
        eval = {
            "precision": np.full((10, 101, 7, 4, 3), float("nan")),
            "recall": np.full((10, 7, 4, 3), -1.0),
        }

    mock_eval = MockNaNCOCOeval()
    overall, classwise = safe_extract_metrics(None, {}, captured_coco_eval=mock_eval, classes=EXPECTED_CLASSES)

    assert overall["mAP"] == 0.0
    assert overall["AP50"] == 0.5
    assert overall["AP75"] == 0.0

    for cname in EXPECTED_CLASSES:
        assert classwise[cname]["AP"] == 0.0
        assert classwise[cname]["AR"] == 0.0

    # Ensure JSON serializability (standard json.dumps without NaN)
    out_file = tmp_path / "metrics_test.json"
    payload = {
        "overall": overall,
        "classwise": classwise,
    }
    json_str = json.dumps(payload, indent=2)
    assert "NaN" not in json_str
    assert "Infinity" not in json_str
    loaded = json.loads(json_str)
    assert loaded["overall"]["mAP"] == 0.0
    assert loaded["overall"]["AP50"] == 0.5


def test_apply_minority_optimizer():
    # 7 classes
    # class 1 (bike): score 0.25 (below bike thr 0.30 -> filtered out)
    # class 3 (passenger_with_helmet): score 0.18 (above p_w_h thr 0.15 -> kept)
    mock_img_results = [
        np.array([[10, 10, 50, 50, 0.22]]),  # 0: driver_with_helmet (thr 0.20 -> kept)
        np.array([[20, 20, 80, 80, 0.25]]),  # 1: bike (thr 0.30 -> dropped)
        np.array([[30, 30, 70, 70, 0.32]]),  # 2: driver (thr 0.30 -> kept)
        np.array([[15, 15, 45, 45, 0.18]]),  # 3: passenger_with_helmet (thr 0.15 -> kept)
        np.array([]),                         # 4: passenger (empty)
        np.array([[10, 10, 40, 40, 0.19]]),  # 5: driver_without_helmet (thr 0.20 -> dropped)
        np.array([[12, 12, 42, 42, 0.16]]),  # 6: passenger_without_helmet (thr 0.15 -> kept)
    ]
    outputs = [mock_img_results]

    filtered = apply_minority_optimizer(outputs, classes=EXPECTED_CLASSES)
    assert len(filtered) == 1
    res = filtered[0]

    # class 0: kept
    assert len(res[0]) == 1
    # class 1: dropped (0.25 < 0.30)
    assert len(res[1]) == 0
    # class 2: kept (0.32 >= 0.30)
    assert len(res[2]) == 1
    # class 3: kept (0.18 >= 0.15) - minority class preserved!
    assert len(res[3]) == 1
    # class 5: dropped (0.19 < 0.20)
    assert len(res[5]) == 0
    # class 6: kept (0.16 >= 0.15) - minority class preserved!
    assert len(res[6]) == 1


def test_filter_and_format_detections_with_minority_thresholds():
    mock_results = [
        np.array([[10, 20, 50, 60, 0.22]]),  # 0: driver_with_helmet
        np.array([[15, 25, 55, 65, 0.28]]),  # 1: bike
        np.array([[30, 40, 70, 80, 0.35]]),  # 2: driver
        np.array([[12, 18, 48, 58, 0.17]]),  # 3: passenger_with_helmet
    ]

    custom_thrs = {
        "bike": 0.30,
        "driver": 0.30,
        "driver_with_helmet": 0.20,
        "passenger_with_helmet": 0.15,
    }

    # With default uniform threshold 0.3, only driver (score 0.35) passes
    dets_uniform = filter_and_format_detections(mock_results, score_thr=0.3, classes=EXPECTED_CLASSES)
    assert len(dets_uniform) == 1
    assert dets_uniform[0]["class_name"] == "driver"

    # With minority thresholds, bike (0.28 < 0.30) drops, but driver, driver_with_helmet, and passenger_with_helmet pass
    dets_calibrated = filter_and_format_detections(
        mock_results,
        score_thr=0.3,
        classes=EXPECTED_CLASSES,
        minority_thresholds=custom_thrs,
    )
    assert len(dets_calibrated) == 3
    passed_names = {d["class_name"] for d in dets_calibrated}
    assert "driver" in passed_names
    assert "driver_with_helmet" in passed_names
    assert "passenger_with_helmet" in passed_names
    assert "bike" not in passed_names

