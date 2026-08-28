# Google Colab Helmet Training Workflow

This workflow prepares and verifies the Roboflow Motorcycle Helmet dataset in
Google Colab before any training starts. It does not modify the Mac
application. Run the cells in order with a Colab runtime configured for GPU.

## 1. Configure the Colab runtime

In Colab, select **Runtime > Change runtime type > T4 GPU** (or another
available GPU), then run:

```python
!nvidia-smi
```

The output should show a CUDA-capable GPU. Stop if it shows no GPU.

## 2. Install the Colab packages

```python
!pip install -q -U ultralytics roboflow pyyaml matplotlib opencv-python

import ultralytics
print("Ultralytics:", ultralytics.__version__)
```

This installs packages in the temporary Colab runtime only. It does not change
the Mac virtual environment.

## 3. Download dataset version 1

The dataset page is:

`https://universe.roboflow.com/innovatech/motorcycle-helmet-q0wmd`

Create a Roboflow API key with permission to download the dataset, then enter
it when prompted. The key is not printed or stored in the notebook output.

```python
from getpass import getpass
from roboflow import Roboflow

ROBOFLOW_API_KEY = getpass("Roboflow API key: ")

rf = Roboflow(api_key=ROBOFLOW_API_KEY)
workspace = rf.workspace("innovatech")
project = workspace.project("motorcycle-helmet-q0wmd")
dataset = project.version(1).download("yolov8")

DATASET_DIR = dataset.location
print("Dataset directory:", DATASET_DIR)
```

## 4. Inspect `data.yaml` before training

```python
from pathlib import Path
import yaml

yaml_candidates = list(Path(DATASET_DIR).glob("**/data.yaml"))
assert yaml_candidates, f"No data.yaml found below {DATASET_DIR}"
DATA_YAML = yaml_candidates[0]

with DATA_YAML.open() as file:
    data = yaml.safe_load(file)

print("data.yaml path:", DATA_YAML)
print("classes:", data.get("names"))
print("number of classes:", data.get("nc", len(data.get("names", []))))
print("train path:", data.get("train"))
print("validation path:", data.get("val"))
print("test path:", data.get("test"))

assert len(data["names"]) == 2, data["names"]
assert {str(name).lower().replace("_", " ") for name in data["names"]} == {
    "helmet",
    "no helmet",
}
```

The assertions intentionally stop the workflow if the dataset has unexpected
class names or a class count other than two. Report the printed values before
continuing.

## 5. Verify split images and labels

```python
from collections import Counter

dataset_root = DATA_YAML.parent

def resolve_split(split_name):
    value = data.get(split_name)
    assert value, f"Missing {split_name} split in data.yaml"
    split_path = Path(value)
    if not split_path.is_absolute():
        split_path = dataset_root / split_path
    return split_path.resolve()

def inspect_split(split_name):
    image_dir = resolve_split(split_name)
    label_dir = dataset_root / "labels" / split_name
    image_paths = sorted(
        path for path in image_dir.rglob("*")
        if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    )
    label_paths = sorted(label_dir.rglob("*.txt")) if label_dir.exists() else []
    label_stems = {path.stem for path in label_paths}
    missing_labels = [path.name for path in image_paths if path.stem not in label_stems]
    class_ids = Counter()
    for label_path in label_paths:
        for line in label_path.read_text().splitlines():
            fields = line.split()
            if fields:
                class_ids[int(fields[0])] += 1
    print(f"{split_name}: {len(image_paths)} images, {len(label_paths)} labels")
    print(f"{split_name} class IDs:", dict(class_ids))
    print(f"{split_name} images without labels:", len(missing_labels))
    assert image_paths, f"No images found for {split_name}: {image_dir}"
    assert not missing_labels, missing_labels[:10]
    assert set(class_ids).issubset({0, 1}), class_ids
    return image_paths

train_images = inspect_split("train")
val_key = "valid" if "valid" in data else "val"
val_images = inspect_split(val_key)
test_images = inspect_split("test")

print("TRAINING IMAGES:", len(train_images))
print("VALIDATION IMAGES:", len(val_images))
print("TEST IMAGES:", len(test_images))
```

Use the printed counts in the milestone report. The dataset page currently
advertises 528 total images, but the split counts must come from this exported
dataset and must not be assumed.

## 6. Display labelled samples

```python
import cv2
import matplotlib.pyplot as plt
import random

names = {index: str(name) for index, name in enumerate(data["names"])}

def show_samples(image_paths, count=6):
    samples = random.sample(image_paths, min(count, len(image_paths)))
    fig, axes = plt.subplots(2, 3, figsize=(15, 9))
    for axis, image_path in zip(axes.flat, samples):
        image = cv2.cvtColor(cv2.imread(str(image_path)), cv2.COLOR_BGR2RGB)
        split_name = image_path.parent.parent.name
        label_path = dataset_root / "labels" / split_name / f"{image_path.stem}.txt"
        height, width = image.shape[:2]
        for line in label_path.read_text().splitlines():
            class_id, center_x, center_y, box_width, box_height = map(float, line.split())
            x1 = int((center_x - box_width / 2) * width)
            y1 = int((center_y - box_height / 2) * height)
            x2 = int((center_x + box_width / 2) * width)
            y2 = int((center_y + box_height / 2) * height)
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(image, names[int(class_id)], (x1, max(20, y1 - 5)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
        axis.imshow(image)
        axis.axis("off")
        axis.set_title(image_path.name)
    for axis in axes.flat[len(samples):]:
        axis.axis("off")
    plt.tight_layout()
    plt.show()

show_samples(train_images)
```

Confirm that the boxes and labels visibly match the helmets and riders before
training.

## 7. Prepare, but do not run, YOLOv8n training

After the dataset verification output and sample images are reviewed, run:

```python
from ultralytics import YOLO

model = YOLO("yolov8n.pt")
model.train(
    data=str(DATA_YAML),
    epochs=50,
    imgsz=640,
    batch=16,
    device=0,
    project="runs/detect",
    name="train",
)
```

If the GPU runs out of memory, reduce `batch` to `8` or `4`. The expected
output is `runs/detect/train/weights/best.pt`. Validate and test that artifact
before copying it to the Mac project's `models/best.pt`.

## Licensing note

The Kaggle dataset page states **CC BY 4.0**, while the embedded Roboflow
metadata in `data.yaml` states `license: Private`. This discrepancy must be
clarified with the dataset provider before academic publication or
redistribution. Do not treat the license as definitive until it is resolved.
