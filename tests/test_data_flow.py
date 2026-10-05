"""
tests/test_data_flow.py
========================
Automated validation of the real data flow between:
  Detection -> Central Detection Store -> Reports (/api/violations) & Analytics (/api/metrics)
"""

import os
import sys
import json
import tempfile
import unittest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_SERVICE = os.path.join(REPO_ROOT, "python-service")
sys.path.insert(0, REPO_ROOT)
sys.path.insert(0, PYTHON_SERVICE)

from detection_store import DetectionStore


class TestDataFlow(unittest.TestCase):
    def setUp(self):
        # Use temporary file store
        self.temp_file = tempfile.NamedTemporaryFile(suffix=".json", delete=False)
        self.temp_file.close()
        self.store = DetectionStore(store_path=self.temp_file.name)
        self.store.clear()

    def tearDown(self):
        if os.path.exists(self.temp_file.name):
            os.remove(self.temp_file.name)

    def test_empty_store_returns_zero_mock(self):
        """Verify that when no detections have run, NO mock data is returned."""
        violations = self.store.get_violations()
        self.assertEqual(len(violations), 0, "Violations must be empty initially, no mock data allowed.")

        metrics = self.store.get_metrics()
        self.assertEqual(metrics["totalDetections"], 0)
        self.assertEqual(metrics["totalViolations"], 0)
        self.assertEqual(metrics["totalRecords"], 0)
        self.assertEqual(len(metrics["violationsOverTime"]), 0)

    def test_single_detection_flow(self):
        """Simulate real Co-DETR output from image #1 with 1 driver violation and 1 motorcycle."""
        fake_pred_1 = {
            "success": True,
            "detections": [
                {
                    "class_id": 1,
                    "class_name": "bike",
                    "display_name": "Motorcycle",
                    "confidence": 0.954,
                    "bbox": [100, 200, 300, 400],
                    "violation": False
                },
                {
                    "class_id": 5,
                    "class_name": "driver_without_helmet",
                    "display_name": "Driver (No Helmet)",
                    "confidence": 0.912,
                    "bbox": [150, 220, 250, 350],
                    "violation": True
                }
            ],
            "summary": {
                "vehicles": 1,
                "riders": 1,
                "helmet_detected": 0,
                "violations": 1,
                "total_detections": 2
            },
            "inference_time_ms": 114.5,
            "image_width": 1280,
            "image_height": 720,
            "model_name": "Co-DETR (ResNet-18)",
            "device": "cuda:0"
        }

        rec = self.store.add_prediction(fake_pred_1, "traffic_sample_01.jpg")
        self.assertEqual(self.store.get_records()[0]["id"], rec["id"])

        # Check Reports data
        violations = self.store.get_violations()
        self.assertEqual(len(violations), 1, "Exactly 1 violation row must be generated.")
        v = violations[0]
        self.assertEqual(v["violation"], "Driver Without Helmet")
        self.assertEqual(v["riderType"], "DRIVER")
        self.assertEqual(v["confidence"], 91.2)
        self.assertEqual(v["vehicle"], "traffic_sample_01.jpg")
        self.assertEqual(v["location"], "Unknown")

        # Check Analytics data
        metrics = self.store.get_metrics()
        self.assertEqual(metrics["totalRecords"], 1)
        self.assertEqual(metrics["totalDetections"], 2)
        self.assertEqual(metrics["totalMotorcycles"], 1)
        self.assertEqual(metrics["totalDrivers"], 1)
        self.assertEqual(metrics["totalPassengers"], 0)
        self.assertEqual(metrics["withHelmet"], 0)
        self.assertEqual(metrics["withoutHelmet"], 1)
        self.assertEqual(metrics["totalViolations"], 1)
        self.assertEqual(metrics["driverViolations"], 1)
        self.assertEqual(metrics["passengerViolations"], 0)
        self.assertEqual(metrics["helmetCompliancePercentage"], 0.0)
        self.assertEqual(metrics["violationRate"], 100.0)
        self.assertEqual(metrics["averageInferenceTime"], 114.5)

    def test_second_detection_flow_and_persistence(self):
        """Simulate image #2 with 1 driver with helmet and 1 passenger without helmet."""
        fake_pred_1 = {
            "detections": [
                {"class_name": "bike", "confidence": 0.95, "bbox": [0,0,10,10], "violation": False},
                {"class_name": "driver_without_helmet", "confidence": 0.90, "bbox": [0,0,10,10], "violation": True}
            ],
            "summary": {"vehicles": 1, "riders": 1, "helmet_detected": 0, "violations": 1},
            "inference_time_ms": 100.0
        }
        self.store.add_prediction(fake_pred_1, "img_1.jpg")

        fake_pred_2 = {
            "detections": [
                {"class_name": "bike", "confidence": 0.96, "bbox": [0,0,10,10], "violation": False},
                {"class_name": "driver_with_helmet", "confidence": 0.92, "bbox": [0,0,10,10], "violation": False},
                {"class_name": "passenger_without_helmet", "confidence": 0.88, "bbox": [0,0,10,10], "violation": True}
            ],
            "summary": {"vehicles": 1, "riders": 2, "helmet_detected": 1, "violations": 1},
            "inference_time_ms": 120.0
        }
        self.store.add_prediction(fake_pred_2, "img_2.jpg")

        # Reports check
        violations = self.store.get_violations()
        self.assertEqual(len(violations), 2, "Must contain exactly 2 violations.")
        self.assertEqual(violations[0]["riderType"], "PASSENGER", "Newest record must be first.")
        self.assertEqual(violations[1]["riderType"], "DRIVER")

        # Analytics check
        metrics = self.store.get_metrics()
        self.assertEqual(metrics["totalRecords"], 2)
        self.assertEqual(metrics["totalDetections"], 5)
        self.assertEqual(metrics["totalMotorcycles"], 2)
        self.assertEqual(metrics["totalDrivers"], 2)
        self.assertEqual(metrics["totalPassengers"], 1)
        self.assertEqual(metrics["withHelmet"], 1)
        self.assertEqual(metrics["withoutHelmet"], 2)
        self.assertEqual(metrics["totalViolations"], 2)
        self.assertEqual(metrics["driverViolations"], 1)
        self.assertEqual(metrics["passengerViolations"], 1)
        self.assertEqual(metrics["helmetCompliancePercentage"], 33.3) # 1 / 3 riders
        self.assertEqual(metrics["violationRate"], 66.7) # 2 / 3 riders
        self.assertEqual(metrics["averageInferenceTime"], 110.0) # (100 + 120)/2

        # Persistence check: create a fresh store instance pointing to the same file
        store_reloaded = DetectionStore(store_path=self.temp_file.name)
        reloaded_metrics = store_reloaded.get_metrics()
        self.assertEqual(reloaded_metrics["totalRecords"], 2)
        self.assertEqual(reloaded_metrics["totalViolations"], 2)
        self.assertEqual(reloaded_metrics["driverViolations"], 1)
        self.assertEqual(reloaded_metrics["passengerViolations"], 1)


if __name__ == "__main__":
    unittest.main()
