# Google Colab Helmet Training Workflow

This workflow executes YOLOv8n fine-tuning and holdout test evaluation for the Smart Helmet Violation Detection System in Google Colab on a **Tesla T4 GPU**.

---

## 1. Configure Colab GPU Runtime

In Google Colab, select **Runtime > Change runtime type > T4 GPU**, then verify GPU availability:

```python
!nvidia-smi
```

Ensure a CUDA-capable GPU (Tesla T4) is allocated.

---

## 2. Install Required Dependencies

```python
!pip install -q -U ultralytics roboflow pyyaml matplotlib opencv-python

import ultralytics
import torch
print("Ultralytics version:", ultralytics.__version__)
print("PyTorch version:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("Device name:", torch.cuda.get_device_name(0))
```

---

## 3. Clone Repository

```python
!git clone https://github.com/kittu7738/Smart-Helmet-Violation-Detection.git
%cd Smart-Helmet-Violation-Detection
```

---

## 4. Dataset Verification & Inspection

Confirm the downloaded dataset path and verified split statistics:
- **Dataset Path**: `/content/edgevision_dataset/EdgeVision-Dataset/data.yaml`
- **Classes**:
  - `0`: `helmet`
  - `1`: `no helmet`
- **Confirmed Split Counts**:
  - **Train**: 1,110 images, 1,110 labels (1,554 helmet, 744 no-helmet, 2,298 total annotations)
  - **Validation**: 105 images, 105 labels (147 helmet, 81 no-helmet, 228 total annotations)
  - **Test (Holdout)**: 53 images, 53 labels (64 helmet, 29 no-helmet, 93 total annotations)

```python
from pathlib import Path
import yaml

DATA_YAML = "/content/edgevision_dataset/EdgeVision-Dataset/data.yaml"
with open(DATA_YAML, "r") as f:
    data_cfg = yaml.safe_load(f)

print("data.yaml config:", data_cfg)
```

---

## 5. Train YOLOv8n on Tesla T4 GPU

Execute training for 50 epochs with batch size 16 on GPU device 0:

```python
from ultralytics import YOLO

model = YOLO("yolov8n.pt")

results = model.train(
    data="/content/edgevision_dataset/EdgeVision-Dataset/data.yaml",
    epochs=50,
    imgsz=640,
    batch=16,
    device=0,
    seed=42,
    project="/content/Smart-Helmet-Violation-Detection/runs/detect",
    name="helmet_training",
    verbose=True,
    save=True,
    plots=True
)
```

---

## 6. Validate & Evaluate on Unseen Test Split

```python
from src.evaluate import evaluate_helmet_model

best_weights = "/content/Smart-Helmet-Violation-Detection/runs/detect/helmet_training/weights/best.pt"

eval_metrics = evaluate_helmet_model(
    model_path=best_weights,
    data_yaml="/content/edgevision_dataset/EdgeVision-Dataset/data.yaml",
    imgsz=640,
    conf_threshold=0.25,
    device="0",
    save_predictions=True
)
```

---

## 7. Display Holdout Prediction Visualizations

```python
import glob
import cv2
import matplotlib.pyplot as plt

pred_images = sorted(glob.glob("runs/detect/holdout_predictions/*.jpg"))
if pred_images:
    sample_preds = pred_images[:6]
    fig, axes = plt.subplots(2, 3, figsize=(18, 12))
    for ax, p_img in zip(axes.flat, sample_preds):
        img = cv2.imread(p_img)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        ax.imshow(img_rgb)
        ax.axis("off")
        ax.set_title(p_img.split("/")[-1], fontsize=10)
    plt.tight_layout()
    plt.show()
```

---

## 8. Export `best.pt`

```python
import shutil
from pathlib import Path

weights_src = Path(best_weights)
weights_dst = Path("models/best.pt")
weights_dst.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(weights_src, weights_dst)
print(f"Saved best weights to {weights_dst} (Size: {weights_dst.stat().st_size / (1024*1024):.2f} MB)")
```

---

## ⚠️ Licensing Notice

The dataset is listed on Kaggle under **CC BY 4.0**, whereas the embedded Roboflow configuration indicates `license: Private`. This licensing discrepancy must be clarified with the dataset maintainers prior to academic publication or public redistribution.
