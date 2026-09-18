import os
import json
import pytest
from PIL import Image
from scripts.build_combined_train import (
    build_combined_train_dataset,
    verify_existing_combined_dataset,
    EXPECTED_CLASSES,
    ROBOFLOW_TO_COCO_MAP,
)


def test_build_combined_train_end_to_end(tmp_path):
    orig_root = tmp_path / "orig_data"
    rf_root = tmp_path / "rf_data"
    out_root = tmp_path / "combined_train"

    # 1. Setup mock original dataset
    orig_img_dir = orig_root / "train" / "images"
    os.makedirs(orig_img_dir, exist_ok=True)
    
    # Create 2 original images
    for i in range(2):
        im = Image.new("RGB", (640, 480), color=(100, 150, 200))
        im.save(orig_img_dir / f"orig_sample_{i}.jpg")

    orig_coco = {
        "images": [
            {"id": 10, "file_name": "orig_sample_0.jpg", "width": 640, "height": 480},
            {"id": 11, "file_name": "orig_sample_1.jpg", "width": 640, "height": 480},
        ],
        "annotations": [
            {"id": 100, "image_id": 10, "category_id": 0, "bbox": [50, 50, 100, 100], "area": 10000, "iscrowd": 0},
            {"id": 101, "image_id": 11, "category_id": 1, "bbox": [60, 60, 150, 200], "area": 30000, "iscrowd": 0},
        ],
        "categories": [{"id": i, "name": name} for i, name in enumerate(EXPECTED_CLASSES)],
    }
    with open(orig_root / "instances_train.json", "w") as f:
        json.dump(orig_coco, f)

    # 2. Setup mock Roboflow YOLO dataset
    rf_img_dir = rf_root / "images"
    rf_lbl_dir = rf_root / "labels"
    os.makedirs(rf_img_dir, exist_ok=True)
    os.makedirs(rf_lbl_dir, exist_ok=True)

    # Create 3 Roboflow images with labels
    # rf_0: class 0 (DHelmet -> 0 driver_with_helmet)
    # rf_1: class 1 (DNoHelmet -> 5 driver_without_helmet), class 5 (motorbike -> 1 bike)
    # rf_2: class 2 (P1Helmet -> 3 passenger_with_helmet), class 3 (P1NoHelmet -> 6 passenger_without_helmet), class 4 (P2NoHelmet -> 6 passenger_without_helmet)
    for i in range(3):
        im = Image.new("RGB", (800, 600), color=(50, 50, 50))
        im.save(rf_img_dir / f"rf_sample_{i}.jpg")

    with open(rf_lbl_dir / "rf_sample_0.txt", "w") as f:
        f.write("0 0.5 0.5 0.2 0.2\n")

    with open(rf_lbl_dir / "rf_sample_1.txt", "w") as f:
        f.write("1 0.3 0.4 0.1 0.2\n")
        f.write("5 0.7 0.8 0.4 0.3\n")

    with open(rf_lbl_dir / "rf_sample_2.txt", "w") as f:
        f.write("2 0.2 0.2 0.1 0.1\n")
        f.write("3 0.4 0.4 0.1 0.1\n")
        f.write("4 0.6 0.6 0.1 0.1\n")

    # 3. Execute builder
    success, report = build_combined_train_dataset(
        original_root=str(orig_root),
        roboflow_root=str(rf_root),
        output_root=str(out_root),
        copy_images=True,
        force_rebuild=False,
    )

    assert success is True
    assert report["num_images"] == 5 # 2 orig + 3 rf
    assert report["num_annotations"] == 8 # 2 orig + 6 rf
    assert report["original_images"] == 2
    assert report["roboflow_images"] == 3

    # 4. Check generated JSON
    ann_json = out_root / "annotations" / "instances_train.json"
    assert os.path.isfile(ann_json)
    with open(ann_json, "r") as f:
        combined_coco = json.load(f)

    assert len(combined_coco["images"]) == 5
    assert len(combined_coco["annotations"]) == 8
    assert len(combined_coco["categories"]) == 7

    # Check unique filenames
    fnames = [img["file_name"] for img in combined_coco["images"]]
    assert "orig_orig_sample_0.jpg" in fnames
    assert "orig_orig_sample_1.jpg" in fnames
    assert "rf_rf_sample_0.jpg" in fnames
    assert "rf_rf_sample_1.jpg" in fnames
    assert "rf_rf_sample_2.jpg" in fnames

    # Verify all files copied to images/
    for fn in fnames:
        assert os.path.isfile(out_root / "images" / fn)

    # Verify class mappings
    rf_annotations = [a for a in combined_coco["annotations"] if a["id"] > 2]
    categories_present = set(a["category_id"] for a in rf_annotations)
    # Roboflow classes mapped:
    # 0 -> 0 (driver_with_helmet)
    # 1 -> 5 (driver_without_helmet)
    # 5 -> 1 (bike)
    # 2 -> 3 (passenger_with_helmet)
    # 3, 4 -> 6 (passenger_without_helmet)
    assert categories_present == {0, 1, 3, 5, 6}

    # 5. Check idempotency: Re-run with existing valid dataset
    success_reuse, report_reuse = build_combined_train_dataset(
        original_root=str(orig_root),
        roboflow_root=str(rf_root),
        output_root=str(out_root),
        copy_images=True,
        force_rebuild=False,
    )
    assert success_reuse is True
    assert report_reuse.get("reused") is True


def test_build_combined_train_1_based_categories(tmp_path):
    orig_root = tmp_path / "orig_1_based"
    rf_root = tmp_path / "rf_empty"
    out_root = tmp_path / "combined_1_based"

    # Setup 1-based original COCO dataset (category IDs 1 to 7)
    orig_img_dir = orig_root / "train" / "images"
    os.makedirs(orig_img_dir, exist_ok=True)
    im = Image.new("RGB", (640, 480), color=(100, 150, 200))
    im.save(orig_img_dir / "sample_0.jpg")

    # Categories 1 to 7
    orig_categories = [{"id": i + 1, "name": name} for i, name in enumerate(EXPECTED_CLASSES)]
    # Annotations for each of the 7 classes (category IDs 1 to 7)
    orig_annotations = [
        {"id": 100 + i, "image_id": 1, "category_id": i + 1, "bbox": [10 + i * 10, 10, 50, 50], "area": 2500, "iscrowd": 0}
        for i in range(7)
    ]
    orig_coco = {
        "images": [{"id": 1, "file_name": "sample_0.jpg", "width": 640, "height": 480}],
        "annotations": orig_annotations,
        "categories": orig_categories,
    }
    with open(orig_root / "instances_train.json", "w") as f:
        json.dump(orig_coco, f)

    # Empty Roboflow dir
    os.makedirs(rf_root / "images", exist_ok=True)
    os.makedirs(rf_root / "labels", exist_ok=True)

    success, report = build_combined_train_dataset(
        original_root=str(orig_root),
        roboflow_root=str(rf_root),
        output_root=str(out_root),
        copy_images=True,
        force_rebuild=True,
    )

    assert success is True
    assert report["original_annotations_converted"] == 7
    assert report["original_annotations_skipped"] == 0

    # Load output JSON and verify exact category mapping:
    with open(out_root / "annotations" / "instances_train.json", "r") as f:
        result_coco = json.load(f)

    # Target category IDs must be exactly 0 to 6
    result_cat_ids = sorted([a["category_id"] for a in result_coco["annotations"]])
    assert result_cat_ids == [0, 1, 2, 3, 4, 5, 6]

    # Target category 6 corresponds to original category 7 (passenger_without_helmet)
    ann_7 = next(a for a in result_coco["annotations"] if a["category_id"] == 6)
    assert ann_7["category_id"] == 6

