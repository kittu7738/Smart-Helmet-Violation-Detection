# Google Colab Setup — Co-DETR Environment & Training Guide

**Setup Script**: [`scripts/setup_codetr_colab.sh`](../scripts/setup_codetr_colab.sh)  
**Runner Wrapper**: [`run_codetr.sh`](../run_codetr.sh)  
**Dataset Validator**: [`data/validate_dataset.py`](../data/validate_dataset.py)  

This guide provides the complete, verified workflow for setting up and running the Smart Helmet Violation Detection Co-DETR pipeline on Google Colab (Tesla T4 GPU).

---

## 1. Verified Environment Specification

| Component          | Specification                                    |
|:-------------------|:-------------------------------------------------|
| Python             | 3.8.x / 3.7.x (isolated environment)             |
| PyTorch            | 1.11.0+cu113                                     |
| Torchvision        | 0.12.0+cu113                                     |
| MMCV               | 1.5.0 (official OpenMMLab prebuilt CUDA wheel)   |
| MMDetection        | 2.25.3                                           |
| timm               | 0.6.13                                           |
| fairscale          | 0.4.6                                            |
| scipy              | 1.7.3                                            |
| Hardware Target    | NVIDIA Tesla T4 (16 GB VRAM)                     |
| CUDA               | 11.3+                                            |

> [!NOTE]
> Modern Google Colab runtimes default to Python 3.13. MMCV 1.x and Co-DETR require Python 3.7–3.10. `setup_codetr_colab.sh` automatically bootstraps an isolated, reproducible environment at `/content/codetr_env` without assuming conda is pre-installed.

---

## 2. Before You Start

In Google Colab:
1. Ensure GPU is enabled: `Runtime → Change runtime type → Hardware accelerator → T4 GPU`.
2. Mount Google Drive:
   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   ```

---

## 3. Quick Start (Cell by Cell)

### Cell 1 — Clone or Update the Repository
```bash
%%bash
if [ ! -d "/content/Smart-Helmet-Violation-Detection" ]; then
  git clone https://github.com/kittu7738/Smart-Helmet-Violation-Detection.git /content/Smart-Helmet-Violation-Detection
fi
cd /content/Smart-Helmet-Violation-Detection
git pull origin main
```

### Cell 2 — Run Environment Bootstrap
```bash
%%bash
bash /content/Smart-Helmet-Violation-Detection/scripts/setup_codetr_colab.sh
```
> The script will:
> - Detect Colab and Tesla T4.
> - Bootstrap a standalone Python 3.8 isolated environment at `/content/codetr_env`.
> - Install PyTorch 1.11.0+cu113, MMCV-full 1.5.0, MMDetection 2.25.3, timm, fairscale.
> - Clone & install Co-DETR.
> - Create symlinks so standard `python` and `run_codetr.sh` invoke the Co-DETR environment directly.
> - Exit `0` on complete success or `1` with explicit error diagnostics if any check fails.

### Cell 3 — Validate the Dataset (Integrity & 'vaid' Structure)
```bash
%%bash
cd /content/Smart-Helmet-Violation-Detection
bash run_codetr.sh data/validate_dataset.py \
  --data-root /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data
```
> Checks:
> - Train split (366 images)
> - Validation split (65 images in intentional `vaid/images/` directory)
> - Test split (52 images)
> - Bounding box sanity ($x \ge 0, y \ge 0, w > 0, h > 0$, no negative coords)
> - Category consistency across all 7 target classes.

### Cell 4 — Run Training Diagnostic (~20 Seconds)
```bash
%%bash
cd /content/Smart-Helmet-Violation-Detection
bash run_codetr.sh training/codetr/train.py \
  --config configs/codetr/helmet_codetr_swin_large.py \
  --work-dir /content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_codetr_swin_large_v2 \
  --data-root /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data \
  --training-diagnostic
```
> Proves end-to-end readiness:
> - Stages dataset to local fast NVMe SSD (`/content/dataset_local`).
> - Locates local Swin-L pretrained backbone.
> - Retrieves batch 1 from DataLoader with `workers_per_gpu = 0` (no fork deadlocks).
> - Executes iteration 1 forward pass, loss calculation, backward pass, and logs peak GPU VRAM.
> - Terminates with `TRAINING DIAGNOSTIC PASSED`.

### Cell 5 — Launch Controlled 2-Epoch Pilot Run
```bash
%%bash
cd /content/Smart-Helmet-Violation-Detection
bash run_codetr.sh training/codetr/train.py \
  --config configs/codetr/helmet_codetr_swin_large.py \
  --work-dir /content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_codetr_swin_large_pilot2 \
  --data-root /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data \
  --max-epochs 2 \
  --log-interval 10
```
> - Overrides `max_epochs` to 2 via CLI without touching baseline config.
> - Preserves `workers_per_gpu = 0` and local staging to `/content/dataset_local`.
> - Emits liveness heartbeats for warmup iterations 1, 2, and 3 immediately upon completion.
> - Streams regular training progress every 10 iterations.
> - Runs validation at the end of each epoch and preserves checkpoints on Google Drive:
>   `epoch_1.pth`, `epoch_2.pth`, and `best_bbox_mAP_*.pth`.

### Cell 6 — Evaluate Pilot Checkpoint on Validation Split
```bash
%%bash
cd /content/Smart-Helmet-Violation-Detection
bash run_codetr.sh evaluation/codetr/evaluate.py \
  --config configs/codetr/helmet_codetr_swin_large.py \
  --work-dir /content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_codetr_swin_large_pilot2 \
  --data-root /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data \
  --split val
```
> - Computes full COCO metrics: mAP, AP50, AP75, and per-class AP for all 7 classes.
> - Informs the decision on whether to proceed to 4, 6, or 12 epochs.

### Cell 7 — (Optional) Resume / Extend Training
```bash
%%bash
cd /content/Smart-Helmet-Violation-Detection
bash run_codetr.sh training/codetr/train.py \
  --config configs/codetr/helmet_codetr_swin_large.py \
  --work-dir /content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_codetr_swin_large_pilot2 \
  --data-root /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data \
  --resume-from /content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_codetr_swin_large_pilot2/epoch_2.pth \
  --max-epochs 4 \
  --log-interval 10
```

---

## 4. Fast Experimental Training (Rapid Iteration on Tesla T4)

For rapid experimentation, hyperparameter tuning, and swift train-evaluate cycles:

| Model | Architecture | Backbone | Params | Precision | Batch | Speed / Epoch |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fast Experimental** | Faster R-CNN FPN | ResNet-50 | 41.5M | FP16 (AMP) | 4 | **~8–10 sec** |
| **Fast Co-DETR** | Co-DETR (300 queries) | ResNet-50 | ~54M | FP16 (AMP) | 2 | **~35–45 sec** |
| **Baseline Production** | Co-DINO (900 queries) | Swin-Large | 234.8M | FP32 | 1 | **~550 sec (~9 min)** |

### Fast Smoke Test (1 Epoch, ~10 seconds)
```bash
%%bash
cd /content/Smart-Helmet-Violation-Detection
bash run_codetr.sh training/codetr/train.py \
  --config configs/faster_rcnn/helmet_faster_rcnn_r50_fpn.py \
  --work-dir /content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_faster_rcnn_smoke \
  --data-root /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data \
  --max-epochs 1 \
  --log-interval 10
```

### Fast Controlled Experiment (2 Epochs, ~20 seconds)
```bash
%%bash
cd /content/Smart-Helmet-Violation-Detection
bash run_codetr.sh training/codetr/train.py \
  --config configs/faster_rcnn/helmet_faster_rcnn_r50_fpn.py \
  --work-dir /content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_faster_rcnn_exp1 \
  --data-root /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data \
  --max-epochs 2 \
  --log-interval 10
```

### Fast Validation Evaluation
```bash
%%bash
cd /content/Smart-Helmet-Violation-Detection
bash run_codetr.sh evaluation/codetr/evaluate.py \
  --config configs/faster_rcnn/helmet_faster_rcnn_r50_fpn.py \
  --work-dir /content/drive/MyDrive/Smart-Helmet-Violation-Detection/work_dirs/helmet_faster_rcnn_exp1 \
  --data-root /content/drive/MyDrive/Smart-Helmet-Violation-Detection/data \
  --split val
```

---

## 5. Troubleshooting

| Symptom | Cause | Solution |
|:---|:---|:---|
| `No module named 'mmcv'` | Executing with host Python 3.13 instead of Co-DETR environment | Run with `bash run_codetr.sh ...` or `/content/codetr_env/bin/python ...`. |
| `CUDA not available` | CPU runtime active | Change runtime type in Colab: `Runtime → Change runtime type → T4 GPU`. |
| DataLoader hang before iteration 1 | Multiprocessing fork deadlock with OpenCV | Default `workers_per_gpu = 0` is already enforced. If overridden, set `--workers-per-gpu 0`. |
| Swin-L backbone downloading slowly | Google Drive cache not found | The script downloads Swin-L with progress and automatically caches it to Drive for future sessions. |
