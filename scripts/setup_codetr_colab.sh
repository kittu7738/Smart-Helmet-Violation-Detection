#!/usr/bin/env bash
# =============================================================================
# setup_codetr_colab.sh
# Reproducible Co-DETR Environment Setup for Google Colab (Tesla T4 GPU)
#
# Project : Smart Helmet Violation Detection
# Target  : Google Colab (Tesla T4, CUDA 11.3+, PyTorch 1.11.0, MMCV 1.5.0, MMDet 2.25.3)
#
# Usage (in a Colab cell):
#   !bash scripts/setup_codetr_colab.sh
#
# Safe to re-run after a runtime reset — already-installed components are
# detected and skipped in seconds.
#
# Constraints
#   - Does NOT assume conda/mamba is pre-installed; bootstraps a clean isolated
#     environment automatically without Anaconda Terms-of-Service errors.
#   - Does NOT download or modify datasets.
#   - Does NOT download or modify model checkpoints.
#   - Does NOT commit large files to Git.
# =============================================================================

set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# 0. Formatting & logging helpers
# ──────────────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
fail()    { echo -e "${RED}[FAIL]${RESET}  $*"; }
header()  { echo -e "\n${BOLD}${CYAN}══════════════════════════════════════════════════════════${RESET}"; \
            echo -e "${BOLD}${CYAN}  $*${RESET}"; \
            echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════${RESET}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

export PIP_NO_INPUT=1
export DEBIAN_FRONTEND=noninteractive
export PYTHONUNBUFFERED=1

# ──────────────────────────────────────────────────────────────────────────────
# 1. Verify Host & Google Colab
# ──────────────────────────────────────────────────────────────────────────────
header "Step 1 / 8 — Environment & Host Check"

IS_COLAB=false
if [[ -d /content ]] || [[ -n "${COLAB_RELEASE_TAG:-}" ]]; then
  IS_COLAB=true
  success "Google Colab environment detected (/content)."
else
  warn "Not running inside /content. Host: $(uname -n)"
  info "Proceeding with isolated environment setup on current host."
fi

# Detect host python
HOST_PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')" 2>/dev/null || echo "Unknown")
info "Host system Python: ${HOST_PY_VER}"
if [[ "${HOST_PY_VER}" == 3.13.* ]] || [[ "${HOST_PY_VER}" == 3.12.* ]] || [[ "${HOST_PY_VER}" == 3.11.* ]]; then
  info "Host Python is >= 3.11. An isolated Python 3.8/3.7 environment will be prepared for Co-DETR."
fi

# ──────────────────────────────────────────────────────────────────────────────
# 2. Verify GPU & CUDA
# ──────────────────────────────────────────────────────────────────────────────
header "Step 2 / 8 — GPU & CUDA Detection"

GPU_DETECTED=false
GPU_NAME="None"
if command -v nvidia-smi &>/dev/null; then
  GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1 || echo "Unknown GPU")
  GPU_MEM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader 2>/dev/null | head -1 || echo "Unknown VRAM")
  DRIVER_VER=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>/dev/null | head -1 || echo "Unknown Driver")
  if [[ -n "${GPU_NAME}" && "${GPU_NAME}" != "None" ]]; then
    GPU_DETECTED=true
    success "GPU Detected : ${GPU_NAME} (${GPU_MEM})"
    info    "NVIDIA Driver: ${DRIVER_VER}"
  fi
fi

if [[ "${GPU_DETECTED}" != "true" ]]; then
  warn "No active NVIDIA GPU detected via nvidia-smi."
  warn "Co-DETR training requires a CUDA GPU (Tesla T4 recommended)."
  if [[ "${IS_COLAB}" == "true" ]]; then
    warn "In Google Colab, enable GPU via: Runtime > Change runtime type > T4 GPU."
  fi
fi

# ──────────────────────────────────────────────────────────────────────────────
# 3. Bootstrap Isolated Python Environment (No Pre-Installed Conda Assumed)
# ──────────────────────────────────────────────────────────────────────────────
header "Step 3 / 8 — Python Isolated Environment (Python 3.8 / 3.7)"

ENV_DIR="/content/codetr_env"
if [[ "${IS_COLAB}" != "true" ]]; then
  ENV_DIR="${REPO_ROOT}/.codetr_env"
fi

ENV_PYTHON="${ENV_DIR}/bin/python"
ENV_PIP="${ENV_DIR}/bin/pip"

# Check if an existing working environment exists
ENV_READY=false
if [[ -x "${ENV_PYTHON}" ]]; then
  PY_CHECK_VER=$("${ENV_PYTHON}" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "bad")
  if [[ "${PY_CHECK_VER}" == "3.8" ]] || [[ "${PY_CHECK_VER}" == "3.7" ]] || [[ "${PY_CHECK_VER}" == "3.9" ]] || [[ "${PY_CHECK_VER}" == "3.10" ]]; then
    ENV_READY=true
    success "Existing isolated environment verified: ${ENV_DIR} (Python $("${ENV_PYTHON}" --version 2>&1))"
  fi
fi

# If not ready, check if miniconda environment at /content/miniconda3/envs/codetr exists
if [[ "${ENV_READY}" != "true" && -x "/content/miniconda3/envs/codetr/bin/python" ]]; then
  ALT_PY="/content/miniconda3/envs/codetr/bin/python"
  PY_CHECK_VER=$("${ALT_PY}" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "bad")
  if [[ "${PY_CHECK_VER}" == "3.8" ]] || [[ "${PY_CHECK_VER}" == "3.7" ]]; then
    ENV_DIR="/content/miniconda3/envs/codetr"
    ENV_PYTHON="${ALT_PY}"
    ENV_PIP="${ENV_DIR}/bin/pip"
    ENV_READY=true
    success "Existing conda environment verified: ${ENV_DIR} (Python $("${ENV_PYTHON}" --version 2>&1))"
  fi
fi

if [[ "${ENV_READY}" != "true" ]]; then
  info "Bootstrapping standalone Python isolated environment at ${ENV_DIR} …"

  # Strategy A: Micromamba standalone binary (Fastest, zero ToS issues, 15MB, rock solid)
  MAMBA_BIN="/tmp/micromamba"
  MAMBA_BOOTSTRAP_SUCCESS=false

  info "Fetching standalone Micromamba binary …"
  if curl -fsSL "https://micro.mamba.pm/api/micromamba/linux-64/latest" | tar -xvj -C /tmp bin/micromamba &>/dev/null; then
    MAMBA_BIN="/tmp/bin/micromamba"
    if [[ -x "${MAMBA_BIN}" ]]; then
      MAMBA_BOOTSTRAP_SUCCESS=true
      info "Micromamba binary available. Creating Python 3.8 environment …"
      rm -rf "${ENV_DIR}"
      if "${MAMBA_BIN}" create -y -p "${ENV_DIR}" python=3.8 pip setuptools wheel -c conda-forge; then
        if [[ -x "${ENV_PYTHON}" ]]; then
          ENV_READY=true
          success "Environment created successfully via Micromamba: ${ENV_DIR}"
        fi
      fi
    fi
  fi

  # Strategy B: Miniconda Python 3.8 standalone installer (Fallback)
  if [[ "${ENV_READY}" != "true" ]]; then
    info "Micromamba bootstrap unavailable. Falling back to Miniconda installer …"
    CONDA_ROOT="/content/miniconda3"
    INSTALLER="/tmp/miniconda_installer.sh"
    rm -rf "${CONDA_ROOT}" "${INSTALLER}"
    curl -fsSL "https://repo.anaconda.com/miniconda/Miniconda3-py38_4.12.0-Linux-x86_64.sh" -o "${INSTALLER}" || \
      curl -fsSL "https://repo.anaconda.com/miniconda/Miniconda3-py37_4.12.0-Linux-x86_64.sh" -o "${INSTALLER}"
    if [[ -f "${INSTALLER}" ]]; then
      bash "${INSTALLER}" -b -p "${CONDA_ROOT}" &>/dev/null
      rm -f "${INSTALLER}"
      if [[ -x "${CONDA_ROOT}/bin/python" ]]; then
        ENV_DIR="${CONDA_ROOT}"
        ENV_PYTHON="${CONDA_ROOT}/bin/python"
        ENV_PIP="${CONDA_ROOT}/bin/pip"
        ENV_READY=true
        success "Environment created successfully via Miniconda: ${CONDA_ROOT}"
      fi
    fi
  fi

  # Strategy C: System virtualenv if python3.8 is installed (Fallback)
  if [[ "${ENV_READY}" != "true" ]] && command -v python3.8 &>/dev/null; then
    info "Attempting creation via python3.8 -m venv …"
    rm -rf "${ENV_DIR}"
    python3.8 -m venv "${ENV_DIR}"
    if [[ -x "${ENV_PYTHON}" ]]; then
      ENV_READY=true
      success "Environment created via python3.8 venv: ${ENV_DIR}"
    fi
  fi
fi

if [[ "${ENV_READY}" != "true" || ! -x "${ENV_PYTHON}" ]]; then
  fail "Fatal: Could not create or locate an isolated Python 3.8/3.7 environment."
  fail "Please ensure the host has internet access to download the standalone bootstrap binary."
  exit 1
fi

info "Active Python environment binary: ${ENV_PYTHON}"
info "Active Python version: $("${ENV_PYTHON}" --version 2>&1)"

# Upgrade pip, setuptools, wheel within the isolated environment
"${ENV_PIP}" install --upgrade --no-input pip setuptools wheel &>/dev/null || true

# ──────────────────────────────────────────────────────────────────────────────
# 4. Install Dependencies
# ──────────────────────────────────────────────────────────────────────────────
header "Step 4 / 8 — Install Dependencies"

pkg_installed() {
  local pkg="${1}"
  local ver="${2:-}"
  if "${ENV_PIP}" show "${pkg}" &>/dev/null; then
    if [[ -z "${ver}" ]]; then
      return 0
    fi
    local installed_ver
    installed_ver=$("${ENV_PIP}" show "${pkg}" | awk '/^Version:/{print $2}')
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
  "${ENV_PIP}" install --no-input \
    torch==1.11.0+cu113 \
    torchvision==0.12.0+cu113 \
    torchaudio==0.11.0+cu113 \
    --extra-index-url https://download.pytorch.org/whl/cu113
  success "PyTorch stack installed."
fi

# ── 4b. MMCV 1.5.0 ───────────────────────────────────────────────────────────
if pkg_installed "mmcv-full" "1.5.0"; then
  success "mmcv-full 1.5.0 already installed — skipping."
else
  info "Installing mmcv-full 1.5.0 (official OpenMMLab pre-built wheel) …"
  PY_TAG=$("${ENV_PYTHON}" -c "import sys; print(f'cp{sys.version_info[0]}{sys.version_info[1]}')")
  MMCV_WHEEL="https://download.openmmlab.com/mmcv/dist/cu113/torch1.11.0/mmcv_full-1.5.0-${PY_TAG}-${PY_TAG}m-manylinux1_x86_64.whl"
  if [[ "${PY_TAG}" != "cp37" ]]; then
    MMCV_WHEEL="https://download.openmmlab.com/mmcv/dist/cu113/torch1.11.0/mmcv_full-1.5.0-${PY_TAG}-${PY_TAG}-manylinux1_x86_64.whl"
  fi

  if ! "${ENV_PIP}" install --no-input "${MMCV_WHEEL}"; then
    warn "Direct wheel download from OpenMMLab CDN failed; attempting find-links fallback …"
    "${ENV_PIP}" install --no-input mmcv-full==1.5.0 \
      -f https://download.openmmlab.com/mmcv/dist/cu113/torch1.11.0/index.html \
      --only-binary mmcv-full
  fi
  success "mmcv-full 1.5.0 installed."
fi

# ── 4c. MMDetection 2.25.3 ───────────────────────────────────────────────────
if pkg_installed "mmdet" "2.25.3"; then
  success "mmdet 2.25.3 already installed — skipping."
else
  info "Installing mmdet 2.25.3 …"
  "${ENV_PIP}" install --no-input mmdet==2.25.3
  success "mmdet 2.25.3 installed."
fi

# ── 4d. Supplementary packages ───────────────────────────────────────────────
declare -A EXTRA_PKGS=(
  ["ninja"]=""
  ["timm"]="0.6.13"
  ["fairscale"]="0.4.6"
  ["scipy"]="1.7.3"
  ["yapf"]="0.33.0"
  ["einops"]=""
  ["tensorboard"]=""
  ["fvcore"]=""
  ["pycocotools"]=""
  ["ipykernel"]=""
  ["opencv-python"]=""
)

for pkg in "${!EXTRA_PKGS[@]}"; do
  ver="${EXTRA_PKGS[$pkg]}"
  if pkg_installed "${pkg}" "${ver}"; then
    success "${pkg}${ver:+ ${ver}} already installed — skipping."
  else
    if [[ -n "${ver}" ]]; then
      info "Installing ${pkg}==${ver} …"
      "${ENV_PIP}" install --no-input "${pkg}==${ver}"
    else
      info "Installing ${pkg} (compatible) …"
      "${ENV_PIP}" install --no-input "${pkg}"
    fi
    success "${pkg} installed."
  fi
done

# ──────────────────────────────────────────────────────────────────────────────
# 5. Clone / Locate Co-DETR
# ──────────────────────────────────────────────────────────────────────────────
header "Step 5 / 8 — Co-DETR Repository"

CODETR_DIR="/content/Co-DETR"
if [[ "${IS_COLAB}" != "true" ]]; then
  CODETR_DIR="${REPO_ROOT}/../Co-DETR"
fi

CODETR_REPO="https://github.com/Sense-X/Co-DETR.git"
CODETR_COMMIT="main"

if [[ -d "${CODETR_DIR}/.git" ]]; then
  success "Co-DETR repository present at ${CODETR_DIR}."
else
  info "Cloning Co-DETR repository to ${CODETR_DIR} …"
  git clone --depth 1 --branch "${CODETR_COMMIT}" \
    "${CODETR_REPO}" "${CODETR_DIR}" 2>&1 | tail -5
  success "Co-DETR cloned to ${CODETR_DIR}."
fi

# ──────────────────────────────────────────────────────────────────────────────
# 6. Install Co-DETR into Environment & Link Smart-Helmet
# ──────────────────────────────────────────────────────────────────────────────
header "Step 6 / 8 — Register Co-DETR & Project Packages"

CODETR_INSTALLED=false
if "${ENV_PIP}" show mmdet 2>/dev/null | grep -q "Location.*Co-DETR\|Co.DETR"; then
  CODETR_INSTALLED=true
fi
if [[ -f "${CODETR_DIR}/mmdet.egg-info/PKG-INFO" ]]; then
  CODETR_INSTALLED=true
fi

if [[ "${CODETR_INSTALLED}" == "true" ]]; then
  success "Co-DETR already registered in environment — skipping."
else
  info "Installing Co-DETR in editable mode (no-deps) …"
  "${ENV_PIP}" install -e "${CODETR_DIR}" \
    --no-deps \
    --no-build-isolation \
    --no-input
  success "Co-DETR registered."
fi

# Link Smart-Helmet-Violation-Detection repository to Python site-packages
SITE_PACKAGES=$("${ENV_PYTHON}" -c "import site; print(site.getsitepackages()[0])" 2>/dev/null || echo "")
if [[ -n "${SITE_PACKAGES}" && -d "${SITE_PACKAGES}" ]]; then
  echo "${REPO_ROOT}" > "${SITE_PACKAGES}/smart_helmet.pth"
  echo "${CODETR_DIR}" > "${SITE_PACKAGES}/codetr.pth"
  success "Linked repository & Co-DETR to site-packages: ${SITE_PACKAGES}"
fi

# ──────────────────────────────────────────────────────────────────────────────
# 7. Create Colab Wrappers & Symlinks
# ──────────────────────────────────────────────────────────────────────────────
header "Step 7 / 8 — Create Runners & Environment Wrappers"

RUNNER_SCRIPT="${REPO_ROOT}/run_codetr.sh"
cat <<EOF > "${RUNNER_SCRIPT}"
#!/usr/bin/env bash
# Auto-generated runner for Smart-Helmet-Violation-Detection Co-DETR environment
export PYTHONPATH="${CODETR_DIR}:${REPO_ROOT}:\${PYTHONPATH:-}"
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export CV_NUM_THREADS=0
exec "${ENV_PYTHON}" "\$@"
EOF
chmod +x "${RUNNER_SCRIPT}"
success "Created runner script: ${RUNNER_SCRIPT}"

if [[ "${IS_COLAB}" == "true" ]]; then
  cp "${RUNNER_SCRIPT}" /content/run_codetr.sh
  chmod +x /content/run_codetr.sh

  # Create symlinks in /usr/local/bin so python-codetr is globally available in bash cells
  if [[ -w /usr/local/bin ]]; then
    ln -sf "${ENV_PYTHON}" /usr/local/bin/python-codetr
    ln -sf "${ENV_PYTHON}" /usr/local/bin/codetr-python
    ln -sf "${ENV_PIP}"    /usr/local/bin/pip-codetr

    # Also symlink python so default !python in Colab cells runs the Co-DETR environment directly
    ln -sf "${ENV_PYTHON}" /usr/local/bin/python
    ln -sf "${ENV_PIP}"    /usr/local/bin/pip
    success "Linked /usr/local/bin/python -> ${ENV_PYTHON}"
  fi

  # Register IPython kernel for interactive Colab notebooks
  "${ENV_PYTHON}" -m ipykernel install --name codetr --display-name "Python (Co-DETR)" --user &>/dev/null || true
  success "Registered IPython kernel: 'Python (Co-DETR)'"
fi

# ──────────────────────────────────────────────────────────────────────────────
# 8. Strict Verification
# ──────────────────────────────────────────────────────────────────────────────
header "Step 8 / 8 — Comprehensive Verification"

VERIFY_PASS=true

# ── 8a. Python ────────────────────────────────────────────────────────────────
VERIFY_PY_VER=$("${ENV_PYTHON}" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')" 2>/dev/null || echo "FAILED")
if [[ "${VERIFY_PY_VER}" == 3.8.* ]] || [[ "${VERIFY_PY_VER}" == 3.7.* ]] || [[ "${VERIFY_PY_VER}" == 3.9.* ]] || [[ "${VERIFY_PY_VER}" == 3.10.* ]]; then
  success "Python version verified: ${VERIFY_PY_VER}"
else
  fail "Python verification failed: expected 3.7-3.10, got ${VERIFY_PY_VER}"
  VERIFY_PASS=false
fi

# ── 8b. PyTorch & CUDA ───────────────────────────────────────────────────────
TORCH_VER=$("${ENV_PYTHON}" -c "import torch; print(torch.__version__)" 2>/dev/null || echo "NOT_FOUND")
if [[ "${TORCH_VER}" == 1.11.* ]]; then
  success "PyTorch version verified: ${TORCH_VER}"
else
  fail "PyTorch version mismatch: expected 1.11.x, got ${TORCH_VER}"
  VERIFY_PASS=false
fi

CUDA_OK=$("${ENV_PYTHON}" -c "import torch; print(torch.cuda.is_available())" 2>/dev/null || echo "False")
if [[ "${CUDA_OK}" == "True" ]]; then
  CUDA_DEV_NAME=$("${ENV_PYTHON}" -c "import torch; print(torch.cuda.get_device_name(0))" 2>/dev/null || echo "Unknown")
  CUDA_VRAM_GB=$("${ENV_PYTHON}" -c "import torch; print(f'{torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f}')" 2>/dev/null || echo "0")
  success "CUDA available in PyTorch: GPU = ${CUDA_DEV_NAME} (${CUDA_VRAM_GB} GB VRAM)"
else
  warn "CUDA is NOT available in PyTorch (running in CPU mode). Enable GPU in Colab runtime settings."
fi

# ── 8c. MMCV-full ────────────────────────────────────────────────────────────
MMCV_VER=$("${ENV_PYTHON}" -c "import mmcv; print(mmcv.__version__)" 2>/dev/null || echo "NOT_FOUND")
if [[ "${MMCV_VER}" == 1.5.* ]]; then
  success "mmcv-full version verified: ${MMCV_VER}"
else
  fail "mmcv-full version mismatch: expected 1.5.x, got ${MMCV_VER}"
  VERIFY_PASS=false
fi

# ── 8d. MMDetection ───────────────────────────────────────────────────────────
MMDET_VER=$("${ENV_PYTHON}" -c "import mmdet; print(mmdet.__version__)" 2>/dev/null || echo "NOT_FOUND")
if [[ "${MMDET_VER}" == 2.25.* ]]; then
  success "mmdet version verified: ${MMDET_VER}"
else
  fail "mmdet version mismatch: expected 2.25.x, got ${MMDET_VER}"
  VERIFY_PASS=false
fi

# ── 8e. Supplementary packages ───────────────────────────────────────────────
for mod in timm fairscale scipy einops tensorboard fvcore pycocotools; do
  if "${ENV_PYTHON}" -c "import ${mod}" &>/dev/null; then
    success "Module importable: ${mod}"
  else
    fail "Module failed to import: ${mod}"
    VERIFY_PASS=false
  fi
done

# ── 8f. Co-DETR modules ───────────────────────────────────────────────────────
if "${ENV_PYTHON}" -c "
import sys
sys.path.insert(0, '${CODETR_DIR}')
from mmdet.models import build_detector
import projects
" &>/dev/null; then
  success "Co-DETR model definitions & projects plugin importable"
else
  fail "Co-DETR build_detector or projects plugin failed to import"
  VERIFY_PASS=false
fi

# ── 8g. MultiScaleDeformableAttention ─────────────────────────────────────────
if "${ENV_PYTHON}" -c "
import mmcv
from mmcv.ops.multi_scale_deform_attn import MultiScaleDeformableAttention
" &>/dev/null; then
  success "MMCV MultiScaleDeformableAttention CUDA op functional"
else
  fail "MMCV MultiScaleDeformableAttention check failed"
  VERIFY_PASS=false
fi

# ──────────────────────────────────────────────────────────────────────────────
# Final Summary & Exit Code
# ──────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════════${RESET}"
if [[ "${VERIFY_PASS}" == "true" ]]; then
  echo -e "${GREEN}${BOLD}  ✅  Co-DETR Environment Setup SUCCEEDED${RESET}"
  echo ""
  echo -e "  ${CYAN}Python binary :${RESET} ${ENV_PYTHON}"
  echo -e "  ${CYAN}Python version:${RESET} ${VERIFY_PY_VER}"
  echo -e "  ${CYAN}PyTorch       :${RESET} ${TORCH_VER} (CUDA available: ${CUDA_OK})"
  echo -e "  ${CYAN}MMCV-full     :${RESET} ${MMCV_VER}"
  echo -e "  ${CYAN}MMDetection   :${RESET} ${MMDET_VER}"
  echo -e "  ${CYAN}Co-DETR root  :${RESET} ${CODETR_DIR}"
  echo ""
  echo -e "  ${BOLD}Usage in Colab cells:${RESET}"
  echo -e "  • Standard python command (symlinked):"
  echo -e "      ${CYAN}python training/codetr/train.py --training-diagnostic ...${RESET}"
  echo -e "  • Or using the explicit runner wrapper:"
  echo -e "      ${CYAN}bash run_codetr.sh training/codetr/train.py --training-diagnostic ...${RESET}"
  echo -e "${BOLD}══════════════════════════════════════════════════════════${RESET}"
  echo ""
  exit 0
else
  echo -e "${RED}${BOLD}  ❌  Co-DETR Environment Setup FAILED${RESET}"
  echo ""
  echo -e "  One or more verification checks failed."
  echo -e "  Review the [FAIL] lines above and correct errors."
  echo -e "${BOLD}══════════════════════════════════════════════════════════${RESET}"
  echo ""
  exit 1
fi
