"""
tests/test_inference_wrapper.py
================================
Unit tests for python-service components: config, schemas, and predictor logic.
"""

import os
import sys
import unittest
import numpy as np

# Ensure repo root and python-service are on path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_SERVICE = os.path.join(REPO_ROOT, "python-service")
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if PYTHON_SERVICE not in sys.path:
    sys.path.insert(0, PYTHON_SERVICE)

from config import (
    EXPECTED_CLASSES,
    CLASS_DISPLAY_NAMES,
    VIOLATION_CLASSES,
    CONFIDENCE_THRESHOLD,
)
from schemas import (
    DetectionItem,
    DetectionSummary,
    ImagePredictionResponse,
    ModelStatusResponse,
)


class TestInferenceWrapper(unittest.TestCase):

    def test_01_classes_count_and_order(self):
        """Verify exactly 7 target classes are configured in correct order."""
        self.assertEqual(len(EXPECTED_CLASSES), 7)
        self.assertEqual(EXPECTED_CLASSES[0], "driver_with_helmet")
        self.assertEqual(EXPECTED_CLASSES[1], "bike")
        self.assertEqual(EXPECTED_CLASSES[2], "driver")
        self.assertEqual(EXPECTED_CLASSES[3], "passenger_with_helmet")
        self.assertEqual(EXPECTED_CLASSES[4], "passenger")
        self.assertEqual(EXPECTED_CLASSES[5], "driver_without_helmet")
        self.assertEqual(EXPECTED_CLASSES[6], "passenger_without_helmet")

    def test_02_violation_classes_mapping(self):
        """Verify exact violation class assignment."""
        self.assertIn("driver_without_helmet", VIOLATION_CLASSES)
        self.assertIn("passenger_without_helmet", VIOLATION_CLASSES)
        self.assertEqual(len(VIOLATION_CLASSES), 2)
        self.assertNotIn("bike", VIOLATION_CLASSES)
        self.assertNotIn("driver_with_helmet", VIOLATION_CLASSES)

    def test_03_class_display_names(self):
        """Verify clean UI labels for each class."""
        for cname in EXPECTED_CLASSES:
            self.assertIn(cname, CLASS_DISPLAY_NAMES)
        self.assertEqual(CLASS_DISPLAY_NAMES["driver_with_helmet"], "Driver — Helmet")
        self.assertEqual(CLASS_DISPLAY_NAMES["driver_without_helmet"], "Driver — No Helmet")
        self.assertEqual(CLASS_DISPLAY_NAMES["bike"], "Motorcycle")

    def test_04_detection_schemas_validation(self):
        """Verify DetectionItem and DetectionSummary schemas."""
        item = DetectionItem(
            class_id=5,
            class_name="driver_without_helmet",
            display_name="Driver — No Helmet",
            confidence=0.88,
            bbox=[100.0, 150.0, 250.0, 350.0],
            violation=True,
        )
        self.assertEqual(item.class_id, 5)
        self.assertTrue(item.violation)
        self.assertEqual(item.confidence, 0.88)

        # Invalid confidence (< 0 or > 1) should raise ValueError
        with self.assertRaises(Exception):
            DetectionItem(
                class_id=0,
                class_name="bike",
                display_name="Motorcycle",
                confidence=1.5,
                bbox=[0, 0, 10, 10],
                violation=False,
            )

    def test_05_image_prediction_response_schema(self):
        """Verify full response serialization."""
        summary = DetectionSummary(
            vehicles=1,
            riders=1,
            helmet_detected=0,
            violations=1,
            total_detections=1,
        )
        resp = ImagePredictionResponse(
            success=True,
            detections=[],
            summary=summary,
            inference_time_ms=45.2,
            image_width=640,
            image_height=384,
            model_name="Co-DETR (ResNet-18)",
            device="cuda:0",
        )
        self.assertTrue(resp.success)
        self.assertEqual(resp.summary.violations, 1)
        self.assertEqual(resp.inference_time_ms, 45.2)

    def test_06_lazy_load_behavior(self):
        """Verify CoDETRPredictor initializes without loading weights if lazy_load=True."""
        from inference import CoDETRPredictor
        predictor = CoDETRPredictor(
            config_path="nonexistent_config.py",
            checkpoint_path="nonexistent_checkpoint.pth",
            lazy_load=True,
        )
        self.assertFalse(predictor.loaded)
        self.assertIsNone(predictor.model)
        status = predictor.get_status()
        self.assertFalse(status.loaded)
        self.assertEqual(status.num_classes, 7)


if __name__ == "__main__":
    unittest.main()
