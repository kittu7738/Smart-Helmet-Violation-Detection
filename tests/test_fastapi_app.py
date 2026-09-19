"""
tests/test_fastapi_app.py
=========================
Tests FastAPI endpoints: /health, /model/status, and error handling.
"""

import os
import sys
import unittest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_SERVICE = os.path.join(REPO_ROOT, "python-service")
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if PYTHON_SERVICE not in sys.path:
    sys.path.insert(0, PYTHON_SERVICE)

from fastapi.testclient import TestClient
from app import app


class TestFastAPIApp(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_endpoint(self):
        """Verify GET /health returns 200 and online status."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["service"], "smart-helmet-codetr-inference")
        self.assertIn("model_loaded", data)

    def test_02_model_status_endpoint(self):
        """Verify GET /model/status returns 7 classes and architecture details."""
        response = self.client.get("/model/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["model_name"], "Co-DETR")
        self.assertEqual(data["backbone"], "ResNet-18")
        self.assertEqual(data["num_classes"], 7)
        self.assertEqual(len(data["class_names"]), 7)

    def test_03_invalid_image_extension_rejected(self):
        """Verify POST /predict/image rejects non-image files with 400."""
        files = {"file": ("test.txt", b"not an image", "text/plain")}
        response = self.client.post("/predict/image", files=files)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported image format", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
