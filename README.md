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

## ✅ Completed

- Project Setup
- GitHub Repository
- Python Virtual Environment
- YOLOv8 Integration
- Gradio Interface
- Image Upload
- Object Detection
- README Documentation

---

## 🚧 In Progress

- Helmet Detection Model
- Webcam Detection

---

## 📅 Upcoming

- Helmet / No Helmet Classification
- Buzzer Alert System
- Number Plate Detection
- OCR Integration
- Violation Database
- Dashboard
- Cloud Deployment

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