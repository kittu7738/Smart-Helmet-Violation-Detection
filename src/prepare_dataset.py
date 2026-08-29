#!/usr/bin/env python3
"""
Smart Helmet Violation Detection - Dataset Preparation & Verification Pipeline

This module prepares the YOLOv8 dataset targeting exclusively:
    0: WithHelmet
    1: WithoutHelmet

Key Functions:
- Preserves the original raw dataset intact.
- Filters out all 'Plate' annotations completely.
- Correctly remaps class IDs:
    WithHelmet    -> 0
    WithoutHelmet -> 1
- Creates a reproducible, stratified unseen evaluation/holdout split (test/)
  alongside train/ and valid/ using a fixed random seed.
- Validates bounding boxes, class boundaries, label formats, and zero data leakage.
- Generates verified data.yaml with exactly 2 classes.
- Generates visual sample verification grids with distinct color-coded annotations.
"""

import argparse
import os
import random
import shutil
from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import matplotlib.pyplot as plt
import yaml


TARGET_CLASSES = {
    0: "WithHelmet",
    1: "WithoutHelmet"
}

RGB_CLASS_COLORS = {
    0: (0, 200, 0),    # Green for WithHelmet
    1: (220, 0, 0)     # Red for WithoutHelmet
}


def parse_raw_yaml(raw_yaml_path: Path) -> Tuple[Dict[str, int], Dict[int, str]]:
    """
    Parses original raw data.yaml to identify existing class mappings.
    Returns:
        name_to_id: Dict[class_name, orig_id]
        id_to_name: Dict[orig_id, class_name]
    """
    if not raw_yaml_path.exists():
        # Default fallback standard for Roboflow HelmetViolations dataset
        return {"Plate": 0, "WithHelmet": 1, "WithoutHelmet": 2}, {0: "Plate", 1: "WithHelmet", 2: "WithoutHelmet"}

    with raw_yaml_path.open("r") as f:
        data = yaml.safe_load(f)

    names = data.get("names", [])
    if isinstance(names, list):
        id_to_name = {i: name for i, name in enumerate(names)}
        name_to_id = {name: i for i, name in enumerate(names)}
    elif isinstance(names, dict):
        id_to_name = {int(k): v for k, v in names.items()}
        name_to_id = {v: int(k) for k, v in names.items()}
    else:
        id_to_name = {0: "Plate", 1: "WithHelmet", 2: "WithoutHelmet"}
        name_to_id = {"Plate": 0, "WithHelmet": 1, "WithoutHelmet": 2}

    return name_to_id, id_to_name


def find_dataset_files(raw_dir: Path) -> List[Dict]:
    """
    Scans the raw dataset directory to locate all image-label pairs across all splits.
    """
    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    raw_images = []

    for path in sorted(raw_dir.rglob("*")):
        if path.is_file() and path.suffix.lower() in image_extensions:
            stem = path.stem
            # Find corresponding label file
            label_file = None
            candidate_dirs = [
                path.parent,
                path.parent.parent / "labels" / path.parent.name,
                raw_dir / "labels" / path.parent.name,
                raw_dir / "labels",
                path.parent / "labels",
            ]
            for c_dir in candidate_dirs:
                c_path = c_dir / f"{stem}.txt"
                if c_path.exists():
                    label_file = c_path
                    break

            if label_file is None:
                matching = list(raw_dir.rglob(f"{stem}.txt"))
                if matching:
                    label_file = matching[0]

            raw_images.append({
                "image_path": path,
                "label_path": label_file,
                "stem": stem
            })

    return raw_images


def parse_and_filter_label(
    label_path: Optional[Path],
    id_to_name: Dict[int, str]
) -> Tuple[List[Tuple[int, float, float, float, float]], Counter, int]:
    """
    Parses a YOLO annotation file, discarding Plate annotations and remapping
    WithHelmet -> 0 and WithoutHelmet -> 1.

    Returns:
        filtered_boxes: List of (new_class_id, x_center, y_center, width, height)
        counts: Counter of target classes in this image
        plate_count: Number of Plate annotations removed
    """
    filtered_boxes = []
    counts = Counter()
    plate_count = 0

    if label_path is None or not label_path.exists():
        return filtered_boxes, counts, plate_count

    with label_path.open("r") as f:
        lines = f.read().splitlines()

    for line in lines:
        parts = line.strip().split()
        if not parts:
            continue
        try:
            orig_id = int(parts[0])
            coords = [float(p) for p in parts[1:5]]
        except (ValueError, IndexError):
            continue

        orig_name = id_to_name.get(orig_id, "").strip()

        # Check normalization
        cx, cy, w, h = coords
        cx = max(0.0, min(1.0, cx))
        cy = max(0.0, min(1.0, cy))
        w = max(0.001, min(1.0, w))
        h = max(0.001, min(1.0, h))

        # Check class mapping
        if "without" in orig_name.lower() or orig_name.lower() == "withouthelmet":
            new_id = 1
            filtered_boxes.append((new_id, cx, cy, w, h))
            counts[1] += 1
        elif "with" in orig_name.lower() or orig_name.lower() == "withhelmet" or orig_name.lower() == "helmet":
            new_id = 0
            filtered_boxes.append((new_id, cx, cy, w, h))
            counts[0] += 1
        elif "plate" in orig_name.lower():
            plate_count += 1
        else:
            # Fallback based on raw ID if names were not clear
            if orig_id == 1:
                new_id = 0
                filtered_boxes.append((new_id, cx, cy, w, h))
                counts[0] += 1
            elif orig_id == 2:
                new_id = 1
                filtered_boxes.append((new_id, cx, cy, w, h))
                counts[1] += 1
            elif orig_id == 0:
                plate_count += 1

    return filtered_boxes, counts, plate_count


def create_stratified_splits(
    records: List[Dict],
    train_ratio: float = 0.80,
    val_ratio: float = 0.10,
    test_ratio: float = 0.10,
    seed: int = 42
) -> Dict[str, List[Dict]]:
    """
    Creates stratified, non-overlapping train/valid/test splits from annotated records.
    """
    random.seed(seed)

    buckets = {
        "both": [],
        "with_only": [],
        "without_only": [],
        "background": []
    }

    for rec in records:
        counts = rec["counts"]
        has_with = counts[0] > 0
        has_without = counts[1] > 0

        if has_with and has_without:
            buckets["both"].append(rec)
        elif has_with:
            buckets["with_only"].append(rec)
        elif has_without:
            buckets["without_only"].append(rec)
        else:
            buckets["background"].append(rec)

    splits = {"train": [], "valid": [], "test": []}

    total_ratio = train_ratio + val_ratio + test_ratio
    r_train = train_ratio / total_ratio
    r_val = val_ratio / total_ratio

    for category, items in buckets.items():
        shuffled = list(items)
        random.shuffle(shuffled)
        n = len(shuffled)

        if n == 0:
            continue

        if n >= 3:
            n_val = max(1, int(round(n * r_val)))
            n_test = max(1, int(round(n * (1.0 - r_train - r_val))))
            n_train = n - n_val - n_test
            if n_train < 1:
                n_train = 1
                n_val = (n - 1) // 2
                n_test = n - 1 - n_val
        elif n == 2:
            n_train, n_val, n_test = 1, 1, 0
        else:
            n_train, n_val, n_test = 1, 0, 0

        train_items = shuffled[:n_train]
        val_items = shuffled[n_train:n_train + n_val]
        test_items = shuffled[n_train + n_val:]

        splits["train"].extend(train_items)
        splits["valid"].extend(val_items)
        splits["test"].extend(test_items)

    for split_name in splits:
        random.shuffle(splits[split_name])

    return splits


def prepare_dataset(
    raw_dir: str,
    output_dir: str,
    train_ratio: float = 0.80,
    val_ratio: float = 0.10,
    test_ratio: float = 0.10,
    seed: int = 42,
    generate_yaml: bool = True
) -> Dict:
    """
    Prepares the dataset by reading from raw_dir, filtering annotations,
    stratifying splits, and writing clean images and labels to output_dir.
    """
    raw_path = Path(raw_dir).resolve()
    out_path = Path(output_dir).resolve()

    if not raw_path.exists():
        raise FileNotFoundError(f"Raw dataset directory not found: {raw_path}")

    yaml_candidates = list(raw_path.glob("**/data.yaml"))
    raw_yaml_path = yaml_candidates[0] if yaml_candidates else raw_path / "data.yaml"
    name_to_id, id_to_name = parse_raw_yaml(raw_yaml_path)

    print(f"==================================================")
    print(f"PREPARING SMART HELMET DETECTION DATASET")
    print(f"==================================================")
    print(f"Raw dataset path: {raw_path}")
    print(f"Prepared dataset output: {out_path}")
    print(f"Original class mapping: {id_to_name}")
    print(f"Target classes: {TARGET_CLASSES}")
    print(f"Random seed: {seed}")
    print(f"Split ratios: train={train_ratio}, val={val_ratio}, test={test_ratio}")

    raw_files = find_dataset_files(raw_path)
    print(f"Found {len(raw_files)} total images in raw dataset.")

    records = []
    total_plates_removed = 0
    total_orig_with = 0
    total_orig_without = 0

    seen_stems = set()
    for item in raw_files:
        stem = item["stem"]
        if stem in seen_stems:
            continue
        seen_stems.add(stem)

        filtered_boxes, counts, plates_removed = parse_and_filter_label(item["label_path"], id_to_name)
        total_plates_removed += plates_removed
        total_orig_with += counts[0]
        total_orig_without += counts[1]

        records.append({
            "image_path": item["image_path"],
            "stem": stem,
            "boxes": filtered_boxes,
            "counts": counts,
            "plates_removed": plates_removed
        })

    print(f"Total images after unique deduplication: {len(records)}")
    print(f"Total Plate annotations removed: {total_plates_removed}")
    print(f"Total WithHelmet annotations: {total_orig_with}")
    print(f"Total WithoutHelmet annotations: {total_orig_without}")

    splits = create_stratified_splits(
        records,
        train_ratio=train_ratio,
        val_ratio=val_ratio,
        test_ratio=test_ratio,
        seed=seed
    )

    out_path.mkdir(parents=True, exist_ok=True)

    split_dir_map = {
        "train": out_path / "train",
        "valid": out_path / "valid",
        "test": out_path / "test"
    }

    train_stems = {r["stem"] for r in splits["train"]}
    val_stems = {r["stem"] for r in splits["valid"]}
    test_stems = {r["stem"] for r in splits["test"]}

    assert len(train_stems.intersection(val_stems)) == 0, "Train and Valid share duplicate images!"
    assert len(train_stems.intersection(test_stems)) == 0, "Train and Test share duplicate images!"
    assert len(val_stems.intersection(test_stems)) == 0, "Valid and Test share duplicate images!"

    split_stats = {}
    for split_name, items in splits.items():
        s_dir = split_dir_map[split_name]
        img_dir = s_dir / "images"
        lbl_dir = s_dir / "labels"
        img_dir.mkdir(parents=True, exist_ok=True)
        lbl_dir.mkdir(parents=True, exist_ok=True)

        with_count = 0
        without_count = 0
        bg_count = 0

        for item in items:
            src_img = item["image_path"]
            dst_img = img_dir / src_img.name
            shutil.copy2(src_img, dst_img)

            dst_lbl = lbl_dir / f"{item['stem']}.txt"
            lines = []
            for box in item["boxes"]:
                cid, cx, cy, w, h = box
                lines.append(f"{cid} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")
                if cid == 0:
                    with_count += 1
                elif cid == 1:
                    without_count += 1

            if len(item["boxes"]) == 0:
                bg_count += 1

            with dst_lbl.open("w") as f:
                f.write("\n".join(lines) + ("\n" if lines else ""))

        split_stats[split_name] = {
            "images": len(items),
            "labels": len(items),
            "with_helmet": with_count,
            "without_helmet": without_count,
            "total_annotations": with_count + without_count,
            "background_images": bg_count
        }

    yaml_path = out_path / "data.yaml"
    if generate_yaml:
        yaml_content = {
            "path": str(out_path),
            "train": "train/images",
            "val": "valid/images",
            "test": "test/images",
            "nc": 2,
            "names": {
                0: "WithHelmet",
                1: "WithoutHelmet"
            }
        }
        with yaml_path.open("w") as f:
            yaml.dump(yaml_content, f, default_flow_style=False, sort_keys=False)
        print(f"Generated new dataset configuration at: {yaml_path}")

    stats = {
        "raw_dir": str(raw_path),
        "output_dir": str(out_path),
        "data_yaml": str(yaml_path),
        "plates_removed": total_plates_removed,
        "splits": split_stats,
        "classes": TARGET_CLASSES
    }

    return stats


def verify_dataset_integrity(dataset_dir: str) -> Dict:
    """
    Verifies the integrity of the prepared dataset:
    - Verifies image files and label files match 1:1.
    - Verifies YOLO annotation format.
    - Verifies bounding boxes are within [0, 1].
    - Verifies class IDs are strictly in {0, 1}.
    - Verifies no Plate annotations remain.
    - Verifies zero duplicate images across splits.
    """
    root = Path(dataset_dir).resolve()
    print(f"\n==================================================")
    print(f"VERIFYING PREPARED DATASET QUALITY")
    print(f"==================================================")
    print(f"Dataset root: {root}")

    yaml_path = root / "data.yaml"
    assert yaml_path.exists(), f"data.yaml not found in {root}"

    with yaml_path.open("r") as f:
        data_cfg = yaml.safe_load(f)

    assert data_cfg.get("nc") == 2, f"Expected nc=2, got {data_cfg.get('nc')}"
    names = data_cfg.get("names")
    if isinstance(names, dict):
        assert names[0] == "WithHelmet" and names[1] == "WithoutHelmet", f"Incorrect class names: {names}"
    elif isinstance(names, list):
        assert names == ["WithHelmet", "WithoutHelmet"], f"Incorrect class names: {names}"

    splits = ["train", "valid", "test"]
    overall_stats = {}
    all_stems = {}
    invalid_boxes = 0
    plate_violations = 0

    for split in splits:
        img_dir = root / split / "images"
        lbl_dir = root / split / "labels"

        assert img_dir.exists(), f"Missing images dir: {img_dir}"
        assert lbl_dir.exists(), f"Missing labels dir: {lbl_dir}"

        image_files = sorted(
            p for p in img_dir.iterdir()
            if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
        )
        label_files = sorted(p for p in lbl_dir.iterdir() if p.is_file() and p.suffix.lower() == ".txt")

        img_stems = {p.stem for p in image_files}
        lbl_stems = {p.stem for p in label_files}

        missing_labels = img_stems - lbl_stems
        extra_labels = lbl_stems - img_stems
        assert not missing_labels, f"Split '{split}' has images missing label files: {list(missing_labels)[:5]}"
        assert not extra_labels, f"Split '{split}' has label files missing image files: {list(extra_labels)[:5]}"

        all_stems[split] = img_stems

        class_counts = Counter()
        total_boxes = 0

        for lbl_file in label_files:
            with lbl_file.open("r") as f:
                lines = f.read().splitlines()
            for line in lines:
                parts = line.strip().split()
                if not parts:
                    continue
                cid = int(parts[0])
                cx, cy, w, h = map(float, parts[1:5])

                if cid not in {0, 1}:
                    plate_violations += 1
                class_counts[cid] += 1
                total_boxes += 1

                if not (0.0 <= cx <= 1.0 and 0.0 <= cy <= 1.0 and 0.0 <= w <= 1.0 and 0.0 <= h <= 1.0):
                    invalid_boxes += 1

        overall_stats[split] = {
            "image_count": len(image_files),
            "label_count": len(label_files),
            "with_helmet": class_counts[0],
            "without_helmet": class_counts[1],
            "total_boxes": total_boxes,
            "classes_present": sorted(list(class_counts.keys()))
        }

    assert len(all_stems["train"].intersection(all_stems["valid"])) == 0, "Overlap found between train and valid!"
    assert len(all_stems["train"].intersection(all_stems["test"])) == 0, "Overlap found between train and test!"
    assert len(all_stems["valid"].intersection(all_stems["test"])) == 0, "Overlap found between valid and test!"
    assert plate_violations == 0, f"Found {plate_violations} non-helmet (Plate) class IDs in prepared dataset!"
    assert invalid_boxes == 0, f"Found {invalid_boxes} out-of-bounds bounding boxes!"

    print(f"\n✅ DATASET INTEGRITY VERIFIED SUCCESSFULLY")
    print(f"--------------------------------------------------------------------------------")
    print(f"{'Split':<10} | {'Images':<8} | {'WithHelmet (0)':<15} | {'WithoutHelmet (1)':<18} | {'Total Boxes':<12}")
    print(f"--------------------------------------------------------------------------------")
    for split, stat in overall_stats.items():
        print(f"{split:<10} | {stat['image_count']:<8} | {stat['with_helmet']:<15} | {stat['without_helmet']:<18} | {stat['total_boxes']:<12}")
    print(f"--------------------------------------------------------------------------------")
    print(f"Total Plate annotations remaining: 0 (Confirmed)")
    print(f"Zero duplicate images across splits: Confirmed")
    print(f"YOLO format coordinate boundaries: Confirmed [0, 1]")

    return overall_stats


def generate_sample_visualizations(
    dataset_dir: str,
    output_image_path: str = "screenshots/dataset_verification_samples.png",
    num_samples_per_split: int = 2
) -> str:
    """
    Draws bounding box annotations on sample images from train, valid, and test sets,
    and creates a consolidated visual verification grid.
    """
    root = Path(dataset_dir).resolve()
    splits = ["train", "valid", "test"]
    samples_by_split = {}

    for split in splits:
        img_dir = root / split / "images"
        lbl_dir = root / split / "labels"
        candidates = []
        if img_dir.exists() and lbl_dir.exists():
            for img_path in sorted(img_dir.iterdir()):
                if img_path.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}:
                    lbl_path = lbl_dir / f"{img_path.stem}.txt"
                    if lbl_path.exists() and lbl_path.stat().st_size > 0:
                        candidates.append((img_path, lbl_path))

        selected = random.sample(candidates, min(num_samples_per_split, len(candidates))) if candidates else []
        samples_by_split[split] = selected

    total_samples = sum(len(v) for v in samples_by_split.values())
    if total_samples == 0:
        print("No annotated images available for visualization.")
        return ""

    rows = len(splits)
    cols = num_samples_per_split
    fig, axes = plt.subplots(rows, cols, figsize=(cols * 6, rows * 5))
    if rows == 1 and cols == 1:
        axes = [[axes]]
    elif rows == 1:
        axes = [axes]
    elif cols == 1:
        axes = [[ax] for ax in axes]

    for row_idx, split in enumerate(splits):
        samples = samples_by_split[split]
        for col_idx in range(cols):
            ax = axes[row_idx][col_idx]
            if col_idx < len(samples):
                img_path, lbl_path = samples[col_idx]
                img = cv2.imread(str(img_path))
                if img is not None:
                    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    h, w = img_rgb.shape[:2]

                    with lbl_path.open("r") as f:
                        for line in f.read().splitlines():
                            parts = line.strip().split()
                            if not parts:
                                continue
                            cid = int(parts[0])
                            cx, cy, bw, bh = map(float, parts[1:5])
                            x1 = int((cx - bw / 2.0) * w)
                            y1 = int((cy - bh / 2.0) * h)
                            x2 = int((cx + bw / 2.0) * w)
                            y2 = int((cy + bh / 2.0) * h)

                            color = RGB_CLASS_COLORS.get(cid, (255, 255, 0))
                            label_str = TARGET_CLASSES.get(cid, f"Class {cid}")

                            cv2.rectangle(img_rgb, (x1, y1), (x2, y2), color, 2)
                            cv2.putText(
                                img_rgb,
                                label_str,
                                (x1, max(20, y1 - 6)),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.6,
                                color,
                                2
                            )

                    ax.imshow(img_rgb)
                    ax.set_title(f"[{split.upper()}] {img_path.name[:25]}", fontsize=11)
            ax.axis("off")

    plt.suptitle("Dataset Verification Samples (Green: WithHelmet, Red: WithoutHelmet)", fontsize=14, y=0.98)
    plt.tight_layout()

    out_file = Path(output_image_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(str(out_file), dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Sample verification visualization saved to: {out_file}")
    return str(out_file)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare and verify helmet detection dataset.")
    parser.add_argument("--raw_dir", type=str, default="datasets/HelmetViolations", help="Path to raw dataset")
    parser.add_argument("--output_dir", type=str, default="datasets/helmet_violation_prepared", help="Prepared dataset directory")
    parser.add_argument("--train_ratio", type=float, default=0.80, help="Train split ratio")
    parser.add_argument("--val_ratio", type=float, default=0.10, help="Val split ratio")
    parser.add_argument("--test_ratio", type=float, default=0.10, help="Test holdout split ratio")
    parser.add_argument("--seed", type=int, default=42, help="Fixed random seed")
    parser.add_argument("--verify_only", action="store_true", help="Only verify existing prepared dataset")

    args = parser.parse_args()

    if not args.verify_only:
        stats = prepare_dataset(
            raw_dir=args.raw_dir,
            output_dir=args.output_dir,
            train_ratio=args.train_ratio,
            val_ratio=args.val_ratio,
            test_ratio=args.test_ratio,
            seed=args.seed
        )

    verify_dataset_integrity(args.output_dir)
    generate_sample_visualizations(args.output_dir)
