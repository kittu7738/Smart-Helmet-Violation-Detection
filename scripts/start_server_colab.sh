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

# Locate checkpoint
CKPT_CANDS=(
  "${MODEL_CHECKPOINT:-}"
  "/content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/k5_bs7_training/best_bbox_mAP_epoch_10.pth"
  "${REPO_ROOT}/work_dirs/k5_bs7_training/best_bbox_mAP_epoch_10.pth"
  "/content/Smart-Helmet-Violation-Detection/work_dirs/k5_bs7_training/best_bbox_mAP_epoch_10.pth"
)
for c in "${CKPT_CANDS[@]}"; do
  if [[ -n "${c}" && -f "${c}" ]]; then
    export MODEL_CHECKPOINT="${c}"
    break
  fi
done

# 2. Launch FastAPI with GPU model
echo "[2/4] Launching FastAPI server on port 8000..."
if [[ -n "${MODEL_CHECKPOINT:-}" ]]; then
  echo "      Checkpoint: ${MODEL_CHECKPOINT}"
fi
nohup "${PYTHON_BIN}" "${REPO_ROOT}/python-service/app.py" > /content/fastapi.log 2>&1 &

FASTAPI_PID=$!
echo "      FastAPI started in background (PID: ${FASTAPI_PID})."

# 3. Launch Cloudflare Tunnel
echo "[3/4] Launching Cloudflare Tunnel for public HTTPS access..."
if ! command -v cloudflared &>/dev/null && [[ ! -x "/usr/local/bin/cloudflared" ]]; then
  echo "      Downloading cloudflared binary..."
  curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared 2>/dev/null || true
  chmod +x /usr/local/bin/cloudflared 2>/dev/null || true
fi

CLOUDFLARED_BIN="$(command -v cloudflared || echo '/usr/local/bin/cloudflared')"
if [[ -x "${CLOUDFLARED_BIN}" ]]; then
  nohup "${CLOUDFLARED_BIN}" tunnel --url http://127.0.0.1:8000 > /content/tunnel.log 2>&1 &
  echo "      Cloudflare tunnel started in background."
else
  echo "      [WARN] cloudflared not found. Install via: curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared"
fi

# 4. Wait for warmup & retrieve public URL
echo "[4/4] Waiting for Co-DETR model initialization and public URL..."
TUNNEL_URL=""
for i in {1..25}; do
  if [[ -f /content/tunnel.log ]]; then
    TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /content/tunnel.log 2>/dev/null | tail -1 || true)
    if [[ -n "${TUNNEL_URL}" ]]; then
      break
    fi
  fi
  sleep 1
done

echo ""
echo "====================================================================="
echo "  📋 FastAPI Startup Log (last 10 lines):"
echo "====================================================================="
tail -n 10 /content/fastapi.log 2>/dev/null || true

echo ""
echo "====================================================================="
if [[ -n "${TUNNEL_URL}" ]]; then
  echo "  🌐 GLOBAL PUBLIC HTTPS TUNNEL URL:"
  echo "     ${TUNNEL_URL}"
  echo ""
  echo "  👉 Paste this URL into your Web App settings / API URL input!"
else
  echo "  ℹ️  Cloudflare Tunnel is still initializing. Check url with:"
  echo "     !grep -o 'https://.*trycloudflare.com' /content/tunnel.log | tail -1"
fi
echo "====================================================================="
