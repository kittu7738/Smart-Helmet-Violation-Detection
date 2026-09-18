#!/usr/bin/env python3
"""
scripts/build_combined_train.py
================================
Build a persistent, verified combined training dataset directly on Google Drive (or local storage).

Merges:
  1. Original train split (366 images, 1671 annotations) from COCO instances_train.json
  2. Roboflow converted train split (~3414 images, ~14725 annotations) from YOLO images/ and labels/

Applies the exact semantic mapping for Roboflow classes:
  0 DHelmet    -> 0 driver_with_helmet
  1 DNoHelmet  -> 5 driver_without_helmet
  2 P1Helmet   -> 3 passenger_with_helmet
  3 P1NoHelmet -> 6 passenger_without_helmet
  4 P2NoHelmet -> 6 passenger_without_helmet
  5 motorbike  -> 1 bike

Target structure:
  <output_root>/
  ├── images/
  └── annotations/
      └── instances_train.json

Safety & Integrity:
  - Original validation and test sets are STRICTLY ignored and preserved.
  - Generates unique filenames (orig_<filename>, rf_<filename>) to prevent collisions.
  - Validates bounding boxes, clamps to image bounds, and ensures strict COCO compliance.
  - Idempotent: Can safely be re-run; skips copying if target files already exist and match size.
"""

import os
import sys
import json
import shutil
import argparse
import time
from typing import Dict, List, Tuple, Optional
from PIL import Image

EXPECTED_CLASSES = [
    "driver_with_helmet",        # 0
    "bike",                      # 1
    "driver",                    # 2
    "passenger_with_helmet",     # 3
    "passenger",                 # 4
    "driver_without_helmet",     # 5
    "passenger_without_helmet",  # 6
]

ROBOFLOW_TO_COCO_MAP = {
    0: 0,  # DHelmet -> driver_with_helmet
    1: 5,  # DNoHelmet -> driver_without_helmet
    2: 3,  # P1Helmet -> passenger_with_helmet
    3: 6,  # P1NoHelmet -> passenger_without_helmet
    4: 6,  # P2NoHelmet -> passenger_without_helmet
    5: 1,  # motorbike -> bike
}


def _find_file(candidates: List[str]) -> Optional[str]:
    for c in candidates:
        if c and os.path.isfile(c):
            return os.path.abspath(c)
    return None


def _find_dir(candidates: List[str]) -> Optional[str]:
    for c in candidates:
        if c and os.path.isdir(c):
            return os.path.abspath(c)
    return None


def verify_existing_combined_dataset(output_root: str, min_images: int = 3700, min_annotations: int = 16000) -> bool:
    """Check if output_root already contains a valid, fully built combined dataset."""
    ann_path = os.path.join(output_root, "annotations", "instances_train.json")
    img_dir = os.path.join(output_root, "images")
    if not (os.path.isfile(ann_path) and os.path.isdir(img_dir)):
        return False

    try:
        with open(ann_path, "r") as f:
            data = json.load(f)
        imgs = data.get("images", [])
        anns = data.get("annotations", [])
        cats = data.get("categories", [])

        if len(imgs) < min_images or len(anns) < min_annotations:
            return False
        if len(cats) != 7:
            return False

        # Quick check: sample 10 images exist on disk
        for img_info in imgs[:10]:
            p = os.path.join(img_dir, img_info["file_name"])
            if not os.path.isfile(p):
                return False

        print(f"[INFO] Existing combined dataset at {output_root} is valid "
              f"({len(imgs)} images, {len(anns)} annotations, {len(cats)} categories).", flush=True)
        return True
    except Exception as exc:
        print(f"[DEBUG] Verification failed with exception: {exc}", flush=True)
        return False


def build_combined_train_dataset(
    original_root: str,
    roboflow_root: str,
    output_root: str,
    copy_images: bool = True,
    force_rebuild: bool = False,
    min_images: int = 1,
    min_annotations: int = 1,
) -> Tuple[bool, Dict]:
    """
    Build the persistent combined training dataset.
    Returns (success: bool, report: dict).
    """
    t_start = time.time()
    print("=" * 70, flush=True)
    print("  BUILDING PERSISTENT COMBINED TRAINING DATASET", flush=True)
    print("=" * 70, flush=True)
    print(f"Original root : {original_root}")
    print(f"Roboflow root : {roboflow_root}")
    print(f"Output root   : {output_root}")
    print(f"Copy images   : {copy_images}")
    print(f"Force rebuild : {force_rebuild}", flush=True)

    if not force_rebuild and verify_existing_combined_dataset(output_root, min_images=min_images, min_annotations=min_annotations):
        print("\n[SUCCESS] Valid combined dataset already exists. Reusing without re-copying.")
        ann_path = os.path.join(output_root, "annotations", "instances_train.json")
        with open(ann_path, "r") as f:
            data = json.load(f)
        return True, {
            "num_images": len(data.get("images", [])),
            "num_annotations": len(data.get("annotations", [])),
            "num_categories": len(data.get("categories", [])),
            "reused": True,
        }

    # 1. Locate original training data
    orig_ann_file = _find_file([
        os.path.join(original_root, "instances_train.json"),
        os.path.join(original_root, "train", "instances_train.json"),
        os.path.join(original_root, "annotations", "instances_train.json"),
    ])
    if not orig_ann_file:
        raise FileNotFoundError(
            f"Original training annotation file not found under {original_root}."
        )

    orig_img_dir = _find_dir([
        os.path.join(original_root, "train", "images"),
        os.path.join(original_root, "train"),
        os.path.join(original_root, "images"),
    ])
    if not orig_img_dir:
        raise FileNotFoundError(
            f"Original training images directory not found under {original_root}."
        )

    print(f"\n[1/4] Found original training data:")
    print(f"  Annotation: {orig_ann_file}")
    print(f"  Images dir: {orig_img_dir}", flush=True)

    # 2. Locate Roboflow converted training data
    rf_img_dir = _find_dir([
        os.path.join(roboflow_root, "images"),
        roboflow_root,
    ])
    rf_lbl_dir = _find_dir([
        os.path.join(roboflow_root, "labels"),
        os.path.join(os.path.dirname(rf_img_dir or ""), "labels"),
    ])
    if not (rf_img_dir and rf_lbl_dir):
        raise FileNotFoundError(
            f"Roboflow training images or labels directory not found under {roboflow_root}.\n"
            f"rf_img_dir={rf_img_dir}, rf_lbl_dir={rf_lbl_dir}"
        )

    print(f"\n[2/4] Found Roboflow training data:")
    print(f"  Images dir: {rf_img_dir}")
    print(f"  Labels dir: {rf_lbl_dir}", flush=True)

    # 3. Setup output directories
    out_img_dir = os.path.join(output_root, "images")
    out_ann_dir = os.path.join(output_root, "annotations")
    os.makedirs(out_img_dir, exist_ok=True)
    os.makedirs(out_ann_dir, exist_ok=True)

    # Define standard categories
    categories = [
        {"id": i, "name": name, "supercategory": "vehicle" if name == "bike" else "person"}
        for i, name in enumerate(EXPECTED_CLASSES)
    ]

    combined_images: List[Dict] = []
    combined_annotations: List[Dict] = []
    next_image_id = 1
    next_ann_id = 1

    # ── Process Original Train ───────────────────────────────────────────────
    print(f"\n[3/4] Processing original training set...", flush=True)
    with open(orig_ann_file, "r") as f:
        orig_coco = json.load(f)

    orig_imgs = orig_coco.get("images", [])
    orig_anns = orig_coco.get("annotations", [])
    print(f"  Original entries: {len(orig_imgs)} images, {len(orig_anns)} annotations")

    # Map old image_id -> new image_id
    orig_id_remap: Dict[int, int] = {}
    copied_orig_imgs = 0

    for item in orig_imgs:
        old_id = item["id"]
        old_fname = os.path.basename(item["file_name"])
        src_path = os.path.join(orig_img_dir, old_fname)
        
        # Verify original image exists on disk
        if not os.path.isfile(src_path):
            alt_path = os.path.join(orig_img_dir, item["file_name"])
            if os.path.isfile(alt_path):
                src_path = alt_path
            else:
                print(f"  [WARNING] Original image missing: {src_path}, skipping.")
                continue

        new_fname = f"orig_{old_fname}"
        dst_path = os.path.join(out_img_dir, new_fname)

        if copy_images:
            if not os.path.exists(dst_path) or os.path.getsize(dst_path) != os.path.getsize(src_path):
                shutil.copy2(src_path, dst_path)
            copied_orig_imgs += 1

        new_img_id = next_image_id
        next_image_id += 1
        orig_id_remap[old_id] = new_img_id

        combined_images.append({
            "id": new_img_id,
            "file_name": new_fname,
            "width": item.get("width", 0),
            "height": item.get("height", 0),
        })

    # ── Normalize Original Category IDs into Project 0-6 Taxonomy ───────────
    orig_categories = orig_coco.get("categories", [])
    print(f"  Original categories defined in JSON: {orig_categories}")

    NAME_TO_TARGET_ID = {name: i for i, name in enumerate(EXPECTED_CLASSES)}
    NORM_NAME_TO_TARGET_ID = {
        name.lower().replace(" ", "_").replace("-", "_"): i
        for i, name in enumerate(EXPECTED_CLASSES)
    }

    orig_cid_to_target_cid: Dict[int, int] = {}

    for c in orig_categories:
        c_id = c.get("id")
        c_name = str(c.get("name", "")).strip()
        norm_name = c_name.lower().replace(" ", "_").replace("-", "_")

        if c_name in NAME_TO_TARGET_ID:
            orig_cid_to_target_cid[c_id] = NAME_TO_TARGET_ID[c_name]
        elif norm_name in NORM_NAME_TO_TARGET_ID:
            orig_cid_to_target_cid[c_id] = NORM_NAME_TO_TARGET_ID[norm_name]
        else:
            print(f"  [WARNING] Category '{c_name}' (ID {c_id}) did not match expected class name.")

    # Fallbacks for standard 1-7 or 0-6 category IDs if categories list is missing or incomplete
    for cid in range(1, 8):
        if cid not in orig_cid_to_target_cid:
            orig_cid_to_target_cid[cid] = cid - 1
    for cid in range(0, 7):
        if cid not in orig_cid_to_target_cid:
            orig_cid_to_target_cid[cid] = cid

    print("  Resolved category ID mapping (original -> 0-6 target):")
    for src_id, dst_id in sorted(orig_cid_to_target_cid.items()):
        print(f"    Original ID {src_id} -> Target ID {dst_id} ({EXPECTED_CLASSES[dst_id]})")

    orig_ann_count = 0
    orig_skipped_count = 0
    for ann in orig_anns:
        old_img_id = ann.get("image_id")
        if old_img_id not in orig_id_remap:
            orig_skipped_count += 1
            continue

        raw_cat_id = ann.get("category_id")
        if raw_cat_id not in orig_cid_to_target_cid:
            print(f"  [WARNING] Category ID {raw_cat_id} has no mapping, skipping.")
            orig_skipped_count += 1
            continue

        target_cat_id = orig_cid_to_target_cid[raw_cat_id]

        bbox = ann.get("bbox", [0, 0, 0, 0])
        x, y, w, h = bbox
        if w <= 0 or h <= 0:
            orig_skipped_count += 1
            continue

        new_ann = {
            "id": next_ann_id,
            "image_id": orig_id_remap[old_img_id],
            "category_id": int(target_cat_id),
            "bbox": [float(round(x, 2)), float(round(y, 2)), float(round(w, 2)), float(round(h, 2))],
            "area": float(round(w * h, 2)),
            "iscrowd": ann.get("iscrowd", 0),
            "segmentation": ann.get("segmentation", []),
        }
        next_ann_id += 1
        combined_annotations.append(new_ann)
        orig_ann_count += 1

    print(f"  -> Converted {orig_ann_count}/{len(orig_anns)} original annotations ({orig_skipped_count} skipped)", flush=True)

    # ── Process Roboflow YOLO Train ──────────────────────────────────────────
    print(f"\n[4/4] Converting and adding Roboflow training set...", flush=True)
    rf_img_files = sorted([
        f for f in os.listdir(rf_img_dir)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".webp"))
    ])
    print(f"  Found {len(rf_img_files)} Roboflow images in {rf_img_dir}")

    rf_img_count = 0
    rf_ann_count = 0
    malformed_ann_count = 0
    copied_rf_imgs = 0

    for idx, fname in enumerate(rf_img_files):
        src_path = os.path.join(rf_img_dir, fname)
        base_stem, _ = os.path.splitext(fname)
        lbl_path = os.path.join(rf_lbl_dir, f"{base_stem}.txt")

        # Read image dimensions
        try:
            with Image.open(src_path) as im:
                img_w, img_h = im.size
        except Exception as e:
            print(f"  [WARNING] Unable to read image {src_path}: {e}, skipping.")
            continue

        new_fname = f"rf_{fname}"
        dst_path = os.path.join(out_img_dir, new_fname)

        if copy_images:
            if not os.path.exists(dst_path) or os.path.getsize(dst_path) != os.path.getsize(src_path):
                shutil.copy2(src_path, dst_path)
            copied_rf_imgs += 1

        new_img_id = next_image_id
        next_image_id += 1
        rf_img_count += 1

        combined_images.append({
            "id": new_img_id,
            "file_name": new_fname,
            "width": int(img_w),
            "height": int(img_h),
        })

        if not os.path.isfile(lbl_path):
            continue

        with open(lbl_path, "r") as lf:
            lines = lf.readlines()

        for line in lines:
            parts = line.strip().split()
            if len(parts) < 5:
                continue

            try:
                rf_cls = int(float(parts[0]))
                xc = float(parts[1])
                yc = float(parts[2])
                nw = float(parts[3])
                nh = float(parts[4])
            except ValueError:
                malformed_ann_count += 1
                continue

            if rf_cls not in ROBOFLOW_TO_COCO_MAP:
                malformed_ann_count += 1
                continue

            coco_cls = ROBOFLOW_TO_COCO_MAP[rf_cls]

            # Convert YOLO center to COCO top-left
            xc_px = xc * img_w
            yc_px = yc * img_h
            w_px = nw * img_w
            h_px = nh * img_h

            x_min = max(0.0, min(float(img_w), xc_px - (w_px / 2.0)))
            y_min = max(0.0, min(float(img_h), yc_px - (h_px / 2.0)))
            x_max = max(0.0, min(float(img_w), xc_px + (w_px / 2.0)))
            y_max = max(0.0, min(float(img_h), yc_px + (h_px / 2.0)))

            final_w = x_max - x_min
            final_h = y_max - y_min

            if final_w <= 0.5 or final_h <= 0.5:
                malformed_ann_count += 1
                continue

            combined_annotations.append({
                "id": next_ann_id,
                "image_id": new_img_id,
                "category_id": coco_cls,
                "bbox": [float(round(x_min, 2)), float(round(y_min, 2)), float(round(final_w, 2)), float(round(final_h, 2))],
                "area": float(round(final_w * final_h, 2)),
                "iscrowd": 0,
                "segmentation": [],
            })
            next_ann_id += 1
            rf_ann_count += 1

        if (idx + 1) % 1000 == 0 or (idx + 1) == len(rf_img_files):
            print(f"  Processed {idx + 1}/{len(rf_img_files)} Roboflow images...", flush=True)

    print(f"  -> Added {rf_img_count} Roboflow images, {rf_ann_count} annotations", flush=True)
    if malformed_ann_count > 0:
        print(f"  [NOTE] Skipped {malformed_ann_count} invalid/empty annotations.")

    # ── Write Final JSON ─────────────────────────────────────────────────────
    final_coco = {
        "images": combined_images,
        "annotations": combined_annotations,
        "categories": categories,
    }

    out_json_path = os.path.join(out_ann_dir, "instances_train.json")
    print(f"\nWriting combined COCO JSON to: {out_json_path} ...", flush=True)
    with open(out_json_path, "w") as f:
        json.dump(final_coco, f)

    t_elapsed = time.time() - t_start

    # Class distribution
    class_dist: Dict[str, int] = {c["name"]: 0 for c in categories}
    for a in combined_annotations:
        cid = a["category_id"]
        class_dist[EXPECTED_CLASSES[cid]] += 1

    print("\n" + "=" * 70, flush=True)
    print("  COMBINED DATASET SUMMARY", flush=True)
    print("=" * 70, flush=True)
    print(f"Total Images      : {len(combined_images)}")
    print(f"  - Original Train: {len(orig_id_remap)}")
    print(f"  - Roboflow Train: {rf_img_count}")
    print(f"Total Annotations : {len(combined_annotations)}")
    print(f"  - Original Train: {orig_ann_count} converted, {orig_skipped_count} skipped")
    print(f"  - Roboflow Train: {rf_ann_count}")
    print("\nClass Distribution:")
    for cname, count in class_dist.items():
        print(f"  - {cname:26s}: {count:5d}")
    print(f"\nCompleted in {t_elapsed:.2f}s.")
    print("=" * 70 + "\n", flush=True)

    return True, {
        "num_images": len(combined_images),
        "num_annotations": len(combined_annotations),
        "original_images": len(orig_id_remap),
        "roboflow_images": rf_img_count,
        "original_annotations_converted": orig_ann_count,
        "original_annotations_skipped": orig_skipped_count,
        "roboflow_annotations": rf_ann_count,
        "class_distribution": class_dist,
        "json_path": out_json_path,
        "img_dir": out_img_dir,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Build persistent combined training dataset for Smart-Helmet-Violation-Detection"
    )
    parser.add_argument(
        "--original-root",
        default="/content/drive/MyDrive/Smart-Helmet-Violation-Detection/data",
        help="Path to original dataset root (containing instances_train.json and train/images/)",
    )
    parser.add_argument(
        "--roboflow-root",
        default="/content/drive/MyDrive/Smart-Helmet-Violation-Detection/external_datasets/rf_converted_train",
        help="Path to Roboflow converted dataset root (containing images/ and labels/)",
    )
    parser.add_argument(
        "--output-root",
        default="/content/drive/MyDrive/Smart-Helmet-Violation-Detection/combined_train",
        help="Output path for persistent combined dataset",
    )
    parser.add_argument(
        "--no-copy-images",
        action="store_true",
        help="Disable copying image files (only generate annotations/instances_train.json)",
    )
    parser.add_argument(
        "--force-rebuild",
        action="store_true",
        help="Force rebuild even if output combined dataset already exists and passes verification",
    )
    args = parser.parse_args()

    success, report = build_combined_train_dataset(
        original_root=args.original_root,
        roboflow_root=args.roboflow_root,
        output_root=args.output_root,
        copy_images=not args.no_copy_images,
        force_rebuild=args.force_rebuild,
    )
    if not success:
        sys.exit(1)
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)
