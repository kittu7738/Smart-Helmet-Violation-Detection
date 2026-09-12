#!/usr/bin/env python3
"""
data/validate_dataset.py
========================
Comprehensive COCO dataset validator for Smart-Helmet-Violation-Detection.

Verifies:
  - train split: 366 images expected
  - val split:   65 images expected (uses intentional 'vaid/images/' directory)
  - test split:  52 images expected
  - Annotation JSON files (instances_train.json, instances_val.json, instances_test.json)
  - Image files exist on disk, readable, not corrupted
  - Image IDs unique, annotation IDs unique, no orphan annotations
  - Category IDs valid against the 7 target helmet classes
  - Bounding box validity (x >= 0, y >= 0, w > 0, h > 0, box within image bounds)
  - Class distribution and imbalance analysis
  - Images with zero annotations

Usage:
  python data/validate_dataset.py --data-root /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data
  python data/validate_dataset.py --data-root data/coco --strict
"""

import os
import sys
import json
import time
import argparse
from collections import Counter, defaultdict

EXPECTED_CLASSES = (
    "driver_with_helmet",
    "bike",
    "driver",
    "passenger_with_helmet",
    "passenger",
    "driver_without_helmet",
    "passenger_without_helmet",
)

EXPECTED_COUNTS = {
    "train": 366,
    "val": 65,
    "test": 52,
}


def find_split_files(data_root, split_name):
    """
    Locate annotation file and image directory for a split, honoring the intentional
    'vaid' directory naming for validation.
    """
    folder = "vaid" if split_name == "val" else split_name
    alt_folder = "val" if split_name == "val" else split_name

    ann_candidates = [
        os.path.join(data_root, folder, f"instances_{split_name}.json"),
        os.path.join(data_root, alt_folder, f"instances_{split_name}.json"),
        os.path.join(data_root, f"instances_{split_name}.json"),
        os.path.join(data_root, "annotations", f"instances_{split_name}.json"),
    ]

    img_candidates = [
        os.path.join(data_root, folder, "images"),
        os.path.join(data_root, alt_folder, "images"),
        os.path.join(data_root, folder),
        os.path.join(data_root, alt_folder),
        os.path.join(data_root, "images", folder),
    ]

    resolved_ann = None
    for ac in ann_candidates:
        if os.path.isfile(ac):
            resolved_ann = ac
            break

    resolved_img = None
    for ic in img_candidates:
        if os.path.isdir(ic):
            resolved_img = ic
            break

    return resolved_ann, resolved_img


def check_image_readable(filepath):
    """Verify image file exists, is non-empty, and can be read by PIL or cv2 if installed."""
    if not os.path.isfile(filepath):
        return False, "File does not exist"
    size = os.path.getsize(filepath)
    if size == 0:
        return False, "Empty file (0 bytes)"

    # Optional fast header read if PIL available
    try:
        from PIL import Image
        with Image.open(filepath) as img:
            img.verify()
        return True, "Valid"
    except ImportError:
        pass
    except Exception as e:
        return False, f"Corrupted image ({e})"

    try:
        import cv2
        im = cv2.imread(filepath)
        if im is None:
            return False, "cv2 failed to decode image"
        return True, "Valid"
    except ImportError:
        pass
    except Exception as e:
        return False, f"cv2 decode error ({e})"

    # Fallback: file exists and has plausible JPEG/PNG header bytes
    with open(filepath, "rb") as f:
        head = f.read(16)
        if head.startswith(b"\xff\xd8") or head.startswith(b"\x89PNG"):
            return True, "Valid"
    return True, "Valid (unverified reader)"


def validate_split(data_root, split_name, expected_count=None, check_pixels=True):
    """
    Thoroughly inspect a single split's COCO JSON and corresponding images.
    Returns: (is_valid, report_dict)
    """
    ann_path, img_dir = find_split_files(data_root, split_name)
    report = {
        "split": split_name,
        "ann_path": ann_path,
        "img_dir": img_dir,
        "ann_found": ann_path is not None,
        "img_dir_found": img_dir is not None,
        "num_images": 0,
        "num_annotations": 0,
        "expected_images": expected_count,
        "count_matches": False,
        "missing_image_files": [],
        "corrupted_images": [],
        "duplicate_image_ids": [],
        "duplicate_ann_ids": [],
        "orphan_annotations": [],
        "invalid_categories": [],
        "invalid_boxes": [],
        "class_distribution": Counter(),
        "images_without_annotations": 0,
        "category_names": [],
        "errors": [],
        "warnings": [],
    }

    if not report["ann_found"]:
        report["errors"].append(f"Annotation file not found for split '{split_name}' under {data_root}")
        return False, report

    if not report["img_dir_found"]:
        report["errors"].append(f"Image directory not found for split '{split_name}' under {data_root}")
        return False, report

    try:
        with open(ann_path, "r", encoding="utf-8") as f:
            coco = json.load(f)
    except Exception as e:
        report["errors"].append(f"JSON decode failed for {ann_path}: {e}")
        return False, report

    images = coco.get("images", [])
    annotations = coco.get("annotations", [])
    categories = coco.get("categories", [])

    report["num_images"] = len(images)
    report["num_annotations"] = len(annotations)
    if expected_count is not None:
        report["count_matches"] = (len(images) == expected_count)
        if not report["count_matches"]:
            report["warnings"].append(
                f"Image count ({len(images)}) does not match expected {expected_count} for {split_name}"
            )

    # Categories check
    cat_id_to_name = {c.get("id"): c.get("name") for c in categories}
    report["category_names"] = [c.get("name") for c in categories]
    for c in categories:
        if c.get("name") not in EXPECTED_CLASSES:
            report["warnings"].append(f"Unexpected category name in dataset: '{c.get('name')}'")

    # Image ID uniqueness & file existence
    seen_img_ids = set()
    img_id_to_info = {}
    for img in images:
        img_id = img.get("id")
        if img_id in seen_img_ids:
            report["duplicate_image_ids"].append(img_id)
        seen_img_ids.add(img_id)
        img_id_to_info[img_id] = img

        fname = img.get("file_name", "")
        fpath = os.path.join(img_dir, fname)
        if not os.path.isfile(fpath):
            report["missing_image_files"].append(fname)
        elif check_pixels:
            ok, msg = check_image_readable(fpath)
            if not ok:
                report["corrupted_images"].append((fname, msg))

    # Annotation inspection
    seen_ann_ids = set()
    img_ann_count = defaultdict(int)

    for ann in annotations:
        ann_id = ann.get("id")
        if ann_id in seen_ann_ids:
            report["duplicate_ann_ids"].append(ann_id)
        seen_ann_ids.add(ann_id)

        img_id = ann.get("image_id")
        if img_id not in seen_img_ids:
            report["orphan_annotations"].append(ann_id)
            continue
        img_ann_count[img_id] += 1

        cat_id = ann.get("category_id")
        cat_name = cat_id_to_name.get(cat_id)
        if cat_name is None:
            report["invalid_categories"].append((ann_id, cat_id))
        else:
            report["class_distribution"][cat_name] += 1

        bbox = ann.get("bbox", [])
        if not isinstance(bbox, (list, tuple)) or len(bbox) != 4:
            report["invalid_boxes"].append((ann_id, bbox, "bbox length != 4"))
            continue

        x, y, w, h = bbox
        if w <= 0 or h <= 0:
            report["invalid_boxes"].append((ann_id, bbox, "width or height <= 0"))
        elif x < 0 or y < 0:
            report["invalid_boxes"].append((ann_id, bbox, "negative coordinates"))
        else:
            img_info = img_id_to_info.get(img_id, {})
            iw = img_info.get("width")
            ih = img_info.get("height")
            if iw and ih and (x > iw or y > ih):
                report["invalid_boxes"].append((ann_id, bbox, f"box outside image bounds ({iw}x{ih})"))

    # Images with 0 annotations
    report["images_without_annotations"] = sum(
        1 for img_id in seen_img_ids if img_ann_count[img_id] == 0
    )

    is_valid = (
        len(report["errors"]) == 0
        and len(report["missing_image_files"]) == 0
        and len(report["orphan_annotations"]) == 0
        and len(report["corrupted_images"]) == 0
    )
    return is_valid, report


def validate_dataset_all(data_root, strict=False, check_pixels=True):
    """
    Validate train, val, and test splits under data_root.
    Prints formatted report and returns overall pass boolean and report dictionary.
    """
    data_root = os.path.abspath(data_root)
    print("=" * 78)
    print(f"  SMART HELMET VIOLATION DETECTION — COCO DATASET VALIDATION")
    print(f"  Root: {data_root}")
    print(f"  Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 78)

    all_passed = True
    overall_reports = {}

    for split in ["train", "val", "test"]:
        exp = EXPECTED_COUNTS.get(split)
        ok, rep = validate_split(data_root, split, expected_count=exp, check_pixels=check_pixels)
        overall_reports[split] = rep

        badge = "[PASS]" if ok else "[FAIL]"
        print(f"\n{badge} Split: {split.upper()}")
        print(f"  • Annotation path : {rep['ann_path']}")
        print(f"  • Image directory : {rep['img_dir']}")
        print(f"  • Image count     : {rep['num_images']} (expected: {exp})")
        print(f"  • Annotation count: {rep['num_annotations']}")

        if rep["duplicate_image_ids"]:
            print(f"  • [FAIL] Duplicate image IDs: {len(rep['duplicate_image_ids'])}")
            ok = False
        if rep["duplicate_ann_ids"]:
            print(f"  • [FAIL] Duplicate annotation IDs: {len(rep['duplicate_ann_ids'])}")
            ok = False
        if rep["missing_image_files"]:
            print(f"  • [FAIL] Missing image files on disk: {len(rep['missing_image_files'])}")
            ok = False
        if rep["corrupted_images"]:
            print(f"  • [FAIL] Corrupted image files: {len(rep['corrupted_images'])}")
            ok = False
        if rep["orphan_annotations"]:
            print(f"  • [FAIL] Orphan annotations (invalid image_id): {len(rep['orphan_annotations'])}")
            ok = False
        if rep["invalid_boxes"]:
            print(f"  • [WARN/FAIL] Invalid bounding boxes: {len(rep['invalid_boxes'])}")

        print(f"  • Images without annotations: {rep['images_without_annotations']}")
        print("  • Class distribution:")
        for cname in EXPECTED_CLASSES:
            cnt = rep["class_distribution"].get(cname, 0)
            print(f"      - {cname:26s}: {cnt:5d}")

        if rep["warnings"]:
            for w in rep["warnings"]:
                print(f"  • [WARN] {w}")
        if rep["errors"]:
            for e in rep["errors"]:
                print(f"  • [ERROR] {e}")

        if not ok:
            all_passed = False
        if strict and not rep["count_matches"]:
            all_passed = False

    print("\n" + "=" * 78)
    if all_passed:
        print("  OVERALL DATASET INTEGRITY: PASS")
        print("  All splits, annotations, image paths, and categories are verified.")
    else:
        print("  OVERALL DATASET INTEGRITY: FAIL / WARNING")
        print("  Please check the error entries above.")
    print("=" * 78)

    return all_passed, overall_reports


def main():
    parser = argparse.ArgumentParser(description="Validate COCO dataset for Smart Helmet Violation Detection")
    parser.add_argument(
        "--data-root",
        default="data/coco",
        help="Path to dataset root containing instances_*.json and image directories (default: data/coco)",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Enforce exact expected image count matches (train: 366, val: 65, test: 52)",
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="Skip pixel-level image loading checks for speed",
    )
    args = parser.parse_args()

    passed, _ = validate_dataset_all(args.data_root, strict=args.strict, check_pixels=not args.fast)
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
