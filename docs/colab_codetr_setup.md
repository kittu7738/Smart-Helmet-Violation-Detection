# Google Colab Setup & Instructions — Paper Reproduction (Co-DETR)

This document provides guidelines for the upcoming Phase 2 model training on Google Colab with an **NVIDIA Tesla T4 GPU**.

---

## 1. Overview & Phased Implementation

- **Phase 1 (Current)**: Dataset inspection, validation, and preparation for AI City Challenge 2024 Track 5. **Training has NOT been implemented in this phase.**
- **Phase 2 (Upcoming)**: Co-DETR model setup, configuration, and training using the NVIDIA Tesla T4 GPU on Colab.
- **Mac Role**: Local development, code verification, dataset preparation validation, and application testing. No heavy model training on Mac.

---

## 2. Planned Colab Execution Workflow (Phase 2)

When Phase 2 begins:

1. **Colab Runtime Selection**:
   - In Google Colab: Select **Runtime > Change runtime type > T4 GPU**.
   - Verify GPU with `!nvidia-smi`.

2. **Repository Cloning**:
   ```bash
   !git clone https://github.com/kittu7738/Smart-Helmet-Violation-Detection.git
   %cd Smart-Helmet-Violation-Detection
   ```

3. **Dataset Mounting**:
   - The AI City Challenge 2024 Track 5 dataset must be mounted separately (e.g. from Google Drive or uploaded to Colab `/content/aicity2024_track5`).
   - Run validation before training:
     ```bash
     !python data/validate_aicity.py --dataset /content/aicity2024_track5
     ```

4. **Package Installation**:
   - Only framework dependencies required by Co-DETR / MMDetection will be installed in the Colab runtime when Phase 2 starts. Do not pre-install unneeded packages.

---

## 3. Preservation of Existing YOLOv8 Baseline

The existing YOLOv8 baseline (configured under `src/train.py`, `src/evaluate.py`, and `models/yolov8n.pt`) remains fully intact and available in this repository for comparative evaluation.
