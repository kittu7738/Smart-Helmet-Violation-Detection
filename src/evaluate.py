#!/usr/bin/env python3
"""
Smart Helmet Violation Detection - Model Evaluation & Holdout Inference Pipeline

Functions:
- Evaluates trained YOLOv8n weights (best.pt) on validation set.
- Evaluates on the unseen holdout evaluation set (test/).
- Extracts Precision, Recall, mAP50, mAP50-95 per class and overall.
- Runs inference on holdout test images and generates annotated visualizations.
- Verifies detections of helmet (0) and no helmet (1).
"""

import argparse
from pathlib import Path
from typing import Dict
import cv2
import matplotlib.pyplot as plt
from ultralytics import YOLO


def evaluate_helmet_model(
    model_path: str = "runs/detect/helmet_training/weights/best.pt",
    data_yaml: str = "datasets/helmet_violation_prepared/data.yaml",
    imgsz: int = 640,
    conf_threshold: float = 0.25,
    device: str = "0",
    save_predictions: bool = True
) -> Dict:
    """
    Evaluates the model on validation and unseen holdout splits, and prints metrics.
    """
    model_file = Path(model_path)
    if not model_file.exists():
        raise FileNotFoundError(f"Trained model weights not found at: {model_path}")

    yaml_path = Path(data_yaml)
    if not yaml_path.exists():
        raise FileNotFoundError(f"Dataset configuration not found at: {data_yaml}")

    print("==================================================")
    print("EVALUATING TRAINED SMART HELMET MODEL")
    print("==================================================")
    print(f"Model path:           {model_file}")
    print(f"Model file size:      {model_file.stat().st_size / (1024 * 1024):.2f} MB")
    print(f"Dataset config:       {yaml_path}")
    print(f"Confidence threshold: {conf_threshold}")
    print(f"Inference device:     {device}")
    print("==================================================")

    model = YOLO(str(model_file))

    # 1. Validation Set Evaluation
    print("\n[1/3] Running Validation Set Evaluation (val)...")
    val_results = model.val(
        data=str(yaml_path.resolve()),
        split="val",
        imgsz=imgsz,
        conf=conf_threshold,
        device=device,
        verbose=True
    )

    val_class_map50 = list(val_results.box.maps) if hasattr(val_results.box, "maps") else []
    val_metrics = {
        "precision": float(val_results.box.mp),
        "recall": float(val_results.box.mr),
        "map50": float(val_results.box.map50),
        "map50_95": float(val_results.box.map),
        "class_map50": [float(m) for m in val_class_map50]
    }

    # 2. Holdout Test Set Evaluation (Unseen Evaluation Set)
    print("\n[2/3] Running Unseen Holdout Set Evaluation (test)...")
    test_results = model.val(
        data=str(yaml_path.resolve()),
        split="test",
        imgsz=imgsz,
        conf=conf_threshold,
        device=device,
        verbose=True
    )

    test_class_map50 = list(test_results.box.maps) if hasattr(test_results.box, "maps") else []
    test_metrics = {
        "precision": float(test_results.box.mp),
        "recall": float(test_results.box.mr),
        "map50": float(test_results.box.map50),
        "map50_95": float(test_results.box.map),
        "class_map50": [float(m) for m in test_class_map50]
    }

    # 3. Holdout Inference & Visualization
    test_images_dir = yaml_path.parent / "test" / "images"
    prediction_dir = None
    if save_predictions and test_images_dir.exists():
        print("\n[3/3] Generating Annotated Prediction Visualizations on Holdout Set...")
        pred_results = model.predict(
            source=str(test_images_dir),
            conf=conf_threshold,
            imgsz=imgsz,
            device=device,
            save=True,
            project="runs/detect",
            name="holdout_predictions",
            exist_ok=True
        )
        prediction_dir = Path("runs/detect/holdout_predictions")
        print(f"Annotated test predictions saved to: {prediction_dir}")

    # Summary Report Table
    print("\n================================================================================")
    print("EVALUATION METRICS SUMMARY")
    print("================================================================================")
    print(f"{'Split':<18} | {'Precision':<10} | {'Recall':<10} | {'mAP50':<10} | {'mAP50-95':<10}")
    print("--------------------------------------------------------------------------------")
    print(f"{'Validation (val)':<18} | {val_metrics['precision']:<10.4f} | {val_metrics['recall']:<10.4f} | {val_metrics['map50']:<10.4f} | {val_metrics['map50_95']:<10.4f}")
    print(f"{'Holdout (test)':<18} | {test_metrics['precision']:<10.4f} | {test_metrics['recall']:<10.4f} | {test_metrics['map50']:<10.4f} | {test_metrics['map50_95']:<10.4f}")
    print("--------------------------------------------------------------------------------")
    if len(test_metrics["class_map50"]) >= 2:
        print(f"Holdout Class 0 (Helmet)    mAP50: {test_metrics['class_map50'][0]:.4f}")
        print(f"Holdout Class 1 (No Helmet)  mAP50: {test_metrics['class_map50'][1]:.4f}")
    print("================================================================================")

    return {
        "model_path": str(model_file),
        "model_size_mb": model_file.stat().st_size / (1024 * 1024),
        "validation_metrics": val_metrics,
        "holdout_metrics": test_metrics,
        "prediction_dir": str(prediction_dir) if prediction_dir else None
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate YOLOv8n Helmet Detection Model")
    parser.add_argument("--model", type=str, default="runs/detect/helmet_training/weights/best.pt", help="Path to best.pt")
    parser.add_argument("--data", type=str, default="datasets/helmet_violation_prepared/data.yaml", help="Path to data.yaml")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold")
    parser.add_argument("--device", type=str, default="0", help="CUDA device ID ('0') or 'cpu'")

    args = parser.parse_args()

    evaluate_helmet_model(
        model_path=args.model,
        data_yaml=args.data,
        imgsz=args.imgsz,
        conf_threshold=args.conf,
        device=args.device
    )
