#!/usr/bin/env python3
"""
Smart Helmet Violation Detection - YOLOv8n Model Training Pipeline

Target Classes (2-class setup):
    0: WithHelmet
    1: WithoutHelmet

Execution:
    This script is designed to run on Google Colab Tesla T4 GPU (device=0).
    Do not run heavy training on local CPU/Mac.
"""

import argparse
from pathlib import Path
from ultralytics import YOLO


def train_helmet_model(
    data_yaml: str = "datasets/helmet_violation_prepared/data.yaml",
    epochs: int = 50,
    imgsz: int = 640,
    batch: int = 16,
    device: str = "0",
    project: str = "runs/detect",
    name: str = "helmet_training",
    pretrained_weights: str = "yolov8n.pt",
    seed: int = 42
):
    """
    Trains YOLOv8n on the prepared WithHelmet / WithoutHelmet dataset.
    """
    print("==================================================")
    print("STARTING YOLOV8N SMART HELMET DETECTION TRAINING")
    print("==================================================")
    print(f"Base weights:        {pretrained_weights}")
    print(f"Dataset config:      {data_yaml}")
    print(f"Target epochs:       {epochs}")
    print(f"Image resolution:    {imgsz}x{imgsz}")
    print(f"Batch size:          {batch}")
    print(f"Target device:       {device}")
    print(f"Run output location: {project}/{name}")
    print(f"Random seed:         {seed}")
    print("==================================================")

    yaml_path = Path(data_yaml)
    if not yaml_path.exists():
        raise FileNotFoundError(
            f"Dataset configuration '{data_yaml}' not found. "
            "Please run src/prepare_dataset.py first."
        )

    # Initialize YOLOv8n model
    model = YOLO(pretrained_weights)

    # Train model
    results = model.train(
        data=str(yaml_path.resolve()),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=device,
        project=project,
        name=name,
        seed=seed,
        verbose=True,
        save=True,
        plots=True
    )

    best_pt = Path(project) / name / "weights" / "best.pt"
    last_pt = Path(project) / name / "weights" / "last.pt"

    print("\n==================================================")
    print("TRAINING COMPLETED SUCCESSFULLY")
    print("==================================================")
    print(f"Best model weights: {best_pt} (exists: {best_pt.exists()})")
    print(f"Last model weights: {last_pt} (exists: {last_pt.exists()})")

    return model, results, best_pt


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLOv8n for Helmet Violation Detection")
    parser.add_argument("--data", type=str, default="datasets/helmet_violation_prepared/data.yaml", help="Path to data.yaml")
    parser.add_argument("--epochs", type=int, default=50, help="Training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--device", type=str, default="0", help="CUDA device ID ('0') or 'cpu'")
    parser.add_argument("--project", type=str, default="runs/detect", help="Output project directory")
    parser.add_argument("--name", type=str, default="helmet_training", help="Experiment name")
    parser.add_argument("--weights", type=str, default="yolov8n.pt", help="Pretrained weights")
    parser.add_argument("--seed", type=int, default=42, help="Fixed random seed")

    args = parser.parse_args()

    train_helmet_model(
        data_yaml=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        project=args.project,
        name=args.name,
        pretrained_weights=args.weights,
        seed=args.seed
    )
