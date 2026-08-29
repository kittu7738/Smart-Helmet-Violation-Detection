"""
Unit and Integration Tests for Dataset Preparation and Verification Pipeline
"""

import os
import shutil
import tempfile
import unittest
from collections import Counter
from pathlib import Path
import numpy as np
import cv2
import yaml

from src.prepare_dataset import (
    parse_raw_yaml,
    parse_and_filter_label,
    create_stratified_splits,
    prepare_dataset,
    verify_dataset_integrity,
    generate_sample_visualizations,
    TARGET_CLASSES,
)


class TestDatasetPreparation(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.tmp_path = Path(self.temp_dir)
        self.raw_dir = self.tmp_path / "raw_dataset"
        self.raw_dir.mkdir(parents=True)

        raw_yaml = self.raw_dir / "data.yaml"
        with raw_yaml.open("w") as f:
            yaml.dump({
                "names": ["Plate", "WithHelmet", "WithoutHelmet"],
                "nc": 3,
                "train": "train/images",
                "val": "valid/images",
                "test": "test/images"
            }, f)

        splits = {
            "train": 20,
            "valid": 6,
            "test": 4
        }

        dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)

        for split_name, count in splits.items():
            s_img = self.raw_dir / split_name / "images"
            s_lbl = self.raw_dir / split_name / "labels"
            s_img.mkdir(parents=True)
            s_lbl.mkdir(parents=True)

            for i in range(count):
                stem = f"{split_name}_{i:03d}"
                img_path = s_img / f"{stem}.jpg"
                lbl_path = s_lbl / f"{stem}.txt"

                cv2.imwrite(str(img_path), dummy_img)

                # Annotations:
                # i % 4 == 0: Plate only (0)
                # i % 4 == 1: WithHelmet (1) + Plate (0)
                # i % 4 == 2: WithoutHelmet (2)
                # i % 4 == 3: WithHelmet (1) + WithoutHelmet (2) + Plate (0)
                lines = []
                if i % 4 == 0:
                    lines.append("0 0.5 0.5 0.2 0.1")  # Plate
                elif i % 4 == 1:
                    lines.append("1 0.3 0.3 0.15 0.15") # WithHelmet
                    lines.append("0 0.8 0.8 0.1 0.1")   # Plate
                elif i % 4 == 2:
                    lines.append("2 0.4 0.4 0.15 0.15") # WithoutHelmet
                elif i % 4 == 3:
                    lines.append("1 0.2 0.2 0.1 0.1")   # WithHelmet
                    lines.append("2 0.6 0.6 0.1 0.1")   # WithoutHelmet
                    lines.append("0 0.5 0.9 0.1 0.05")  # Plate

                with lbl_path.open("w") as f:
                    f.write("\n".join(lines) + "\n")

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_parse_raw_yaml(self):
        raw_yaml = self.raw_dir / "data.yaml"
        name_to_id, id_to_name = parse_raw_yaml(raw_yaml)
        self.assertEqual(id_to_name[0], "Plate")
        self.assertEqual(id_to_name[1], "WithHelmet")
        self.assertEqual(id_to_name[2], "WithoutHelmet")

    def test_parse_and_filter_label(self):
        label_path = self.tmp_path / "sample.txt"
        with label_path.open("w") as f:
            # Plate (0), WithHelmet (1), WithoutHelmet (2)
            f.write("0 0.5 0.5 0.2 0.1\n1 0.3 0.3 0.1 0.1\n2 0.7 0.7 0.15 0.15\n")

        id_to_name = {0: "Plate", 1: "WithHelmet", 2: "WithoutHelmet"}
        boxes, counts, plates_removed = parse_and_filter_label(label_path, id_to_name)

        self.assertEqual(plates_removed, 1)
        self.assertEqual(counts[0], 1)  # WithHelmet
        self.assertEqual(counts[1], 1)  # WithoutHelmet
        self.assertEqual(len(boxes), 2)
        self.assertEqual(boxes[0][0], 0)  # Remapped WithHelmet -> 0
        self.assertEqual(boxes[1][0], 1)  # Remapped WithoutHelmet -> 1

    def test_end_to_end_preparation_and_verification(self):
        output_dir = self.tmp_path / "prepared_dataset"
        stats = prepare_dataset(
            raw_dir=str(self.raw_dir),
            output_dir=str(output_dir),
            train_ratio=0.80,
            val_ratio=0.10,
            test_ratio=0.10,
            seed=42
        )

        self.assertTrue((output_dir / "data.yaml").exists())
        self.assertTrue((output_dir / "train" / "images").exists())
        self.assertTrue((output_dir / "valid" / "images").exists())
        self.assertTrue((output_dir / "test" / "images").exists())

        # Verify integrity
        verified_stats = verify_dataset_integrity(str(output_dir))
        self.assertIn("train", verified_stats)
        self.assertIn("valid", verified_stats)
        self.assertIn("test", verified_stats)

        # Confirm all classes in verified stats are in {0, 1}
        for split, stat in verified_stats.items():
            self.assertTrue(set(stat["classes_present"]).issubset({0, 1}))

        # Test visualization generation
        vis_path = self.tmp_path / "vis_sample.png"
        result_vis = generate_sample_visualizations(str(output_dir), output_image_path=str(vis_path), num_samples_per_split=2)
        self.assertTrue(Path(result_vis).exists())


if __name__ == "__main__":
    unittest.main()
