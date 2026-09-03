"""
Unit Tests for AI City Challenge 2024 Track 5 Dataset Validation & Preparation
"""

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from data.validate_aicity import (
    EXPECTED_CLASSES,
    validate_aicity_dataset,
    probe_video,
)
from data.prepare_aicity import (
    prepare_aicity_dataset,
    convert_annotations_to_coco,
)


class TestAICityValidation(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.root = Path(self.temp_dir)

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_synthetic_video(self, video_path: Path, width=1920, height=1080, fps=10.0, num_frames=10):
        """Generates a small valid video file with given resolution and FPS."""
        video_path.parent.mkdir(parents=True, exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(video_path), fourcc, fps, (width, height))
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        for _ in range(num_frames):
            writer.write(frame)
        writer.release()

    def test_invalid_dataset_path_raises_error(self):
        non_existent_path = self.root / "does_not_exist"
        with self.assertRaises(FileNotFoundError) as ctx:
            validate_aicity_dataset(str(non_existent_path))
        self.assertIn("Dataset path does not exist", str(ctx.exception))

    def test_file_instead_of_directory_raises_error(self):
        file_path = self.root / "not_a_dir.txt"
        file_path.write_text("sample")
        with self.assertRaises(NotADirectoryError):
            validate_aicity_dataset(str(file_path))

    def test_synthetic_aicity_dataset_validation(self):
        mock_dataset = self.root / "mock_aicity"
        mock_dataset.mkdir()

        # Create 2 mock 1920x1080 10 FPS videos
        self._create_synthetic_video(mock_dataset / "videos" / "001.mp4", width=1920, height=1080, fps=10.0, num_frames=15)
        self._create_synthetic_video(mock_dataset / "videos" / "002.mp4", width=1920, height=1080, fps=10.0, num_frames=15)

        # Create mock annotations covering all 9 classes in tabular format:
        # video_id, frame_id, x, y, w, h, class_id
        ann_lines = [
            "001, 1, 100, 200, 300, 400, 0",  # Motorbike
            "001, 1, 150, 100, 80, 80, 1",    # DHelmet
            "001, 2, 100, 200, 300, 400, 0",  # Motorbike
            "001, 2, 150, 100, 80, 80, 2",    # DNoHelmet
            "002, 1, 200, 300, 250, 350, 0",  # Motorbike
            "002, 1, 220, 150, 70, 70, 3",    # P1Helmet
            "002, 2, 200, 300, 250, 350, 0",  # Motorbike
            "002, 2, 220, 150, 70, 70, 4",    # P1NoHelmet
            "002, 3, 220, 150, 70, 70, 5",    # P2Helmet
            "002, 4, 220, 150, 70, 70, 6",    # P2NoHelmet
            "002, 5, 220, 150, 70, 70, 7",    # P0Helmet
            "002, 6, 220, 150, 70, 70, 8",    # P0NoHelmet
        ]
        ann_file = mock_dataset / "annotations" / "gt.txt"
        ann_file.parent.mkdir(parents=True, exist_ok=True)
        ann_file.write_text("\n".join(ann_lines))

        report = validate_aicity_dataset(str(mock_dataset))

        self.assertEqual(report["video_count"], 2)
        self.assertIn("1920x1080", report["video_resolutions"])
        self.assertIn(10.0, report["video_fps"])
        self.assertEqual(report["total_annotations"], 12)
        self.assertEqual(report["malformed_annotations"], 0)
        self.assertTrue(report["class_check_passed"])
        self.assertEqual(len(report["detected_classes"]), 9)

    def test_alternative_class_names_triggers_mapping_recommendation(self):
        mock_dataset = self.root / "mock_unmapped"
        mock_dataset.mkdir()

        # Annotations using string aliases: motorbike, driver_helmet, passenger1_nohelmet
        coco_data = {
            "categories": [
                {"id": 10, "name": "motorbike"},
                {"id": 20, "name": "driver_helmet"},
                {"id": 30, "name": "passenger1_nohelmet"}
            ],
            "images": [
                {"id": 1, "file_name": "frame_001.jpg", "width": 1920, "height": 1080}
            ],
            "annotations": [
                {"id": 1, "image_id": 1, "category_id": 10, "bbox": [100, 100, 200, 200]},
                {"id": 2, "image_id": 1, "category_id": 20, "bbox": [120, 50, 50, 50]},
                {"id": 3, "image_id": 1, "category_id": 30, "bbox": [180, 60, 50, 50]}
            ]
        }
        coco_file = mock_dataset / "annotations.json"
        coco_file.write_text(json.dumps(coco_data))

        report = validate_aicity_dataset(str(mock_dataset))
        self.assertFalse(report["class_check_passed"])
        self.assertIn("motorbike", report["mapping_required"])
        self.assertEqual(report["mapping_required"]["motorbike"], 0)
        self.assertIn("driver_helmet", report["mapping_required"])
        self.assertEqual(report["mapping_required"]["driver_helmet"], 1)
        self.assertIn("passenger1_nohelmet", report["mapping_required"])
        self.assertEqual(report["mapping_required"]["passenger1_nohelmet"], 4)

    def test_prepare_aicity_pipeline(self):
        mock_dataset = self.root / "mock_prep"
        mock_dataset.mkdir()
        self._create_synthetic_video(mock_dataset / "001.mp4", width=640, height=360, fps=10.0, num_frames=10)

        out_dir = self.root / "processed"
        prep_result = prepare_aicity_dataset(
            dataset_dir=str(mock_dataset),
            output_dir=str(out_dir),
            target_fps=10.0,
            extract_frames=True
        )

        self.assertTrue(Path(prep_result["output_dir"]).exists())
        self.assertTrue(Path(prep_result["annotations_json"]).exists())
        self.assertGreater(prep_result["total_frames"], 0)


if __name__ == "__main__":
    unittest.main()
