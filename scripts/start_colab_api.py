"""
scripts/start_colab_api.py
==========================
Launches the FastAPI Co-DETR inference server inside Google Colab
and exposes it via a public HTTPS tunnel (e.g. Cloudflare / localtunnel / ngrok).
Prints the public HTTPS URL for Vercel / frontend integration.
"""

import os
import sys
import time
import subprocess
import threading

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PYTHON_SERVICE = os.path.join(REPO_ROOT, "python-service")
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if PYTHON_SERVICE not in sys.path:
    sys.path.insert(0, PYTHON_SERVICE)


def start_uvicorn(port=8000):
    """Starts uvicorn server serving FastAPI."""
    import uvicorn
    from app import app
    print(f"[{time.strftime('%H:%M:%S')}] Starting FastAPI on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")


def main():
    port = int(os.environ.get("PORT", 8000))
    print("=" * 70)
    print("  SMART HELMET Co-DETR GPU INFERENCE API (COLAB / STANDALONE)")
    print("=" * 70)

    # Start FastAPI server in background thread
    server_thread = threading.Thread(target=start_uvicorn, args=(port,), daemon=True)
    server_thread.start()

    # Wait for server to bind
    time.sleep(3)

    # Check local health
    import urllib.request
    import json
    try:
        req = urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=5)
        health = json.loads(req.read().decode())
        print(f"Local Health Check: {health}")
    except Exception as e:
        print(f"[WARN] Local check note: {e}")

    print("\n" + "=" * 70)
    print(f"  FastAPI is LIVE on http://localhost:{port}")
    print("  Endpoints:")
    print(f"    - Health Check : http://localhost:{port}/health")
    print(f"    - Model Status : http://localhost:{port}/model/status")
    print(f"    - Image Predict: POST http://localhost:{port}/predict/image")
    print("=" * 70 + "\n")

    # Keep alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down server...")


if __name__ == "__main__":
    main()
