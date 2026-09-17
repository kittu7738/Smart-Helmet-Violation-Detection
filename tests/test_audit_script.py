import os
import json
import tempfile
import pytest
import sys

# Add scripts directory to path to import the module
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(os.path.join(REPO_ROOT, "scripts"))

from audit_dataset_colab import audit_split, compute_iou

def test_compute_iou():
    box1 = [0, 0, 10, 10]
    box2 = [0, 0, 10, 10]
    assert compute_iou(box1, box2) == 1.0
    
    box3 = [10, 10, 10, 10]
    assert compute_iou(box1, box3) == 0.0
    
    box4 = [0, 0, 10, 5]
    assert compute_iou(box1, box4) == 0.5

def test_audit_dataset_layout_discovery(capsys):
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create fake dataset layout matching the exact requirement
        # /content/dataset_local/instances_train.json
        # /content/dataset_local/train/
        
        os.makedirs(os.path.join(tmpdir, "train"))
        os.makedirs(os.path.join(tmpdir, "vaid"))
        os.makedirs(os.path.join(tmpdir, "test"))
        
        fake_coco = {
            "images": [
                {"id": 1, "width": 100, "height": 100, "file_name": "train/1.jpg"},
                {"id": 1, "width": 100, "height": 100, "file_name": "train/1_dup.jpg"} # duplicate image ID
            ],
            "categories": [
                {"id": 1, "name": "driver"},
                {"id": 2, "name": "driver_with_helmet"}
            ],
            "annotations": [
                {"id": 1, "image_id": 1, "category_id": 1, "bbox": [10, 10, 50, 50]},
                {"id": 2, "image_id": 1, "category_id": 2, "bbox": [10, 10, 50, 50]}, # Overlapping -> Taxonomy Ambiguity
                {"id": 3, "image_id": 1, "category_id": 1, "bbox": [-10, 10, 50, 50]}, # Out of bounds
                {"id": 4, "image_id": 1, "category_id": 1, "bbox": [20, 20, 0, 50]}, # Zero width
                {"id": 5, "image_id": 999, "category_id": 1, "bbox": [10, 10, 50, 50]} # Missing image ref
            ]
        }
        
        train_json_path = os.path.join(tmpdir, "instances_train.json")
        with open(train_json_path, 'w') as f:
            json.dump(fake_coco, f)
            
        audit_split(train_json_path, "TRAIN")
        
        captured = capsys.readouterr()
        
        # Verify it successfully discovers and reads the file
        assert "AUDIT: TRAIN" in captured.out
        
        # Verify checking logic
        assert "Duplicate image ID" in captured.out
        assert "Taxonomy Ambiguity" in captured.out
        assert "Box out of image bounds" in captured.out
        assert "Zero or negative box width/height" in captured.out
        assert "Missing image reference" in captured.out

