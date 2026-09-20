#!/usr/bin/env bash
# =============================================================================
# scripts/start_server_colab.sh
# 1-Click Startup for Co-DETR FastAPI Server & Cloudflare HTTPS Tunnel in Colab
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Identify Python binary
PYTHON_BIN="/content/codetr_env/bin/python"
if [[ ! -x "${PYTHON_BIN}" ]]; then
  PYTHON_BIN="$(command -v python-codetr || command -v python3 || command -v python)"
fi

echo "====================================================================="
echo "  🚀 Starting Smart Helmet Co-DETR FastAPI Server & Tunnel"
echo "====================================================================="

# 1. Terminate old background processes
echo "[1/4] Stopping any existing uvicorn & cloudflared processes..."
pkill -f uvicorn 2>/dev/null || true
pkill -f cloudflared 2>/dev/null || true
sleep 1

# 2. Launch FastAPI with GPU model
echo "[2/4] Launching FastAPI server (app:app) on port 8000..."
nohup "${PYTHON_BIN}" -m uvicorn app:app \
  --app-dir "${REPO_ROOT}/python-service" \
  --host 0.0.0.0 --port 8000 > /content/fastapi.log 2>&1 &

FASTAPI_PID=$!
echo "      FastAPI started in background (PID: ${FASTAPI_PID})."

# 3. Launch Cloudflare Tunnel
echo "[3/4] Launching Cloudflare Tunnel for public HTTPS access..."
if command -v cloudflared &>/dev/null; then
  nohup cloudflared tunnel --url http://127.0.0.1:8000 > /content/tunnel.log 2>&1 &
  echo "      Cloudflare tunnel started in background."
elif [[ -x "/usr/local/bin/cloudflared" ]]; then
  nohup /usr/local/bin/cloudflared tunnel --url http://127.0.0.1:8000 > /content/tunnel.log 2>&1 &
  echo "      Cloudflare tunnel started in background."
else
  echo "      [WARN] cloudflared not found. Install via scripts/setup_codetr_colab.sh"
fi

# 4. Wait for warmup & retrieve public URL
echo "[4/4] Waiting 12 seconds for Co-DETR model to initialize on GPU..."
sleep 12

echo ""
echo "====================================================================="
echo "  📋 FastAPI Startup Log (last 10 lines):"
echo "====================================================================="
tail -n 10 /content/fastapi.log 2>/dev/null || true

echo ""
echo "====================================================================="
if [[ -f /content/tunnel.log ]]; then
  TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /content/tunnel.log 2>/dev/null | tail -1 || true)
  if [[ -n "${TUNNEL_URL}" ]]; then
    echo "  🌐 PUBLIC HTTPS TUNNEL URL (Paste into Web App Settings):"
    echo "     ${TUNNEL_URL}"
  else
    echo "  ℹ️  Cloudflare Tunnel is still negotiating. Check url with:"
    echo "     !grep -o 'https://.*trycloudflare.com' /content/tunnel.log | tail -1"
  fi
fi
echo "====================================================================="
