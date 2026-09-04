# Utility Scripts — Paper Reproduction

This directory contains standalone execution and automation scripts for
environment setup, dataset verification, and benchmark evaluation.

---

## `setup_codetr_colab.sh`

**Reproducible Google Colab environment setup for Co-DETR.**

| Field         | Value                                 |
|:--------------|:--------------------------------------|
| Target runtime| Google Colab (NVIDIA Tesla T4 GPU)    |
| Python        | 3.7.11 (conda-managed)               |
| PyTorch       | 1.11.0+cu113                          |
| MMCV          | 1.5.0                                 |
| MMDetection   | 2.25.3                                |

### Quick usage (paste into a Colab cell)

```bash
# 1. Clone the project
!git clone https://github.com/kittu7738/Smart-Helmet-Violation-Detection.git

# 2. Run the setup
!bash Smart-Helmet-Violation-Detection/scripts/setup_codetr_colab.sh
```

See [`docs/colab_codetr_setup.md`](../docs/colab_codetr_setup.md) for the
full step-by-step guide, Google Drive persistence instructions, and
troubleshooting tips.

### What the script does

1. Verifies execution inside Google Colab.
2. Installs Miniconda at `/content/miniconda3` (skips if present).
3. Creates the `codetr` conda environment with Python 3.7.11 (skips if present).
4. Installs all required packages — PyTorch, MMCV, MMDetection, timm, fairscale,
   scipy, fvcore, tensorboard, einops, pycocotools — skipping already-installed ones.
5. Clones `Sense-X/Co-DETR` to `/content/Co-DETR` (skips if present).
6. Installs Co-DETR in editable mode without modifying the upstream repository.
7. Verifies every component and prints a ✅ / ❌ summary.

### Constraints

- Does **not** download datasets.
- Does **not** download model checkpoints.
- Does **not** modify the upstream Co-DETR repository.
- Does **not** hard-code personal paths.
- Safe to re-run multiple times after a runtime reset.
