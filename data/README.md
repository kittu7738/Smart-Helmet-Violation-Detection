# 🏍️ AI City Challenge 2024 Track 5 Dataset

This directory contains validation, inspection, and preparation utilities for the **AI City Challenge 2024 Track 5** dataset, used to reproduce the research paper:

> **"Robust Motorcycle Helmet Detection in Real-World Scenarios: Using Co-DETR and Minority Class Enhancement"**  
> *Hao Vo, Sieu Tran, Duc Minh Nguyen, Thua Nguyen, Tien Do, Duy-Dinh Le, Thanh Duc Ngo*  
> *CVPR Workshops 2024 (1st Place, AI City Challenge 2024 Track 5)*

---

## 1. Dataset Overview

The AI City Challenge 2024 Track 5 (*Detecting Violation of Helmet Rule for Motorcyclists*) focuses on detecting motorcycles and determining whether the driver and each passenger are complying with helmet safety regulations.

### Key Specifications:
- **Video Source**: Real-world traffic surveillance cameras from Indian city roads under challenging conditions (fog, varying illumination, dense congestion, camera angles).
- **Training Set**: 100 video clips.
- **Duration**: 20 seconds per video.
- **Frame Rate**: 10 FPS (~200 frames per video, ~20,000 frames total).
- **Resolution**: 1920 × 1080 pixels (Full HD).
- **Entities**: Motorbikes and riders. Each motorbike can carry a driver and up to 4 passengers (P0 in front of driver, P1 behind driver, P2 behind P1, etc.).

---

## 2. Target Classes (9 Classes)

The paper strictly follows the 9 official competition classes:

| Class ID | Class Name   | Description |
|:--------:|:-------------|:------------|
| **0**    | `Motorbike`  | Motorcycle / two-wheeler vehicle bounding box |
| **1**    | `DHelmet`    | Driver wearing a helmet |
| **2**    | `DNoHelmet`  | Driver without a helmet |
| **3**    | `P1Helmet`   | Passenger 1 (first passenger behind driver) wearing a helmet |
| **4**    | `P1NoHelmet` | Passenger 1 without a helmet |
| **5**    | `P2Helmet`   | Passenger 2 (second passenger behind driver) wearing a helmet |
| **6**    | `P2NoHelmet` | Passenger 2 without a helmet |
| **7**    | `P0Helmet`   | Passenger 0 (child seated in front of driver) wearing a helmet |
| **8**    | `P0NoHelmet` | Passenger 0 without a helmet |

> [!IMPORTANT]
> The target is **motorcycle/rider helmet-rule violation detection**, not generic person headwear detection. Driver and passenger roles are distinct classes with significant class imbalance (minority classes like `P0` and `P2` occur much less frequently than `DHelmet` and `Motorbike`).

---

## 3. Dataset Acquisition

The dataset cannot be downloaded automatically or bundled into this repository.

To obtain the dataset:
1. Register and sign the dataset agreement at the official **[AI City Challenge Website](https://www.aicitychallenge.org/)**.
2. Follow the organizer instructions to access the Track 5 dataset package.
3. Download the data to your local workstation or Google Drive (for Google Colab training).

> [!CAUTION]
> **Do not commit raw videos, frames, or annotations to this repository.** The repository `.gitignore` is configured to exclude raw datasets, extracted frames, and video files.

---

## 4. Expected Dataset Directory Layout

Place or extract the official dataset in an external path or `data/raw/`:

```
aicity2024_track5/
├── videos/             # 100 video clips (e.g. 001.mp4 ... 100.mp4)
│   ├── 001.mp4
│   ├── ...
│   └── 100.mp4
└── annotations/        # Ground-truth annotations (CSV, TXT, XML, or JSON)
    ├── gt.txt          # or individual video annotation files
    └── ...
```

---

## 5. Usage & Verification

### Step 1: Validate Dataset Integrity & Class Names
Inspect videos, frames, resolution, FPS, annotation counts, and verify the 9 expected classes:

```bash
python data/validate_aicity.py --dataset /path/to/aicity2024_track5
```

### Step 2: Prepare Frames & Annotation Format (When Confirmed)
Extract frames at 10 FPS and convert annotations to standard COCO format (for Co-DETR):

```bash
python data/prepare_aicity.py --dataset /path/to/aicity2024_track5 --output data/processed/aicity_coco --fps 10
```
