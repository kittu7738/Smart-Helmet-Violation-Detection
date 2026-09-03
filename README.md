# 🪖 Robust Motorcycle Helmet Detection System

An AI-powered Motorcycle Helmet Violation Detection System reproducing the CVPRW 2024 winning research paper:

> **"Robust Motorcycle Helmet Detection in Real-World Scenarios: Using Co-DETR and Minority Class Enhancement"**  
> *Hao Vo, Sieu Tran, Duc Minh Nguyen, Thua Nguyen, Tien Do, Duy-Dinh Le, Thanh Duc Ngo*  
> *CVPR Workshops 2024 (1st Place in AI City Challenge 2024 Track 5: Detecting Violation of Helmet Rule for Motorcyclists)*

---

## 📖 Project Overview

This project is dedicated to reproducing and implementing the state-of-the-art methodology from the AI City Challenge 2024 Track 5. The system detects motorcycles and identifies helmet-rule compliance for riders across challenging real-world surveillance footage (fog, varying camera angles, low-light, dense traffic).

Unlike generic person helmet detectors, the system focuses on **motorcycle-specific rider violation detection**, distinguishing driver and passenger roles individually.

> [!NOTE]
> **Baseline Note**: An earlier YOLOv8 exploration served as an initial baseline and has been removed from the active project structure to focus entirely on the authoritative Co-DETR research paper reproduction.

---

## 🎯 Target Architecture & Roadmap

The implementation follows the paper's multi-stage pipeline:

```
AI City Challenge 2024 Track 5 Dataset (100 videos @ 10 FPS, 1920x1080)
                              │
                              ▼
           9-Class Rider & Motorcycle Annotations
                              │
                              ▼
       Co-DETR (Collaborative Detection Transformer)
                              │
                              ▼
           Co-DINO Pre-training & Swin-L Backbone
                              │
                              ▼
             Multi-scale Training & Inference
                              │
                              ▼
     Minority Class Enhancement (Minority Optimizer & Virtual Expander)
                              │
                              ▼
           Weighted Boxes Fusion (WBF) Ensemble
                              │
                              ▼
               Final Robust Detection & Evaluation
```

---

## 🚦 Project Status

### Phase 1 (Current)
- ✅ Repository cleanup: Obsolete YOLOv8/EdgeVision files and legacy weights removed.
- ✅ AI City Challenge Track 5 dataset preparation & validation tools implemented (`data/validate_aicity.py`, `data/prepare_aicity.py`).
- ✅ Project structure established for Co-DETR architecture.
- ✅ Environment & Colab T4 setup guidelines documented.

### Future Phases
- 📅 **Phase 2**: AI City Track 5 dataset acquisition & validation on official competition data.
- 📅 **Phase 3**: Co-DETR (Co-DINO with Swin-Large backbone) configuration and Google Colab Tesla T4 GPU training.
- 📅 **Phase 4**: Multi-scale training and multi-scale inference pipeline.
- 📅 **Phase 5**: Minority Class Enhancement (Minority Optimizer & Virtual Expander).
- 📅 **Phase 6**: Weighted Boxes Fusion (WBF) post-processing ensemble.
- 📅 **Phase 7**: Evaluation on AI City Challenge Track 5 test benchmark.
- 📅 **Phase 8**: Application integration (`app.py`), webcam support, buzzer alert, and violation logging.

> [!IMPORTANT]
> *Status Clarification: The project is in Phase 1 (repository cleanup and dataset preparation). Model training and minority enhancement modules have not been implemented yet.*

---

## 🏷️ Target Classes (9 Classes)

The paper strictly follows the 9 official AI City Challenge Track 5 classes:

| Class ID | Class Name   | Description |
|:--------:|:-------------|:------------|
| **0**    | `Motorbike`  | Motorcycle / two-wheeler vehicle bounding box |
| **1**    | `DHelmet`    | Driver wearing a helmet |
| **2**    | `DNoHelmet`  | Driver without a helmet (Violation) |
| **3**    | `P1Helmet`   | Passenger 1 (first passenger behind driver) wearing a helmet |
| **4**    | `P1NoHelmet` | Passenger 1 without a helmet (Violation) |
| **5**    | `P2Helmet`   | Passenger 2 (second passenger) wearing a helmet |
| **6**    | `P2NoHelmet` | Passenger 2 without a helmet (Violation) |
| **7**    | `P0Helmet`   | Passenger 0 (child seated in front of driver) wearing a helmet |
| **8**    | `P0NoHelmet` | Passenger 0 without a helmet (Violation) |

---

## 📂 Project Structure

```
Smart-Helmet-Violation-Detection/
│
├── app.py                      # Preserved Gradio web interface (to be adapted for Co-DETR)
├── README.md                   # Project documentation & architecture roadmap
├── requirements.txt            # Python dependencies (PyTorch, OpenCV, Gradio)
├── LICENSE                     # Project license
├── .gitignore                  # Git protection rules
│
├── configs/
│   └── codetr/                 # Co-DETR Swin-Large model configurations
│       └── README.md
│
├── data/                       # AI City Track 5 dataset validation & preparation tools
│   ├── README.md
│   ├── prepare_aicity.py
│   └── validate_aicity.py
│
├── docs/                       # Setup and training guidelines
│   └── colab_codetr_setup.md
│
├── evaluation/                 # Benchmark evaluation protocols (mAP)
│   └── README.md
│
├── inference/                  # Inference and multi-scale testing modules
│   └── codetr/
│       └── README.md
│
├── scripts/                    # Standalone execution scripts
│   └── README.md
│
├── src/                        # Core utility and application source code
│   └── webcam.py
│
├── tests/                      # Automated unit and validation tests
│   └── test_aicity_validation.py
│
└── training/                   # Model training pipelines (Colab Tesla T4)
    └── codetr/
        └── README.md
```

---

## ⚙️ Installation & Usage

### 1. Clone the Repository

```bash
git clone https://github.com/kittu7738/Smart-Helmet-Violation-Detection.git
cd Smart-Helmet-Violation-Detection
```

### 2. Set Up Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Validate AI City Track 5 Dataset

Once the official dataset is obtained from the challenge organizers, inspect and validate it:

```bash
python data/validate_aicity.py --dataset /path/to/aicity2024_track5
```

### 4. Run Automated Test Suite

```bash
python tests/test_aicity_validation.py
```

---

## 🌐 Application Interface (`app.py`)

The repository retains `app.py` as a general Gradio web interface. In future phases, `app.py` will be connected to the trained Co-DETR model pipeline for interactive inference, video testing, and violation visualization.

---

## 📄 Dataset Attribution & Licensing

This project uses the dataset from the **AI City Challenge 2024 Track 5**.

- The dataset must be obtained directly through the official [AI City Challenge](https://www.aicitychallenge.org/) process under the challenge terms of use.
- The dataset itself is **not** hosted or distributed in this repository.
- Users wishing to replicate the dataset preparation must register with the challenge organizers.

---

## 👨‍💻 Developer

**CH. Anjan Prasad**  
B.Tech Computer Science and Engineering  
Indian Institute of Information Technology Vadodara – International Campus Diu  

---

## 🤝 Contributions

Contributions, feedback, and discussion on the paper reproduction are welcome. Feel free to open an issue or pull request.