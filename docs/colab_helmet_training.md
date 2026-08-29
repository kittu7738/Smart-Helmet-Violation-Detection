# Google Colab Helmet Training Workflow

This workflow prepares and verifies the Smart Helmet Violation Detection dataset in
Google Colab on a **Tesla T4 GPU** before training starts. It does not modify the Mac
application. Run the cells in order with a Colab runtime configured for GPU.

---

## 1. Configure the Colab Runtime

In Google Colab, select **Runtime > Change runtime type > T4 GPU**, then run:

```python
!nvidia-smi
```

The output must show a CUDA-capable GPU (Tesla T4).

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

## 3. Clone Repository or Upload Source

Clone your repository to access `src/prepare_dataset.py` directly:

```python
!git clone https://github.com/kittu7738/Smart-Helmet-Violation-Detection.git
%cd Smart-Helmet-Violation-Detection
```

---

## 4. Download Raw Dataset

Download the raw `HelmetViolations` dataset (or mount Google Drive if previously downloaded):

```python
from getpass import getpass
from roboflow import Roboflow

ROBOFLOW_API_KEY = getpass("Roboflow API key: ")

rf = Roboflow(api_key=ROBOFLOW_API_KEY)
workspace = rf.workspace("innovatech")
project = workspace.project("motorcycle-helmet-q0wmd")
dataset = project.version(1).download("yolov8")

RAW_DATASET_DIR = dataset.location
print("Raw dataset location:", RAW_DATASET_DIR)
```

---

## 5. Prepare Filtered Dataset & Stratified Holdout Split

Run the automated dataset preparation pipeline:
- Filters out all `Plate` annotations.
- Remaps classes to:
  - `0`: `WithHelmet`
  - `1`: `WithoutHelmet`
- Creates a reproducible stratified holdout evaluation split (`test/`) and validation split (`valid/`) with fixed random seed (`seed=42`).
- Generates a 2-class `data.yaml`.

```python
from src.prepare_dataset import prepare_dataset, verify_dataset_integrity, generate_sample_visualizations

PREPARED_DATASET_DIR = "datasets/helmet_violation_prepared"

stats = prepare_dataset(
    raw_dir=RAW_DATASET_DIR,
    output_dir=PREPARED_DATASET_DIR,
    train_ratio=0.80,
    val_ratio=0.10,
    test_ratio=0.10,
    seed=42
)
```

---

## 6. Verify Dataset Quality & Integrity

Run the full automated dataset verification suite:

```python
verified_stats = verify_dataset_integrity(PREPARED_DATASET_DIR)
```

### Verification Checklist:
- [x] All class IDs are strictly in `{0, 1}` (`0: WithHelmet`, `1: WithoutHelmet`).
- [x] Zero `Plate` annotations remain.
- [x] All images and label files match 1:1.
- [x] Bounding box coordinates are within normalized `[0, 1]` boundaries.
- [x] Zero duplicate images or data leakage between `train`, `valid`, and `test` splits.
- [x] `test/` holdout set contains valid helmet-labelled samples for evaluation.

---

## 7. Display Visual Verification Grids

Render and inspect visual samples from `train`, `valid`, and `test` splits with distinct bounding box colors (**Green** for `WithHelmet`, **Red** for `WithoutHelmet`):

```python
import matplotlib.pyplot as plt
import cv2

vis_file = generate_sample_visualizations(
    PREPARED_DATASET_DIR,
    output_image_path="screenshots/dataset_verification_samples.png",
    num_samples_per_split=2
)

# Display in notebook
img = cv2.imread(vis_file)
if img is not None:
    plt.figure(figsize=(16, 12))
    plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    plt.axis("off")
    plt.show()
```

---

## 8. Staging for Next Milestone: YOLOv8n Model Training

> [!IMPORTANT]
> **Do not start model training until the dataset preparation and verification above are completed and pushed to GitHub.**

The next milestone will run YOLOv8n fine-tuning on the verified dataset:

```python
# STAGED FOR NEXT MILESTONE
from ultralytics import YOLO

model = YOLO("yolov8n.pt")
results = model.train(
    data=f"{PREPARED_DATASET_DIR}/data.yaml",
    epochs=50,
    imgsz=640,
    batch=16,
    device=0,
    project="runs/detect",
    name="train_helmet",
    seed=42
)
```

---

## ⚠️ Licensing Notice

The dataset is listed on Kaggle under **CC BY 4.0**, whereas the embedded Roboflow configuration indicates `license: Private`. This licensing discrepancy must be clarified with the dataset authors/maintainers prior to academic publication or public model redistribution.
