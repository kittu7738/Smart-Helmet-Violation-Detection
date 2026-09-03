#!/usr/bin/env python3
"""
AI City Challenge 2024 Track 5 - Dataset Inspection & Validation Tool

Validates dataset specifications for reproducing:
"Robust Motorcycle Helmet Detection in Real-World Scenarios: Using Co-DETR and Minority Class Enhancement"

Expected Paper Specifications:
- 100 training videos (20 seconds each @ 10 FPS, 1920x1080)
- 9 target classes:
    0: Motorbike
    1: DHelmet
    2: DNoHelmet
    3: P1Helmet
    4: P1NoHelmet
    5: P2Helmet
    6: P2NoHelmet
    7: P0Helmet
    8: P0NoHelmet
"""

import argparse
import json
import os
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import cv2


EXPECTED_CLASSES: Dict[int, str] = {
    0: "Motorbike",
    1: "DHelmet",
    2: "DNoHelmet",
    3: "P1Helmet",
    4: "P1NoHelmet",
    5: "P2Helmet",
    6: "P2NoHelmet",
    7: "P0Helmet",
    8: "P0NoHelmet",
}

EXPECTED_NAMES_TO_ID: Dict[str, int] = {v: k for k, v in EXPECTED_CLASSES.items()}

# Common aliases in community / challenge formats (normalized to lowercase without spaces or underscores)
COMMON_CLASS_ALIASES: Dict[str, int] = {
    "motorbike": 0,
    "motorcycle": 0,
    "bike": 0,
    "dhelmet": 1,
    "driverhelmet": 1,
    "driverwithhelmet": 1,
    "dnohelmet": 2,
    "drivernohelmet": 2,
    "driverwithouthelmet": 2,
    "p1helmet": 3,
    "passenger1helmet": 3,
    "p1nohelmet": 4,
    "passenger1nohelmet": 4,
    "p2helmet": 5,
    "passenger2helmet": 5,
    "p2nohelmet": 6,
    "passenger2nohelmet": 6,
    "p0helmet": 7,
    "passenger0helmet": 7,
    "p0nohelmet": 8,
    "passenger0nohelmet": 8,
}


def probe_video(video_path: Path) -> Dict[str, Any]:
    """Inspects video file resolution, FPS, and total frame count using OpenCV."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return {
            "path": str(video_path),
            "readable": False,
            "error": "Failed to open video file"
        }

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = float(cap.get(cv2.CAP_PROP_FPS))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()

    duration = frame_count / fps if fps > 0 else 0.0

    return {
        "path": str(video_path),
        "name": video_path.name,
        "readable": True,
        "width": width,
        "height": height,
        "fps": round(fps, 2),
        "frame_count": frame_count,
        "duration_sec": round(duration, 2),
    }


def parse_coco_annotations(json_path: Path) -> Tuple[List[Dict], Counter, List[str], int]:
    """Parses COCO format JSON annotation file."""
    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    categories = {cat["id"]: cat["name"] for cat in data.get("categories", [])}
    annotations = data.get("annotations", [])
    class_dist = Counter()
    malformed = 0

    records = []
    for ann in annotations:
        cat_id = ann.get("category_id")
        bbox = ann.get("bbox", [])
        if len(bbox) != 4 or bbox[2] <= 0 or bbox[3] <= 0:
            malformed += 1
            continue
        class_name = categories.get(cat_id, str(cat_id))
        class_dist[class_name] += 1
        records.append({
            "image_id": ann.get("image_id"),
            "category_id": cat_id,
            "category_name": class_name,
            "bbox": bbox,
        })

    return records, class_dist, list(categories.values()), malformed


def parse_voc_xml(xml_path: Path) -> Tuple[List[Dict], Counter, List[str], int]:
    """Parses PASCAL VOC XML annotation file."""
    tree = ET.parse(str(xml_path))
    root = tree.getroot()
    records = []
    class_dist = Counter()
    cat_names = set()
    malformed = 0

    for obj in root.findall("object"):
        name_tag = obj.find("name")
        bndbox = obj.find("bndbox")
        if name_tag is None or bndbox is None:
            malformed += 1
            continue

        c_name = name_tag.text.strip() if name_tag.text else "unknown"
        cat_names.add(c_name)
        class_dist[c_name] += 1

        try:
            xmin = float(bndbox.find("xmin").text)
            ymin = float(bndbox.find("ymin").text)
            xmax = float(bndbox.find("xmax").text)
            ymax = float(bndbox.find("ymax").text)
            if xmax <= xmin or ymax <= ymin:
                malformed += 1
                continue
            records.append({
                "category_name": c_name,
                "bbox": [xmin, ymin, xmax - xmin, ymax - ymin]
            })
        except (ValueError, TypeError, AttributeError):
            malformed += 1

    return records, class_dist, list(cat_names), malformed


def parse_tabular_annotations(file_path: Path) -> Tuple[List[Dict], Counter, List[str], int]:
    """
    Parses TXT/CSV annotations common in AI City Challenge (MOT/tabular format):
    Format: <video_id>, <frame_id>, <bb_left>, <bb_top>, <bb_width>, <bb_height>, <class_id>[, conf]
    or space/tab/comma delimited.
    """
    records = []
    class_dist = Counter()
    unique_classes = set()
    malformed = 0

    with file_path.open("r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            delimiter = "," if "," in line else None
            parts = [p.strip() for p in line.split(delimiter) if p.strip()]

            # Tabular detection row requires at least 7 fields (video, frame, x, y, w, h, class)
            # or YOLO style (class, cx, cy, w, h)
            if len(parts) >= 7:
                try:
                    video_id = parts[0]
                    frame_id = int(float(parts[1]))
                    x = float(parts[2])
                    y = float(parts[3])
                    w = float(parts[4])
                    h = float(parts[5])
                    cid = parts[6]
                    if w <= 0 or h <= 0:
                        malformed += 1
                        continue
                    class_dist[cid] += 1
                    unique_classes.add(cid)
                    records.append({
                        "video_id": video_id,
                        "frame_id": frame_id,
                        "bbox": [x, y, w, h],
                        "class_id": cid
                    })
                except (ValueError, IndexError):
                    malformed += 1
            elif len(parts) == 5:
                # YOLO style per-frame format: <class> <cx> <cy> <w> <h>
                try:
                    cid = parts[0]
                    cx = float(parts[1])
                    cy = float(parts[2])
                    w = float(parts[3])
                    h = float(parts[4])
                    if w <= 0 or h <= 0:
                        malformed += 1
                        continue
                    class_dist[cid] += 1
                    unique_classes.add(cid)
                    records.append({
                        "bbox": [cx, cy, w, h],
                        "class_id": cid
                    })
                except ValueError:
                    malformed += 1
            else:
                malformed += 1

    return records, class_dist, sorted(list(unique_classes)), malformed


def validate_aicity_dataset(dataset_dir: str) -> Dict[str, Any]:
    """
    Core validation routine inspecting videos, frames, annotations, and classes.
    """
    root_path = Path(dataset_dir).expanduser().resolve()

    if not root_path.exists():
        raise FileNotFoundError(f"Dataset path does not exist: {root_path}")
    if not root_path.is_dir():
        raise NotADirectoryError(f"Dataset path is not a directory: {root_path}")

    # 1. Discover Video Files
    video_exts = {".mp4", ".avi", ".mov", ".mkv"}
    video_files = sorted(
        p for p in root_path.rglob("*")
        if p.is_file() and p.suffix.lower() in video_exts
    )

    # Check for duplicate video filenames
    video_name_counts = Counter(p.name for p in video_files)
    duplicate_video_names = [name for name, count in video_name_counts.items() if count > 1]

    video_info_list = []
    resolutions = Counter()
    fps_counts = Counter()
    total_video_frames = 0

    for v_path in video_files:
        info = probe_video(v_path)
        video_info_list.append(info)
        if info["readable"]:
            resolutions[f"{info['width']}x{info['height']}"] += 1
            fps_counts[info["fps"]] += 1
            total_video_frames += info["frame_count"]

    # 2. Discover Frame Image Files (if extracted)
    image_exts = {".jpg", ".jpeg", ".png", ".bmp"}
    image_files = sorted(
        p for p in root_path.rglob("*")
        if p.is_file() and p.suffix.lower() in image_exts
    )
    image_name_counts = Counter(p.name for p in image_files)
    duplicate_image_names = [name for name, count in image_name_counts.items() if count > 1]

    # 3. Discover and Parse Annotations
    ann_files_json = list(root_path.rglob("*.json"))
    ann_files_xml = list(root_path.rglob("*.xml"))
    ann_files_txt = [
        p for p in root_path.rglob("*.txt")
        if not p.name.startswith(".") and "requirement" not in p.name.lower()
    ]
    ann_files_csv = list(root_path.rglob("*.csv"))

    detected_format = "None"
    all_annotations: List[Dict] = []
    class_distribution = Counter()
    detected_class_names: List[str] = []
    total_malformed = 0
    parsed_files = []

    if ann_files_json:
        detected_format = "COCO JSON"
        for j_path in ann_files_json:
            parsed_files.append(str(j_path))
            records, dist, cat_names, mal = parse_coco_annotations(j_path)
            all_annotations.extend(records)
            class_distribution.update(dist)
            for c in cat_names:
                if c not in detected_class_names:
                    detected_class_names.append(c)
            total_malformed += mal

    elif ann_files_xml:
        detected_format = "PASCAL VOC XML"
        for x_path in ann_files_xml:
            parsed_files.append(str(x_path))
            records, dist, cat_names, mal = parse_voc_xml(x_path)
            all_annotations.extend(records)
            class_distribution.update(dist)
            for c in cat_names:
                if c not in detected_class_names:
                    detected_class_names.append(c)
            total_malformed += mal

    elif ann_files_txt or ann_files_csv:
        detected_format = "Tabular / MOT TXT/CSV"
        for t_path in ann_files_txt + ann_files_csv:
            parsed_files.append(str(t_path))
            records, dist, cat_names, mal = parse_tabular_annotations(t_path)
            all_annotations.extend(records)
            class_distribution.update(dist)
            for c in cat_names:
                if c not in detected_class_names:
                    detected_class_names.append(c)
            total_malformed += mal

    # 4. Class Validation against the 9 Paper Classes
    # 0=Motorbike, 1=DHelmet, 2=DNoHelmet, 3=P1Helmet, 4=P1NoHelmet,
    # 5=P2Helmet, 6=P2NoHelmet, 7=P0Helmet, 8=P0NoHelmet
    class_check_passed = False
    mapping_required: Dict[str, int] = {}
    class_warnings: List[str] = []

    detected_classes_set = set(str(c) for c in detected_class_names)
    expected_names_set = set(EXPECTED_CLASSES.values())
    expected_ids_set = set(str(k) for k in EXPECTED_CLASSES.keys())

    if detected_classes_set == expected_names_set or detected_classes_set == expected_ids_set:
        class_check_passed = True
    else:
        # Evaluate mapping
        for det_cls in detected_class_names:
            normalized = str(det_cls).lower().replace(" ", "").replace("_", "")
            if normalized in COMMON_CLASS_ALIASES:
                target_id = COMMON_CLASS_ALIASES[normalized]
                target_name = EXPECTED_CLASSES[target_id]
                mapping_required[str(det_cls)] = target_id
            else:
                class_warnings.append(f"Unrecognized class '{det_cls}' cannot be automatically matched to paper's 9 classes.")

    summary = {
        "dataset_root": str(root_path),
        "video_count": len(video_files),
        "video_resolutions": dict(resolutions),
        "video_fps": dict(fps_counts),
        "total_video_frames": total_video_frames,
        "extracted_frames_count": len(image_files),
        "duplicate_video_names": duplicate_video_names,
        "duplicate_image_names": duplicate_image_names,
        "annotation_format": detected_format,
        "annotation_files": parsed_files,
        "total_annotations": len(all_annotations),
        "class_distribution": dict(class_distribution),
        "detected_classes": detected_class_names,
        "expected_classes": EXPECTED_CLASSES,
        "class_check_passed": class_check_passed,
        "mapping_required": mapping_required,
        "class_warnings": class_warnings,
        "malformed_annotations": total_malformed,
    }

    return summary


def print_validation_report(report: Dict[str, Any]) -> None:
    """Prints a structured, human-readable terminal report."""
    print("\n" + "=" * 70)
    print("AI CITY CHALLENGE 2024 TRACK 5 — DATASET VALIDATION REPORT")
    print("=" * 70)
    print(f"Dataset Location:          {report['dataset_root']}")
    print(f"Videos Found:              {report['video_count']} (Expected: 100 for training)")
    print(f"Video Resolutions:         {report['video_resolutions']} (Expected: 1920x1080)")
    print(f"Video Frame Rates (FPS):   {report['video_fps']} (Expected: 10 FPS)")
    print(f"Total Video Frames Probed: {report['total_video_frames']:,}")
    print(f"Extracted Image Frames:    {report['extracted_frames_count']:,}")

    if report["duplicate_video_names"]:
        print(f"⚠️ Duplicate Video Names:   {len(report['duplicate_video_names'])}")
    if report["duplicate_image_names"]:
        print(f"⚠️ Duplicate Image Names:   {len(report['duplicate_image_names'])}")

    print("-" * 70)
    print(f"Annotation Format Detected: {report['annotation_format']}")
    print(f"Annotation Files Count:    {len(report['annotation_files'])}")
    print(f"Total Annotations Count:   {report['total_annotations']:,}")
    print(f"Malformed Annotations:     {report['malformed_annotations']}")
    print("-" * 70)

    print("Class Distribution Found:")
    if report["class_distribution"]:
        for cname, count in sorted(report["class_distribution"].items(), key=lambda x: str(x[0])):
            print(f"  - {cname:<22}: {count:,}")
    else:
        print("  (No annotations or classes found in path)")

    print("-" * 70)
    print("Paper 9-Class Validation Status:")
    for cid, cname in EXPECTED_CLASSES.items():
        print(f"  Class {cid}: {cname}")

    print("-" * 70)
    if report["class_check_passed"]:
        print("✅ CLASS CHECK: Exactly matches the paper's expected 9 classes.")
    else:
        print("⚠️ CLASS CHECK: Class names/IDs differ from paper's exact standard format.")
        if report["mapping_required"]:
            print("\nRecommended Class Mapping to Paper Standard:")
            for src_name, target_id in report["mapping_required"].items():
                target_name = EXPECTED_CLASSES[target_id]
                print(f"  '{src_name}' -> Class {target_id} ({target_name})")
            print("\n[ACTION REQUIRED] Do NOT silently convert classes. Verify mapping before proceeding.")

        if report["class_warnings"]:
            print("\nUnrecognized Classes / Warnings:")
            for w in report["class_warnings"]:
                print(f"  - {w}")

    print("=" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Inspect and validate AI City Challenge 2024 Track 5 dataset for paper reproduction."
    )
    parser.add_argument(
        "--dataset",
        type=str,
        required=True,
        help="Path to the local AI City Challenge 2024 Track 5 dataset folder",
    )
    parser.add_argument(
        "--json-output",
        type=str,
        default=None,
        help="Optional path to save report as a JSON file",
    )

    args = parser.parse_args()

    try:
        report = validate_aicity_dataset(args.dataset)
        print_validation_report(report)

        if args.json_output:
            out_path = Path(args.json_output)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with out_path.open("w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)
            print(f"Validation JSON report saved to: {out_path}")

        # Exit code 0 on successful validation run
        sys.exit(0)

    except Exception as e:
        print(f"\n❌ Validation Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
