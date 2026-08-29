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
├── datasets/
├── docs/
├── models/
├── results/
├── screenshots/
├── src/
└── venv/
```

---

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

### Upcoming
- YOLOv8n training
- Model evaluation
- best.pt
- Mac integration
- Webcam
- Buzzer
- Number plate
- OCR
- Violation logging
- 3D website
- Deployment

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

# 📄 License & Dataset Licensing Notice

This project is developed for academic and educational purposes.

### Dataset Licensing Notice
- **Kaggle** reports the dataset license as **CC BY 4.0**.
- The embedded **Roboflow YAML** reports `license: Private`.

> [!WARNING]
> This licensing discrepancy between Kaggle (CC BY 4.0) and the embedded Roboflow metadata (Private) needs clarification from the dataset maintainers before academic publication or public redistribution.