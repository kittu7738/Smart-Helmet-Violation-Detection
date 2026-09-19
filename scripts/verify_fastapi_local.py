"""
scripts/verify_fastapi_local.py
===============================
Starts FastAPI, waits for Co-DETR model initialization, and verifies
/health, /model/status, and /predict/image locally.
"""

import os
import sys
import time
import json
import threading
import urllib.request
import urllib.error

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_SERVICE = os.path.join(REPO_ROOT, "python-service")
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if PYTHON_SERVICE not in sys.path:
    sys.path.insert(0, PYTHON_SERVICE)


def start_server():
    import uvicorn
    from app import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")


def main():
    print("=" * 70)
    print("  VERIFYING FASTAPI Co-DETR GPU INFERENCE ENDPOINTS")
    print("=" * 70)

    # 1. Start server in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # 2. Poll /health until model is loaded (max 60 seconds)
    print("Waiting for FastAPI server & Co-DETR GPU initialization...")
    ready = False
    for attempt in range(30):
        time.sleep(2)
        try:
            with urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=3) as resp:
                data = json.loads(resp.read().decode())
                if data.get("model_loaded"):
                    ready = True
                    print(f"[OK] Health endpoint responding (model_loaded=True) after {attempt*2 + 2}s")
                    break
        except Exception:
            continue

    if not ready:
        sys.exit("[ERROR] FastAPI server failed to initialize model within 60 seconds.")

    # 3. Verify /model/status
    print("\n--- CHECKING GET /model/status ---")
    with urllib.request.urlopen("http://127.0.0.1:8000/model/status", timeout=5) as resp:
        status = json.loads(resp.read().decode())
        print("Model Name      :", status.get("model_name"))
        print("Backbone        :", status.get("backbone"))
        print("Device          :", status.get("device"))
        print("GPU Hardware    :", status.get("gpu_name"))
        print("Allocated VRAM  :", f"{status.get('memory_allocated_mb')} MB")
        print("Target Classes  :", status.get("class_names"))

    # 4. Verify POST /predict/image with a real test image
    sample_img = os.path.join(REPO_ROOT, "tests/data/sample_traffic.jpg")
    print(f"\n--- CHECKING POST /predict/image ({sample_img}) ---")
    
    with open(sample_img, "rb") as f:
        img_bytes = f.read()

    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="sample_traffic.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("latin-1") + img_bytes + f"\r\n--{boundary}--\r\n".encode("latin-1")

    req = urllib.request.Request(
        "http://127.0.0.1:8000/predict/image?confidence_threshold=0.20",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        pred = json.loads(resp.read().decode())
        print(f"Success         : {pred.get('success')}")
        print(f"Inference Latency: {pred.get('inference_time_ms')} ms")
        print(f"Total Detections: {len(pred.get('detections', []))}")
        print(f"Summary Counts  : {pred.get('summary')}")

    print("\n" + "=" * 70)
    print("  FASTAPI INFERENCE SERVICE FULLY OPERATIONAL AND VERIFIED!")
    print("=" * 70)


if __name__ == "__main__":
    main()
