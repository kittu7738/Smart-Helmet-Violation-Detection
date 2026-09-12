#!/usr/bin/env bash
# =============================================================================
# run_codetr.sh
# Universal runner script for Smart-Helmet-Violation-Detection Co-DETR pipeline.
#
# Automatically locates and activates the isolated Co-DETR environment
# (/content/codetr_env, /content/miniconda3/envs/codetr, or local virtualenv),
# configures OpenCV and OpenMP thread isolation, and runs the requested command.
#
# Usage:
#   bash run_codetr.sh training/codetr/train.py --training-diagnostic ...
#   bash run_codetr.sh evaluation/codetr/evaluate.py ...
#   bash run_codetr.sh data/validate_dataset.py ...
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}"

# Search order for isolated Co-DETR python binary
CANDIDATES=(
  "/content/codetr_env/bin/python"
  "/content/miniconda3/envs/codetr/bin/python"
  "/content/miniconda3/bin/python"
  "${REPO_ROOT}/.codetr_env/bin/python"
  "${REPO_ROOT}/venv/bin/python"
  "$(command -v python3 2>/dev/null || echo '')"
)

RESOLVED_PY=""
for cand in "${CANDIDATES[@]}"; do
  if [[ -n "${cand}" && -x "${cand}" ]]; then
    if [[ "${cand}" == *"/content/"* ]] || [[ "${cand}" == *"codetr"* ]] || "${cand}" -c "import mmcv" 2>/dev/null; then
      RESOLVED_PY="${cand}"
      break
    fi
    if [[ -z "${RESOLVED_PY}" ]]; then
      RESOLVED_PY="${cand}"
    fi
  fi
done

if [[ -z "${RESOLVED_PY}" || ! -x "${RESOLVED_PY}" ]]; then
  echo "[ERROR] No usable Python binary found. Please run 'bash scripts/setup_codetr_colab.sh' first." >&2
  exit 1
fi

# Locate Co-DETR root
CODETR_DIR="${CODETR_REPO:-/content/Co-DETR}"
if [[ ! -d "${CODETR_DIR}" && -d "${REPO_ROOT}/../Co-DETR" ]]; then
  CODETR_DIR="$(cd "${REPO_ROOT}/../Co-DETR" && pwd)"
fi

export PYTHONPATH="${CODETR_DIR}:${REPO_ROOT}:${PYTHONPATH:-}"
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export CV_NUM_THREADS=0
export PYTHONUNBUFFERED=1

exec "${RESOLVED_PY}" "$@"
