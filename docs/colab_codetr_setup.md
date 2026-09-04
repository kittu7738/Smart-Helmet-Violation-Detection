# Google Colab Setup — Co-DETR Environment

**Script**: [`scripts/setup_codetr_colab.sh`](../scripts/setup_codetr_colab.sh)

This document explains how to reproduce the verified Co-DETR environment
in Google Colab after every runtime reset (runtime resets wipe `/content`).

---

## Verified Environment Specification

| Component          | Version            |
|:-------------------|:-------------------|
| Python             | 3.7.11             |
| PyTorch            | 1.11.0+cu113       |
| torchvision        | 0.12.0+cu113       |
| torchaudio         | 0.11.0+cu113       |
| MMCV               | 1.5.0              |
| MMDetection        | 2.25.3             |
| timm               | 0.6.13             |
| fairscale          | 0.4.6              |
| scipy              | 1.7.3              |
| fvcore             | latest compatible  |
| tensorboard        | latest compatible  |
| einops             | latest compatible  |
| pycocotools        | latest compatible  |
| GPU target         | NVIDIA Tesla T4    |
| CUDA               | 11.3               |

---

## Before You Start (One-Time Steps)

1. **Select a GPU runtime** in Colab:
   `Runtime → Change runtime type → Hardware accelerator → T4 GPU`
2. **Verify GPU** (optional sanity check):
   ```
   !nvidia-smi
   ```

---

## After Every Runtime Reset — Quick Start (3 cells)

Paste these three cells into a Colab notebook and run them in order.

### Cell 1 — Clone the project repository

```python
# Clone Smart-Helmet-Violation-Detection (skip if already cloned this session)
import os
if not os.path.isdir("/content/Smart-Helmet-Violation-Detection"):
    !git clone https://github.com/kittu7738/Smart-Helmet-Violation-Detection.git
else:
    print("Repo already cloned — skipping.")
```

### Cell 2 — Run the environment setup script

```python
%%bash
bash /content/Smart-Helmet-Violation-Detection/scripts/setup_codetr_colab.sh 2>&1
```

> **Expected runtime** (cold start, no caches): ~10–15 minutes on a T4 runtime.  
> **Expected runtime** (warm restart, conda env cached to Drive): ~2–3 minutes.

The script will print a final ✅ or ❌ summary. Only proceed if you see ✅.

### Cell 3 — Activate the conda environment in Jupyter

```python
import subprocess, sys, os

CONDA_ROOT = "/content/miniconda3"
ENV_NAME   = "codetr"
ENV_PYTHON = f"{CONDA_ROOT}/envs/{ENV_NAME}/bin/python"

# Add Co-DETR and the conda env site-packages to sys.path
result = subprocess.run(
    [ENV_PYTHON, "-c",
     "import sys; print(':'.join(sys.path))"],
    capture_output=True, text=True
)
for p in result.stdout.strip().split(":"):
    if p and p not in sys.path:
        sys.path.insert(0, p)

os.environ["PYTHONPATH"] = "/content/Co-DETR:" + os.environ.get("PYTHONPATH", "")

# Quick sanity check
import torch, mmcv, mmdet
print(f"PyTorch   : {torch.__version__}")
print(f"CUDA avail: {torch.cuda.is_available()}")
print(f"MMCV      : {mmcv.__version__}")
print(f"MMDet     : {mmdet.__version__}")
```

---

## Persisting the Environment Across Sessions (Optional — Recommended)

Colab runtime resets wipe `/content`.  
To avoid re-installing everything each time, mount Google Drive and symlink
the conda environment:

```python
# Cell A — Mount Drive
from google.colab import drive
drive.mount("/content/drive")
```

```bash
# Cell B — Symlink the conda env to Drive (run once, then re-link on reset)
%%bash
DRIVE_CONDA="/content/drive/MyDrive/colab_envs/miniconda3"
LOCAL_CONDA="/content/miniconda3"

if [ ! -d "${DRIVE_CONDA}" ]; then
  # First time: move the freshly-built env to Drive
  mv "${LOCAL_CONDA}" "${DRIVE_CONDA}"
fi

# Re-link on every reset
if [ ! -L "${LOCAL_CONDA}" ]; then
  ln -s "${DRIVE_CONDA}" "${LOCAL_CONDA}"
fi
echo "Symlink ready: ${LOCAL_CONDA} -> ${DRIVE_CONDA}"
```

---

## What the Script Does (Summary)

| Step | Action | Idempotent? |
|:----:|:-------|:-----------:|
| 1 | Detects Google Colab (`/content` + `google.colab` package) | ✅ |
| 2 | Installs Miniconda at `/content/miniconda3` if absent | ✅ |
| 3 | Creates `codetr` conda env with Python 3.7.11 if absent | ✅ |
| 4 | Installs PyTorch 1.11+cu113, MMCV 1.5, MMDet 2.25.3, timm, … | ✅ |
| 5 | Clones `Sense-X/Co-DETR` to `/content/Co-DETR` if absent | ✅ |
| 6 | Installs Co-DETR in editable mode (no repo modifications) | ✅ |
| 7 | Verifies PyTorch, CUDA, MMCV, MMDetection, GPU; prints summary | ✅ |

---

## Troubleshooting

| Symptom | Fix |
|:--------|:----|
| `❌ CUDA not available` | Runtime has no GPU. Change runtime type to T4 GPU. |
| `pip install mmcv-full` hangs | Colab throttling. Re-run the script; it will skip already-installed packages. |
| `ModuleNotFoundError: mmdet` | Step 6 failed. Check the FAIL lines and re-run the script. |
| Script fails on first run | Network issue. Re-run — all steps are idempotent and will resume. |
| `google.colab not found` | Script is not running in Colab. This script is Colab-only. |

---

## Constraints

- ❌ Does **not** download or commit datasets  
- ❌ Does **not** download model checkpoints  
- ❌ Does **not** modify the upstream Co-DETR repository  
- ❌ Does **not** use hard-coded personal paths  
- ✅ Safe to re-run multiple times without side effects  
