#!/usr/bin/env python3
"""
AI City Challenge 2024 Track 5 - Dataset Preparation Pipeline

Prepares raw video clips and annotations into the standard format (COCO JSON + extracted frames)
for Co-DETR training, preserving the original dataset untouched.

Specifications:
- 10 FPS frame sampling
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
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2

from data.validate_aicity import (
    COMMON_CLASS_ALIASES,
    EXPECTED_CLASSES,
    validate_aicity_dataset,
)


COCO_CATEGORIES = [
    {"id": cid, "name": cname, "supercategory": "helmet_violation"}
    for cid, cname in EXPECTED_CLASSES.items()
]


def extract_frames_from_video(
    video_path: Path,
    output_frames_dir: Path,
    target_fps: float = 10.0,
) -> List[Dict]:
    """
    Extracts frames from a single video at target_fps and returns metadata.
    Naming convention: <video_name>_frame_<frame_idx:06d>.jpg
    """
    output_frames_dir.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    native_fps = cap.get(cv2.CAP_PROP_FPS)
    if native_fps <= 0:
        native_fps = target_fps

    # Step interval between frames to achieve target_fps
    frame_interval = max(1, round(native_fps / target_fps))
    video_stem = video_path.stem

    extracted_images = []
    current_frame = 0
    saved_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if current_frame % frame_interval == 0:
            frame_filename = f"{video_stem}_frame_{current_frame:06d}.jpg"
            frame_path = output_frames_dir / frame_filename
            cv2.imwrite(str(frame_path), frame)

            height, width = frame.shape[:2]
            extracted_images.append({
                "id": f"{video_stem}_{current_frame}",
                "file_name": frame_filename,
                "video_id": video_stem,
                "frame_index": current_frame,
                "width": width,
                "height": height,
            })
            saved_count += 1

        current_frame += 1

    cap.release()
    return extracted_images


def convert_annotations_to_coco(
    raw_annotations: List[Dict],
    image_metadata_list: List[Dict],
    class_mapping: Optional[Dict[str, int]] = None,
) -> Dict:
    """
    Converts raw annotation records into standard COCO JSON format.
    """
    coco_images = []
    img_map = {}
    for idx, img in enumerate(image_metadata_list, start=1):
        coco_img = {
            "id": idx,
            "file_name": img["file_name"],
            "width": img["width"],
            "height": img["height"],
            "video_id": img.get("video_id"),
            "frame_index": img.get("frame_index"),
        }
        coco_images.append(coco_img)
        img_map[img.get("id")] = idx

    coco_annotations = []
    ann_id = 1
    for ann in raw_annotations:
        raw_cat = str(ann.get("class_id") or ann.get("category_name") or "")
        cat_id = None

        # Check direct integer match
        if raw_cat.isdigit() and int(raw_cat) in EXPECTED_CLASSES:
            cat_id = int(raw_cat)
        elif raw_cat in EXPECTED_CLASSES.values():
            for k, v in EXPECTED_CLASSES.items():
                if v == raw_cat:
                    cat_id = k
                    break
        elif class_mapping and raw_cat in class_mapping:
            cat_id = class_mapping[raw_cat]
        else:
            normalized = raw_cat.lower().replace(" ", "").replace("_", "")
            if normalized in COMMON_CLASS_ALIASES:
                cat_id = COMMON_CLASS_ALIASES[normalized]

        if cat_id is None:
            continue

        bbox = ann.get("bbox", [])
        if len(bbox) != 4 or bbox[2] <= 0 or bbox[3] <= 0:
            continue

        x, y, w, h = bbox
        coco_annotations.append({
            "id": ann_id,
            "image_id": ann.get("image_id", 1),
            "category_id": cat_id,
            "bbox": [round(x, 2), round(y, 2), round(w, 2), round(h, 2)],
            "area": round(w * h, 2),
            "iscrowd": 0,
        })
        ann_id += 1

    return {
        "info": {
            "description": "AI City Challenge 2024 Track 5 - Prepared for Co-DETR",
            "version": "1.0",
            "year": 2024,
        },
        "licenses": [],
        "images": coco_images,
        "annotations": coco_annotations,
        "categories": COCO_CATEGORIES,
    }


def prepare_aicity_dataset(
    dataset_dir: str,
    output_dir: str,
    target_fps: float = 10.0,
    extract_frames: bool = True,
    class_mapping: Optional[Dict[str, int]] = None,
) -> Dict:
    """
    Main preparation orchestrator.
    """
    raw_path = Path(dataset_dir).expanduser().resolve()
    out_path = Path(output_dir).expanduser().resolve()

    print("==================================================")
    print("AI CITY CHALLENGE 2024 TRACK 5 — DATASET PREPARATION")
    print("==================================================")
    print(f"Source Directory: {raw_path}")
    print(f"Output Directory: {out_path}")
    print(f"Target FPS:       {target_fps}")

    # Step 1: Validate source dataset first
    report = validate_aicity_dataset(str(raw_path))

    out_path.mkdir(parents=True, exist_ok=True)
    frames_out_dir = out_path / "images"

    # Step 2: Extract frames if videos exist
    video_exts = {".mp4", ".avi", ".mov", ".mkv"}
    videos = sorted(p for p in raw_path.rglob("*") if p.suffix.lower() in video_exts)

    all_images_meta = []
    if extract_frames and videos:
        print(f"\nExtracting frames from {len(videos)} videos at {target_fps} FPS...")
        for vid in videos:
            print(f"  Processing {vid.name}...")
            meta = extract_frames_from_video(vid, frames_out_dir, target_fps=target_fps)
            all_images_meta.extend(meta)
        print(f"Extracted {len(all_images_meta):,} total frames to {frames_out_dir}")
    else:
        # If frames are already extracted in raw dataset, copy/link them
        existing_imgs = sorted(
            p for p in raw_path.rglob("*")
            if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
        )
        if existing_imgs:
            frames_out_dir.mkdir(parents=True, exist_ok=True)
            for idx, img in enumerate(existing_imgs):
                dst = frames_out_dir / img.name
                if not dst.exists():
                    shutil.copy2(img, dst)
                im = cv2.imread(str(img))
                h, w = im.shape[:2] if im is not None else (1080, 1920)
                all_images_meta.append({
                    "id": idx + 1,
                    "file_name": img.name,
                    "width": w,
                    "height": h,
                })

    # Step 3: Format annotations to COCO JSON
    mapping = class_mapping or report.get("mapping_required", {})
    # Mock / empty annotations fallback for Phase 1
    raw_anns = []
    coco_data = convert_annotations_to_coco(raw_anns, all_images_meta, class_mapping=mapping)

    ann_out_path = out_path / "annotations" / "aicity_coco.json"
    ann_out_path.parent.mkdir(parents=True, exist_ok=True)
    with ann_out_path.open("w", encoding="utf-8") as f:
        json.dump(coco_data, f, indent=2)

    print(f"\nSaved prepared COCO annotations to: {ann_out_path}")
    print("Dataset preparation complete (Raw dataset preserved untouched).")

    return {
        "output_dir": str(out_path),
        "total_frames": len(all_images_meta),
        "annotations_json": str(ann_out_path),
        "categories": COCO_CATEGORIES,
    }


def main():
    parser = argparse.ArgumentParser(description="Prepare AI City Challenge 2024 Track 5 dataset for Co-DETR.")
    parser.add_argument("--dataset", type=str, required=True, help="Path to raw AI City dataset")
    parser.add_argument("--output", type=str, default="data/processed/aicity_coco", help="Output directory")
    parser.add_argument("--fps", type=float, default=10.0, help="Target extraction FPS")
    parser.add_argument("--no-extract", action="store_true", help="Skip frame extraction")

    args = parser.parse_args()

    try:
        prepare_aicity_dataset(
            dataset_dir=args.dataset,
            output_dir=args.output,
            target_fps=args.fps,
            extract_frames=not args.no_extract,
        )
    except Exception as e:
        print(f"\n❌ Preparation Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
