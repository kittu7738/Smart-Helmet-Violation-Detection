#!/usr/bin/env bash
# =============================================================================
# setup_codetr_colab.sh
# Reproducible Co-DETR Environment Setup for Google Colab (Tesla T4 GPU)
#
# Project : Smart Helmet Violation Detection
# Paper   : "Robust Motorcycle Helmet Detection in Real-World Scenarios:
#            Using Co-DETR and Minority Class Enhancement" (CVPRW 2024)
# Author  : CH. Anjan Prasad
#
# Usage (in a Colab cell):
#   !git clone https://github.com/kittu7738/Smart-Helmet-Violation-Detection.git
#   !bash Smart-Helmet-Violation-Detection/scripts/setup_codetr_colab.sh
#
# Safe to re-run after a runtime reset — already-installed components are
# detected and skipped.
#
# Constraints
#   - Does NOT download datasets
#   - Does NOT download model checkpoints
#   - Does NOT modify the upstream Co-DETR repository
#   - Does NOT hard-code personal paths
# =============================================================================

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# 0.  Colour helpers & logging
# ──────────────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
fail()    { echo -e "${RED}[FAIL]${RESET}  $*"; }
header()  { echo -e "\n${BOLD}${CYAN}══════════════════════════════════════════${RESET}"; \
            echo -e "${BOLD}${CYAN}  $*${RESET}"; \
            echo -e "${BOLD}${CYAN}══════════════════════════════════════════${RESET}"; }

# ──────────────────────────────────────────────────────────────────────────────
# 1.  Verify Google Colab
# ──────────────────────────────────────────────────────────────────────────────
header "Step 1 / 7 — Verify Google Colab"

if [[ ! -d /content ]]; then
  fail "This script must be run inside Google Colab (/content does not exist)."
  fail "Detected host: $(uname -n)"
  exit 1
fi

# Secondary check: COLAB_RELEASE_TAG or the google.colab Python package
if python3 -c "import google.colab" 2>/dev/null; then
  success "Running inside Google Colab."
elif [[ -n "${COLAB_RELEASE_TAG:-}" ]]; then
  success "Running inside Google Colab (env var COLAB_RELEASE_TAG detected)."
else
  warn "/content exists but google.colab package not found."
  warn "Proceeding anyway — environment looks Colab-compatible."
fi

# ──────────────────────────────────────────────────────────────────────────────
# 2.  Miniconda
# ──────────────────────────────────────────────────────────────────────────────
header "Step 2 / 7 — Miniconda"

CONDA_ROOT="/content/miniconda3"
CONDA_BIN="${CONDA_ROOT}/bin/conda"
CONDA_SH="${CONDA_ROOT}/etc/profile.d/conda.sh"

if [[ -x "${CONDA_BIN}" ]]; then
  success "Miniconda already installed at ${CONDA_ROOT}."
else
  info "Downloading Miniconda installer …"
  INSTALLER="/tmp/miniconda_installer.sh"
  curl -fsSL \
    "https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh" \
    -o "${INSTALLER}"
  bash "${INSTALLER}" -b -p "${CONDA_ROOT}"
  rm -f "${INSTALLER}"
  success "Miniconda installed at ${CONDA_ROOT}."
fi

# Make conda available in this shell session
# shellcheck source=/dev/null
source "${CONDA_SH}"
conda activate base 2>/dev/null || true
info "Conda version: $(conda --version)"

# ──────────────────────────────────────────────────────────────────────────────
# 3.  Create codetr Python 3.7.11 environment
# ──────────────────────────────────────────────────────────────────────────────
header "Step 3 / 7 — codetr conda environment (Python 3.7.11)"

ENV_NAME="codetr"
ENV_PYTHON_VERSION="3.7.11"

if conda env list | grep -qE "^${ENV_NAME}\s"; then
  success "Conda environment '${ENV_NAME}' already exists — skipping creation."
else
  info "Creating conda environment '${ENV_NAME}' with Python ${ENV_PYTHON_VERSION} …"
  conda create -y -n "${ENV_NAME}" python="${ENV_PYTHON_VERSION}"
  success "Environment '${ENV_NAME}' created."
fi

conda activate "${ENV_NAME}"
PYTHON="${CONDA_ROOT}/envs/${ENV_NAME}/bin/python"
PIP="${CONDA_ROOT}/envs/${ENV_NAME}/bin/pip"

info "Active Python: $("${PYTHON}" --version 2>&1)"

# ──────────────────────────────────────────────────────────────────────────────
# 4.  Install compatible dependencies (idempotent)
# ──────────────────────────────────────────────────────────────────────────────
header "Step 4 / 7 — Install dependencies"

# Helper: check whether a pip package (with optional version) is already
# installed.  Usage:  pkg_installed "torch" "1.11.0"
pkg_installed() {
  local pkg="${1}"
  local ver="${2:-}"
  if "${PIP}" show "${pkg}" &>/dev/null; then
    if [[ -z "${ver}" ]]; then
      return 0
    fi
    installed_ver=$("${PIP}" show "${pkg}" | awk '/^Version:/{print $2}')
    if [[ "${installed_ver}" == "${ver}"* ]]; then
      return 0
    fi
  fi
  return 1
}

# ── 4a. PyTorch 1.11.0 + CUDA 11.3 ──────────────────────────────────────────
if pkg_installed "torch" "1.11.0"; then
  success "PyTorch 1.11.0+cu113 already installed — skipping."
else
  info "Installing PyTorch 1.11.0+cu113 …"
  "${PIP}" install \
    torch==1.11.0+cu113 \
    torchvision==0.12.0+cu113 \
    torchaudio==0.11.0+cu113 \
    --extra-index-url https://download.pytorch.org/whl/cu113 \
    --quiet
  success "PyTorch stack installed."
fi

# ── 4b. MMCV 1.5.0 ───────────────────────────────────────────────────────────
if pkg_installed "mmcv-full" "1.5.0"; then
  success "mmcv-full 1.5.0 already installed — skipping."
else
  info "Installing mmcv-full 1.5.0 (cu113 / torch1.11) …"
  "${PIP}" install \
    mmcv-full==1.5.0 \
    -f https://download.openmmlab.com/mmcv/dist/cu113/torch1.11.0/index.html \
    --quiet
  success "mmcv-full installed."
fi

# ── 4c. MMDetection 2.25.3 ───────────────────────────────────────────────────
if pkg_installed "mmdet" "2.25.3"; then
  success "mmdet 2.25.3 already installed — skipping."
else
  info "Installing mmdet 2.25.3 …"
  "${PIP}" install mmdet==2.25.3 --quiet
  success "mmdet installed."
fi

# ── 4d. Supplementary packages ───────────────────────────────────────────────
declare -A EXTRA_PKGS=(
  ["timm"]="0.6.13"
  ["fairscale"]="0.4.6"
  ["scipy"]="1.7.3"
  ["einops"]=""
  ["tensorboard"]=""
  ["fvcore"]=""
  ["pycocotools"]=""
)

for pkg in "${!EXTRA_PKGS[@]}"; do
  ver="${EXTRA_PKGS[$pkg]}"
  if pkg_installed "${pkg}" "${ver}"; then
    success "${pkg}${ver:+ ${ver}} already installed — skipping."
  else
    if [[ -n "${ver}" ]]; then
      info "Installing ${pkg}==${ver} …"
      "${PIP}" install "${pkg}==${ver}" --quiet
    else
      info "Installing ${pkg} (latest compatible) …"
      "${PIP}" install "${pkg}" --quiet
    fi
    success "${pkg} installed."
  fi
done

# ──────────────────────────────────────────────────────────────────────────────
# 5.  Clone / locate Co-DETR source
# ──────────────────────────────────────────────────────────────────────────────
header "Step 5 / 7 — Co-DETR repository"

CODETR_DIR="/content/Co-DETR"
CODETR_REPO="https://github.com/Sense-X/Co-DETR.git"
CODETR_COMMIT="main"   # use the stable main branch; pin to a tag if desired

if [[ -d "${CODETR_DIR}/.git" ]]; then
  success "Co-DETR already cloned at ${CODETR_DIR} — skipping clone."
  info "Current Co-DETR HEAD: $(git -C "${CODETR_DIR}" rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
else
  info "Cloning Co-DETR from ${CODETR_REPO} …"
  git clone --depth 1 --branch "${CODETR_COMMIT}" \
    "${CODETR_REPO}" "${CODETR_DIR}" 2>&1 | tail -5
  success "Co-DETR cloned to ${CODETR_DIR}."
fi

# ──────────────────────────────────────────────────────────────────────────────
# 6.  Install Co-DETR into the codetr environment
# ──────────────────────────────────────────────────────────────────────────────
header "Step 6 / 7 — Install Co-DETR (editable, no-deps)"

# We check for the presence of the installed package or the egg-link.
CODETR_INSTALLED=false
if "${PIP}" show mmdet 2>/dev/null | grep -q "Location.*Co-DETR\|Co.DETR"; then
  CODETR_INSTALLED=true
fi
if [[ -f "${CODETR_DIR}/mmdet.egg-info/PKG-INFO" ]]; then
  CODETR_INSTALLED=true
fi

if [[ "${CODETR_INSTALLED}" == "true" ]]; then
  success "Co-DETR already installed into '${ENV_NAME}' — skipping."
else
  info "Installing Co-DETR in editable mode (this does NOT modify the repo) …"
  # --no-build-isolation avoids pip trying to upgrade setuptools in an
  # incompatible way inside the Python 3.7 environment.
  "${PIP}" install -e "${CODETR_DIR}" \
    --no-deps \
    --no-build-isolation \
    --quiet
  success "Co-DETR installed (editable, no-deps)."
fi

# ──────────────────────────────────────────────────────────────────────────────
# 7.  Environment verification
# ──────────────────────────────────────────────────────────────────────────────
header "Step 7 / 7 — Verification"

VERIFY_PASS=true

# ── 7a. Python version ────────────────────────────────────────────────────────
PY_VER=$("${PYTHON}" -c "import sys; print(sys.version.split()[0])")
if [[ "${PY_VER}" == 3.7.* ]]; then
  success "Python ${PY_VER}"
else
  fail "Python version mismatch: expected 3.7.x, got ${PY_VER}"
  VERIFY_PASS=false
fi

# ── 7b. PyTorch + CUDA ───────────────────────────────────────────────────────
TORCH_CHECK=$("${PYTHON}" - <<'EOF'
import sys
try:
    import torch
    v = torch.__version__
    cuda_avail = torch.cuda.is_available()
    cuda_ver   = torch.version.cuda if cuda_avail else "N/A"
    gpu_name   = torch.cuda.get_device_name(0) if cuda_avail else "none"
    print(f"TORCH_VER={v}")
    print(f"CUDA_AVAIL={cuda_avail}")
    print(f"CUDA_VER={cuda_ver}")
    print(f"GPU={gpu_name}")
except Exception as e:
    print(f"ERROR={e}")
    sys.exit(1)
EOF
)

eval "${TORCH_CHECK}" 2>/dev/null || true
# shellcheck disable=SC2154
if [[ -n "${TORCH_VER:-}" && "${TORCH_VER}" == 1.11.* ]]; then
  success "PyTorch ${TORCH_VER}"
else
  # Fall back to direct parsing
  TORCH_VER=$("${PYTHON}" -c "import torch; print(torch.__version__)" 2>/dev/null || echo "NOT_FOUND")
  if [[ "${TORCH_VER}" == 1.11.* ]]; then
    success "PyTorch ${TORCH_VER}"
  else
    fail "PyTorch version mismatch: expected 1.11.x, got ${TORCH_VER}"
    VERIFY_PASS=false
  fi
fi

CUDA_AVAIL=$("${PYTHON}" -c "import torch; print(torch.cuda.is_available())" 2>/dev/null || echo "False")
if [[ "${CUDA_AVAIL}" == "True" ]]; then
  GPU_NAME=$("${PYTHON}" -c "import torch; print(torch.cuda.get_device_name(0))" 2>/dev/null || echo "Unknown")
  success "CUDA available — GPU: ${GPU_NAME}"
else
  warn "CUDA not available (GPU may not be enabled in this Colab runtime)."
  warn "Go to Runtime > Change runtime type > T4 GPU and re-run."
  # Not a hard failure — environment is still correct.
fi

# ── 7c. MMCV ─────────────────────────────────────────────────────────────────
MMCV_VER=$("${PYTHON}" -c "import mmcv; print(mmcv.__version__)" 2>/dev/null || echo "NOT_FOUND")
if [[ "${MMCV_VER}" == 1.5.* ]]; then
  success "mmcv ${MMCV_VER}"
else
  fail "mmcv version mismatch: expected 1.5.x, got ${MMCV_VER}"
  VERIFY_PASS=false
fi

# ── 7d. MMDetection ───────────────────────────────────────────────────────────
MMDET_VER=$("${PYTHON}" -c "import mmdet; print(mmdet.__version__)" 2>/dev/null || echo "NOT_FOUND")
if [[ "${MMDET_VER}" == 2.25.* ]]; then
  success "mmdet ${MMDET_VER}"
else
  fail "mmdet version mismatch: expected 2.25.x, got ${MMDET_VER}"
  VERIFY_PASS=false
fi

# ── 7e. Supplementary imports ─────────────────────────────────────────────────
for mod in timm fairscale scipy einops tensorboard fvcore pycocotools; do
  if "${PYTHON}" -c "import ${mod}" 2>/dev/null; then
    success "${mod} importable"
  else
    fail "${mod} could NOT be imported"
    VERIFY_PASS=false
  fi
done

# ── 7f. Co-DETR import sanity check ──────────────────────────────────────────
if "${PYTHON}" -c "
import sys
sys.path.insert(0, '${CODETR_DIR}')
from mmdet.models import build_detector  # noqa: F401
" 2>/dev/null; then
  success "Co-DETR: mmdet.models.build_detector importable"
else
  warn "Co-DETR detector import failed (may be benign if Co-DETR is not fully set up)."
fi

# ──────────────────────────────────────────────────────────────────────────────
# Final Summary
# ──────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════${RESET}"
if [[ "${VERIFY_PASS}" == "true" ]]; then
  echo -e "${GREEN}${BOLD}  ✅  Co-DETR environment setup SUCCEEDED${RESET}"
  echo ""
  echo -e "  ${CYAN}Conda env  :${RESET} ${ENV_NAME}"
  echo -e "  ${CYAN}Python     :${RESET} ${PY_VER:-3.7.x}"
  echo -e "  ${CYAN}PyTorch    :${RESET} ${TORCH_VER:-1.11.0+cu113}"
  echo -e "  ${CYAN}MMCV       :${RESET} ${MMCV_VER}"
  echo -e "  ${CYAN}MMDetection:${RESET} ${MMDET_VER}"
  echo -e "  ${CYAN}Co-DETR    :${RESET} ${CODETR_DIR}"
  echo ""
  echo -e "  ${YELLOW}Next steps:${RESET}"
  echo -e "  • Mount your AI City 2024 Track 5 dataset from Google Drive."
  echo -e "  • Run: bash Smart-Helmet-Violation-Detection/data/validate_aicity.py"
  echo -e "  • Start training with the configs in configs/codetr/"
else
  echo -e "${RED}${BOLD}  ❌  Co-DETR environment setup FAILED${RESET}"
  echo ""
  echo -e "  One or more verification checks above failed."
  echo -e "  Review the [FAIL] lines above, fix the issue, and re-run this script."
fi
echo -e "${BOLD}══════════════════════════════════════════${RESET}"
echo ""
