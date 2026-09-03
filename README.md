# 🪖 Smart Helmet Violation Detection System

An AI-powered Smart Helmet Violation Detection System developed using **YOLOv8**, **Python**, **Gradio**, **OpenCV**, and **PyTorch**. This project aims to improve road safety by automatically detecting helmet violations and generating alerts for riders who are not wearing helmets.

---

## 📖 Project Overview

The Smart Helmet Violation Detection System is a computer vision application designed to monitor traffic and identify riders who violate helmet safety rules.

The current version provides a web-based interface using Gradio and performs real-time object detection using the YOLOv8 model. Future versions will include helmet detection, webcam support, buzzer alerts, number plate recognition, and OCR.

---

## 🎯 Objectives

- Detect riders and motorcycles using AI.
- Detect whether a rider is wearing a helmet.
- Trigger a buzzer for helmet violations.
- Support real-time webcam monitoring.
- Detect vehicle number plates.
- Extract number plate text using OCR.
- Store violation records for future analysis.

---

# 🚀 Current Features

- ✅ YOLOv8 Object Detection
- ✅ Image Upload Interface
- ✅ Fast AI Inference
- ✅ Gradio Web Application
- ✅ Bounding Box Visualization
- ✅ Local Model Loading

---

# 🚧 Features Under Development

- 🪖 Helmet Detection
- 🎥 Webcam Detection
- 🔔 Automatic Buzzer Alert
- 🚘 Number Plate Detection
- 🔤 OCR Number Plate Recognition
- 💾 Violation Logging
- 📊 Dashboard

---

# 🛠️ Technologies Used

- Python 3.13
- YOLOv8 (Ultralytics)
- PyTorch
- OpenCV
- Gradio
- NumPy

---

# 📂 Project Structure

```
Smart-Helmet-Violation-Detection/
│
├── app.py
├── README.md
├── requirements.txt
├── LICENSE
├── .gitignore
├── yolov8n.pt
│
├── configs/
│   └── codetr/
├── data/
│   ├── README.md
│   ├── prepare_aicity.py
│   └── validate_aicity.py
├── datasets/
├── docs/
│   ├── colab_codetr_setup.md
│   └── colab_helmet_training.md
├── evaluation/
├── inference/
│   └── codetr/
├── models/
├── results/
├── screenshots/
├── scripts/
├── src/
├── tests/
├── training/
│   └── codetr/
└── venv/
```

# ⚙️ Installation

## Clone the Repository

```bash
git clone https://github.com/kittu7738/Smart-Helmet-Violation-Detection.git
```

## Navigate to the Project

```bash
cd Smart-Helmet-Violation-Detection
```

## Create Virtual Environment

```bash
python3 -m venv venv
```

## Activate Virtual Environment

macOS / Linux

```bash
source venv/bin/activate
```

Windows

```bash
venv\Scripts\activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Run the Application

```bash
python3 app.py
```

Open your browser and visit:

```
http://127.0.0.1:7860
```

---

# 📸 Current Output

The application currently detects:

- Person
- Bicycle
- Car
- Motorcycle
- Bus
- Truck
- Traffic Light
- Stop Sign
- Other COCO dataset objects

Detection results include bounding boxes and confidence scores.

---

# 📈 Project Progress

### Completed
- Project setup
- YOLOv8 setup
- Gradio image detection
- Colab GPU setup
- Motorcycle helmet dataset preparation
- WithHelmet / WithoutHelmet dataset preparation

### Current
- Helmet model training preparation
- AI City Challenge Track 5 paper reproduction setup (Phase 1)

### Upcoming
- YOLOv8n training & evaluation
- Co-DETR model training (AI City Track 5)
- Minority Class Enhancement (Minority Optimizer & Virtual Expander)
- WBF ensemble & multi-scale inference
- best.pt Mac integration
- Webcam, Buzzer, Number plate OCR, Violation logging

---

# 🔬 Paper Reproduction — AI City Track 5

This project includes an implementation track following the architecture of the CVPRW 2024 winning research paper:

> **"Robust Motorcycle Helmet Detection in Real-World Scenarios: Using Co-DETR and Minority Class Enhancement"**  
> *Hao Vo, Sieu Tran, Duc Minh Nguyen, Thua Nguyen, Tien Do, Duy-Dinh Le, Thanh Duc Ngo* (1st Place, AI City Challenge 2024 Track 5)

### Phased Roadmap:
- **Phase 1 (Current)**: Dataset inspection, validation, and preparation tools for the official **AI City Challenge 2024 Track 5** dataset (100 video sequences, 10 FPS, 1920×1080 resolution, 9 rider-specific helmet violation classes).
- **Phase 2 (Upcoming)**: Co-DETR (Co-DINO with Swin-Large backbone) configuration and training pipeline on Google Colab Tesla T4 GPU.
- **Phase 3 (Upcoming)**: Minority Class Enhancement (Minority Optimizer & Virtual Expander).
- **Phase 4 (Upcoming)**: Multi-scale test-time augmentation, Weighted Boxes Fusion (WBF), and evaluation benchmarking against the YOLO baseline.

*Status: Phase 1 focuses exclusively on dataset validation and preparation. Model training and enhancements are staged for future phases.*

---

# 📊 Dataset Specifications & Preparation

The motorcycle helmet violation dataset has been prepared with strict filtering and verification standards:

- **Target Classes**:
  - `0`: `WithHelmet`
  - `1`: `WithoutHelmet`
- **Class Filtering**: `Plate` annotations were completely filtered out from this phase to focus purely on helmet compliance.
- **Evaluation / Holdout Split**: The original test split contained 0 helmet annotations and was unusable. A new, stratified holdout evaluation split (`test/`) and validation split (`valid/`) were constructed using a fixed random seed (`seed=42`) from helmet-annotated images, ensuring zero data leakage and non-empty evaluation targets.
- **Dataset Configuration**: Generated 2-class `data.yaml`.
- **Quality Checks**: Image-label 1:1 matching, normalized bounding box boundary checks, zero split overlap, and visual bounding box verification grids.

---

# 🎯 Future Workflow

```
Image / Webcam
        │
        ▼
Object Detection
        │
        ▼
Helmet Detection
        │
   ┌────┴────┐
   │         │
Helmet   No Helmet
   │         │
   ▼         ▼
 Safe     🔔 Buzzer
             │
             ▼
 Number Plate Detection
             │
             ▼
      OCR Recognition
             │
             ▼
      Save Violation
```

---

# 👨‍💻 Developer

**CH. Anjan Prasad**

B.Tech Computer Science and Engineering

Indian Institute of Information Technology Vadodara – International Campus Diu

---

# 🤝 Contributions

Contributions, suggestions, and improvements are welcome.

Feel free to fork the repository and submit a pull request.

---

# 📄 License

This project is developed for academic and educational purposes.

## Dataset Attribution & Licensing

This project uses a motorcycle helmet detection dataset obtained through the project's dataset source.

The downloaded dataset metadata contains licensing information that should be checked against the original dataset source and its current terms before redistribution.

For this project:
- The dataset is used for academic/educational model development.
- The dataset itself is not included in this GitHub repository.
- The trained model and source code are provided as part of this project.
- Users who reuse the dataset should verify the applicable license and attribution requirements from the original dataset provider.

Do not reproduce or redistribute the dataset through this repository.