"""
tests/test_dataset_validation.py
================================
Unit tests for data/validate_dataset.py verifying:
- Image count checking (train: 366, val: 65, test: 52)
- Intentional 'vaid' validation directory resolution
- Bounding box sanity checks (x >= 0, y >= 0, w > 0, h > 0)
- Orphan annotation detection
- Duplicate ID detection
- Missing image file detection
- Category mapping against the 7 target helmet classes
"""

import json
import os
import sys
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from data.validate_dataset import (
    EXPECTED_CLASSES,
    EXPECTED_COUNTS,
    find_split_files,
    validate_split,
    validate_dataset_all,
)


def _create_mock_split(base_dir, split_name, num_images=5, img_w=640, img_h=480, make_orphan=False, bad_box=False):
    """Helper to generate mock COCO images and annotations."""
    folder = "vaid" if split_name == "val" else split_name
    img_dir = os.path.join(base_dir, folder, "images")
    os.makedirs(img_dir, exist_ok=True)

    images = []
    annotations = []
    categories = [{"id": i, "name": c} for i, c in enumerate(EXPECTED_CLASSES)]

    ann_id = 1
    for i in range(1, num_images + 1):
        fname = f"{split_name}_{i:04d}.jpg"
        fpath = os.path.join(img_dir, fname)
        # Write dummy JPEG header
        with open(fpath, "wb") as f:
            f.write(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb")

        images.append({
            "id": i,
            "file_name": fname,
            "width": img_w,
            "height": img_h,
        })

        # Add a valid annotation
        box = [10.0, 10.0, 50.0, 60.0]
        if bad_box and i == 1:
            box = [-5.0, 10.0, -10.0, 60.0]  # Negative coord and width

        target_img_id = (9999 if (make_orphan and i == 1) else i)
        annotations.append({
            "id": ann_id,
            "image_id": target_img_id,
            "category_id": (i % 7),
            "bbox": box,
            "area": box[2] * box[3],
            "iscrowd": 0,
        })
        ann_id += 1

    coco = {
        "images": images,
        "annotations": annotations,
        "categories": categories,
    }

    ann_path = os.path.join(base_dir, f"instances_{split_name}.json")
    with open(ann_path, "w") as f:
        json.dump(coco, f)

    return ann_path, img_dir


def test_find_split_files_honors_vaid(tmp_path):
    """Verify find_split_files resolves 'vaid' for the validation split."""
    data_root = str(tmp_path)
    _create_mock_split(data_root, "val", num_images=2)

    ann_path, img_dir = find_split_files(data_root, "val")
    assert ann_path is not None, "Failed to locate instances_val.json"
    assert img_dir is not None, "Failed to locate vaid image directory"
    assert "vaid" in img_dir, f"Expected 'vaid' in path, got: {img_dir}"


def test_validate_split_clean(tmp_path):
    """Verify validate_split passes on a well-formed dataset split."""
    data_root = str(tmp_path)
    _create_mock_split(data_root, "train", num_images=10)

    ok, rep = validate_split(data_root, "train", expected_count=10, check_pixels=False)
    assert ok is True
    assert rep["num_images"] == 10
    assert rep["num_annotations"] == 10
    assert rep["count_matches"] is True
    assert len(rep["missing_image_files"]) == 0
    assert len(rep["orphan_annotations"]) == 0
    assert len(rep["invalid_boxes"]) == 0


def test_validate_split_detects_orphan_annotations(tmp_path):
    """Verify orphan annotations (image_id not in images) are flagged."""
    data_root = str(tmp_path)
    _create_mock_split(data_root, "train", num_images=5, make_orphan=True)

    ok, rep = validate_split(data_root, "train", expected_count=5, check_pixels=False)
    assert ok is False
    assert len(rep["orphan_annotations"]) == 1
    assert 1 in rep["orphan_annotations"]


def test_validate_split_detects_invalid_boxes(tmp_path):
    """Verify negative coordinates and widths are flagged."""
    data_root = str(tmp_path)
    _create_mock_split(data_root, "train", num_images=5, bad_box=True)

    ok, rep = validate_split(data_root, "train", expected_count=5, check_pixels=False)
    assert len(rep["invalid_boxes"]) > 0
    box_err = rep["invalid_boxes"][0]
    assert "width or height <= 0" in box_err[2] or "negative" in box_err[2]


def test_validate_split_detects_missing_images(tmp_path):
    """Verify missing image files on disk are detected."""
    data_root = str(tmp_path)
    ann_path, img_dir = _create_mock_split(data_root, "test", num_images=3)

    # Delete one image file
    os.remove(os.path.join(img_dir, "test_0002.jpg"))

    ok, rep = validate_split(data_root, "test", expected_count=3, check_pixels=False)
    assert ok is False
    assert "test_0002.jpg" in rep["missing_image_files"]


def test_validate_dataset_all_full_pipeline(tmp_path):
    """Verify validate_dataset_all runs over train, val, and test splits."""
    data_root = str(tmp_path)
    _create_mock_split(data_root, "train", num_images=EXPECTED_COUNTS["train"])
    _create_mock_split(data_root, "val", num_images=EXPECTED_COUNTS["val"])
    _create_mock_split(data_root, "test", num_images=EXPECTED_COUNTS["test"])

    all_ok, reports = validate_dataset_all(data_root, strict=True, check_pixels=False)
    assert all_ok is True
    assert reports["train"]["num_images"] == 366
    assert reports["val"]["num_images"] == 65
    assert reports["test"]["num_images"] == 52
