# 🪖 Smart Helmet Violation Detection System

An AI-powered Smart Helmet Violation Detection System built using **YOLOv8**, **Python**, **Gradio**, and **OpenCV**. The application detects people and is being extended to detect helmet violations in real time.

---

## 📖 Project Overview

This project aims to improve road safety by automatically detecting whether motorcycle riders are wearing helmets. The system uses a YOLOv8 object detection model and provides an easy-to-use web interface built with Gradio.

The current version successfully performs AI-based object detection and serves as the foundation for helmet violation detection.

---

## 🎯 Project Objectives

- Detect riders and motorcycles.
- Detect helmets using a custom-trained YOLO model.
- Trigger a buzzer when a rider is not wearing a helmet.
- Support image upload and webcam detection.
- Detect vehicle number plates.
- Read number plates using OCR.
- Store violation records.

---

## ✨ Current Features

- ✅ AI Object Detection using YOLOv8
- ✅ Image Upload Interface
- ✅ Fast Inference with Gradio
- ✅ Local Model Loading
- ✅ Bounding Box Visualization

---

## 🚧 Features Under Development

- 🪖 Helmet Detection
- 🎥 Live Webcam Detection
- 🔔 Automatic Buzzer Alert
- 🚘 Number Plate Detection
- 🔤 OCR Number Plate Recognition
- 💾 Violation Database
- 📊 Dashboard

---

## 🛠️ Technologies Used

- Python 3.13
- YOLOv8 (Ultralytics)
- PyTorch
- OpenCV
- Gradio
- NumPy

---

## 📂 Project Structure

```
Smart-Helmet-Violation-Detection/
│
├── app.py
├── yolov8n.pt
├── models/
├── datasets/
├── results/
├── screenshots/
├── src/
├── README.md
├── requirements.txt
└── venv/
```

---

## ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/kittu7738/Smart-Helmet-Violation-Detection.git
```

Navigate to the project

```bash
cd Smart-Helmet-Violation-Detection
```

Create a virtual environment

```bash
python3 -m venv venv
```

Activate the virtual environment

macOS/Linux

```bash
source venv/bin/activate
```

Install the required packages

```bash
pip install -r requirements.txt
```

Run the application

```bash
python3 app.py
```

Open your browser

```
http://127.0.0.1:7860
```

---

## 📸 Current Output

The current application successfully detects objects such as:

- Person
- Car
- Motorcycle
- Bus
- Truck
- Bicycle

Bounding boxes and confidence scores are displayed in real time.

---

## 🎯 Next Milestones

- Integrate custom helmet detection model (`best.pt`)
- Trigger buzzer for helmet violations
- Real-time webcam detection
- Number plate detection
- OCR integration
- Save violation history

---

## 📷 Demo

Current Version

- ✅ Image Upload
- ✅ AI Detection
- ✅ Fast YOLOv8 Inference

---

## 👨‍💻 Developer

**CH. Anjan Prasad**

B.Tech – Computer Science and Engineering

Indian Institute of Information Technology Vadodara – International Campus Diu

---

## 📄 License

This project is developed for academic and research purposes.