# Evaluation Protocols — Helmet Violation Detection

This directory contains evaluation tools for measuring detection accuracy.

---

## Co-DETR Evaluation

**Script**: [`codetr/evaluate.py`](codetr/evaluate.py)

Runs inference on the validation or test split using a trained checkpoint
and computes COCO mAP metrics.

### Usage (Google Colab)

```bash
python evaluation/codetr/evaluate.py \
    --config configs/codetr/helmet_codetr_swin_large.py \
    --checkpoint work_dirs/helmet_codetr/latest.pth \
    --data-root /content/drive/MyDrive/helmet_dataset/coco \
    --eval bbox
```

### Evaluate on Test Split

```bash
python evaluation/codetr/evaluate.py \
    --config configs/codetr/helmet_codetr_swin_large.py \
    --checkpoint work_dirs/helmet_codetr/latest.pth \
    --split test \
    --eval bbox
```

### Save Visualisations

```bash
python evaluation/codetr/evaluate.py \
    --checkpoint work_dirs/helmet_codetr/latest.pth \
    --show-dir results/vis/
```

### Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `CODETR_DATA_ROOT` | `data/coco` | Root of the COCO-format dataset |
| `CODETR_REPO` | `/content/Co-DETR` | Path to the Co-DETR source |

---

## Metrics

- **Primary metric**: mean Average Precision (mAP) across all 7 classes.
- **Target benchmark**: paper's reported mAP 0.4860 on 9-class AI City Track 5.
- **Current dataset**: 7-class temporary helmet dataset (COCO format).
