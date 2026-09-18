import os
import json
import runpy
from types import SimpleNamespace
import pytest

from evaluation.codetr.evaluate import EXPECTED_CLASSES

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TRAIN_PY_PATH = os.path.join(REPO_ROOT, "training", "codetr", "train.py")


def test_validate_and_patch_combined_train_with_separate_val(tmp_path):
    module = runpy.run_path(TRAIN_PY_PATH)
    patch_func = module["_validate_and_patch_data_root"]

    # 1. Setup mock combined_train (training-only: images/ and annotations/instances_train.json)
    combined_root = tmp_path / "combined_train"
    os.makedirs(combined_root / "images", exist_ok=True)
    os.makedirs(combined_root / "annotations", exist_ok=True)

    dummy_train = {
        "images": [{"id": i, "file_name": f"img_{i}.jpg"} for i in range(3780)],
        "annotations": [{"id": i, "category_id": i % 7, "bbox": [10, 10, 50, 50]} for i in range(16396)],
        "categories": [{"id": i, "name": name} for i, name in enumerate(EXPECTED_CLASSES)]
    }
    with open(combined_root / "annotations" / "instances_train.json", "w") as f:
        json.dump(dummy_train, f)

    # 2. Setup mock original dataset (val and test with vaid/images and test/images)
    orig_root = tmp_path / "orig_dataset"
    os.makedirs(orig_root / "vaid" / "images", exist_ok=True)
    os.makedirs(orig_root / "test" / "images", exist_ok=True)

    dummy_val = {
        "images": [{"id": i, "file_name": f"val_{i}.jpg"} for i in range(65)],
        "annotations": [{"id": i, "category_id": i % 7} for i in range(100)],
        "categories": [{"id": i, "name": name} for i, name in enumerate(EXPECTED_CLASSES)]
    }
    with open(orig_root / "instances_val.json", "w") as f:
        json.dump(dummy_val, f)

    dummy_test = {
        "images": [{"id": i, "file_name": f"test_{i}.jpg"} for i in range(52)],
        "annotations": [{"id": i, "category_id": i % 7} for i in range(80)],
        "categories": [{"id": i, "name": name} for i, name in enumerate(EXPECTED_CLASSES)]
    }
    with open(orig_root / "instances_test.json", "w") as f:
        json.dump(dummy_test, f)

    # 3. Create mock config mimicking K5
    cfg = SimpleNamespace(
        CLASSES=EXPECTED_CLASSES,
        data=SimpleNamespace(
            train=SimpleNamespace(ann_file="data/coco/instances_train.json", img_prefix="data/coco/train/images/"),
            val=SimpleNamespace(ann_file="data/coco/instances_val.json", img_prefix="data/coco/vaid/images/"),
            test=SimpleNamespace(ann_file="data/coco/instances_test.json", img_prefix="data/coco/test/images/"),
        )
    )

    # 4. Patch with combined_train as data_root and orig_root as val_data_root
    patch_func(
        cfg,
        data_root=str(combined_root),
        val_data_root=str(orig_root),
        no_validate=False
    )

    # 5. Assertions
    # Train correctly patched to combined_train
    assert cfg.data.train.ann_file == str(combined_root / "annotations" / "instances_train.json")
    assert cfg.data.train.img_prefix == str(combined_root / "images") + "/"

    # Validation correctly points to original validation set
    assert cfg.data.val.ann_file == str(orig_root / "instances_val.json")
    assert cfg.data.val.img_prefix == str(orig_root / "vaid" / "images") + "/"

    # Test split untouched by combined_train
    assert "combined_train" not in str(cfg.data.test.ann_file)
    assert "combined_train" not in str(cfg.data.test.img_prefix)


def test_validate_and_patch_auto_discover_val(tmp_path):
    module = runpy.run_path(TRAIN_PY_PATH)
    patch_func = module["_validate_and_patch_data_root"]

    combined_root = tmp_path / "combined_train"
    os.makedirs(combined_root / "images", exist_ok=True)
    os.makedirs(combined_root / "annotations", exist_ok=True)

    with open(combined_root / "annotations" / "instances_train.json", "w") as f:
        json.dump({"images": [{"id": 1}], "annotations": []}, f)

    # Create original dataset in candidate location
    cand_root = tmp_path / "dataset_local"
    os.makedirs(cand_root / "vaid" / "images", exist_ok=True)
    with open(cand_root / "instances_val.json", "w") as f:
        json.dump({"images": [{"id": 1}], "annotations": []}, f)

    cfg = SimpleNamespace(
        CLASSES=EXPECTED_CLASSES,
        data=SimpleNamespace(
            train=SimpleNamespace(ann_file="", img_prefix=""),
            val=SimpleNamespace(ann_file="", img_prefix=""),
            test=SimpleNamespace(ann_file="", img_prefix=""),
        )
    )

    # Run with val_data_root=str(cand_root)
    patch_func(
        cfg,
        data_root=str(combined_root),
        val_data_root=str(cand_root),
        no_validate=False
    )

    assert cfg.data.train.ann_file == str(combined_root / "annotations" / "instances_train.json")
    assert cfg.data.val.ann_file == str(cand_root / "instances_val.json")


def test_discover_split_paths_all_layouts(tmp_path):
    module = runpy.run_path(TRAIN_PY_PATH)
    discover_func = module["_discover_split_paths"]

    # Layout 1: COCO layout (annotations/instances_train.json + images/)
    coco_root = tmp_path / "coco_layout"
    os.makedirs(coco_root / "annotations", exist_ok=True)
    os.makedirs(coco_root / "images", exist_ok=True)
    with open(coco_root / "annotations" / "instances_train.json", "w") as f:
        json.dump({"images": [{"id": 1}], "annotations": [{"id": 1}]}, f)

    res1 = discover_func(str(coco_root), "train")
    assert res1["valid"] is True
    assert res1["ann_path"] == str(coco_root / "annotations" / "instances_train.json")
    assert res1["img_path"] == str(coco_root / "images")

    # Layout 2: Flat layout (instances_train.json + images/)
    flat_root = tmp_path / "flat_layout"
    os.makedirs(flat_root / "images", exist_ok=True)
    with open(flat_root / "instances_train.json", "w") as f:
        json.dump({"images": [{"id": 1}], "annotations": [{"id": 1}]}, f)

    res2 = discover_func(str(flat_root), "train")
    assert res2["valid"] is True
    assert res2["ann_path"] == str(flat_root / "instances_train.json")
    assert res2["img_path"] == str(flat_root / "images")

    # Layout 3: Nested layout (train/instances_train.json + train/images/)
    nested_root = tmp_path / "nested_layout"
    os.makedirs(nested_root / "train" / "images", exist_ok=True)
    with open(nested_root / "train" / "instances_train.json", "w") as f:
        json.dump({"images": [{"id": 1}], "annotations": [{"id": 1}]}, f)

    res3 = discover_func(str(nested_root), "train")
    assert res3["valid"] is True
    assert res3["ann_path"] == str(nested_root / "train" / "instances_train.json")
    assert res3["img_path"] == str(nested_root / "train" / "images")


def test_discover_split_paths_val_vaid_images(tmp_path):
    module = runpy.run_path(TRAIN_PY_PATH)
    discover_func = module["_discover_split_paths"]

    # Original val format: instances_val.json + vaid/images/
    val_root = tmp_path / "val_orig"
    os.makedirs(val_root / "vaid" / "images", exist_ok=True)
    with open(val_root / "instances_val.json", "w") as f:
        json.dump({"images": [{"id": 1}], "annotations": [{"id": 1}]}, f)

    res = discover_func(str(val_root), "val")
    assert res["valid"] is True
    assert res["ann_path"] == str(val_root / "instances_val.json")
    assert res["img_path"] == str(val_root / "vaid" / "images")
