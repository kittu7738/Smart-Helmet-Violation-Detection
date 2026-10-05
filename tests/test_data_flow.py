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

    def test_deduplication_guard(self):
        """Verify that identical or repeated prediction writes do not create duplicate records."""
        pred = {
            "detections": [
                {"class_name": "bike", "confidence": 0.95, "bbox": [0,0,10,10], "violation": False},
                {"class_name": "driver_without_helmet", "confidence": 0.90, "bbox": [0,0,10,10], "violation": True}
            ],
            "summary": {"vehicles": 1, "riders": 1, "helmet_detected": 0, "violations": 1},
            "inference_time_ms": 115.0
        }
        rec1 = self.store.add_prediction(pred, "same_image.jpg")
        rec2 = self.store.add_prediction(pred, "same_image.jpg")

        self.assertEqual(rec1["id"], rec2["id"], "Second write must return existing record without creating a duplicate.")
        self.assertEqual(len(self.store.get_records()), 1, "Store must contain exactly 1 record.")

    def test_get_latest_record_and_status_terminology(self):
        """Verify get_latest_record returns the most recent record and status is VIOLATION DETECTED."""
        pred_no_viol = {
            "detections": [
                {"class_name": "bike", "confidence": 0.95, "bbox": [0,0,10,10], "violation": False},
                {"class_name": "driver_with_helmet", "confidence": 0.90, "bbox": [0,0,10,10], "violation": False}
            ],
            "summary": {"vehicles": 1, "riders": 1, "helmet_detected": 1, "violations": 0},
            "inference_time_ms": 100.0
        }
        pred_viol = {
            "detections": [
                {"class_name": "bike", "confidence": 0.95, "bbox": [0,0,10,10], "violation": False},
                {"class_name": "driver_without_helmet", "confidence": 0.92, "bbox": [0,0,10,10], "violation": True}
            ],
            "summary": {"vehicles": 1, "riders": 1, "helmet_detected": 0, "violations": 1},
            "inference_time_ms": 105.0
        }

        self.store.add_prediction(pred_no_viol, "first.jpg")
        self.store.add_prediction(pred_viol, "second.jpg")

        latest = self.store.get_latest_record()
        self.assertIsNotNone(latest)
        self.assertEqual(latest["fileName"], "second.jpg")
        self.assertEqual(latest["status"], "VIOLATION DETECTED")

        # Status filter for actual violations
        violations = self.store.get_violations(status="VIOLATION DETECTED")
        self.assertEqual(len(violations), 1)
        self.assertEqual(violations[0]["status"], "VIOLATION DETECTED")

        # All audit logs (both compliant and violations)
        all_logs = self.store.get_violations()
        self.assertEqual(len(all_logs), 2)

    def test_low_confidence_noise_filtered_from_violations(self):
        """
        Verify that candidate proposals with confidence < 0.20 (e.g. 16.3%, 12.5%, 6.6%)
        are kept in raw detections for slider inspection, but filtered out from:
          1. Record summary.violations (must be 0)
          2. Record status (must be NO VIOLATION)
          3. Reports get_violations(status='VIOLATION DETECTED') (must return 0 rows)
          4. Emits a compliant audit log row with status NO VIOLATION
        """
        pred_low_conf = {
            "detections": [
                {"class_name": "bike", "confidence": 0.85, "bbox": [10, 10, 50, 50], "violation": False},
                {"class_name": "driver_with_helmet", "confidence": 0.72, "bbox": [20, 20, 40, 40], "violation": False},
                # Low confidence noise candidates (like test3.jpeg)
                {"class_name": "driver_without_helmet", "confidence": 0.163, "bbox": [25, 25, 35, 35], "violation": True},
                {"class_name": "driver_without_helmet", "confidence": 0.125, "bbox": [22, 22, 32, 32], "violation": True},
                {"class_name": "driver_without_helmet", "confidence": 0.066, "bbox": [21, 21, 31, 31], "violation": True},
            ],
            "summary": {"vehicles": 1, "riders": 4, "helmet_detected": 1, "violations": 0},
            "inference_time_ms": 110.0
        }

        rec = self.store.add_prediction(pred_low_conf, "test3.jpeg")
        self.assertEqual(rec["summary"]["violations"], 0, "Violations with conf < 0.20 must not be counted in summary")
        self.assertEqual(rec["summary"]["withoutHelmet"], 0)
        self.assertEqual(rec["status"], "NO VIOLATION")
        self.assertEqual(len(rec["detections"]), 5, "All candidates must be preserved in detections for UI slider")

        # Zero violations detected
        violations = self.store.get_violations(status="VIOLATION DETECTED")
        self.assertEqual(len(violations), 0, "No violations below 20% confidence should appear in Reports")

        # Audit row exists for test3.jpeg showing compliant status
        all_logs = self.store.get_violations()
        self.assertEqual(len(all_logs), 1)
        self.assertEqual(all_logs[0]["status"], "NO VIOLATION")
        self.assertEqual(all_logs[0]["violation"], "No Violation (Compliant)")
        self.assertEqual(all_logs[0]["vehicle"], "test3.jpeg")


if __name__ == "__main__":
    unittest.main()
