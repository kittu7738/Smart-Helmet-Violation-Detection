# Co-DETR Training Module

> **"Robust Motorcycle Helmet Detection in Real-World Scenarios: Using Co-DETR and Minority Class Enhancement"** (CVPRW 2024)

---

## Entry Points

| Script | Purpose |
|:-------|:--------|
| [`train.py`](train.py) | Launch Co-DETR training via MMDetection |
| [`sanity_check.py`](sanity_check.py) | Verify config, dataset, GPU, and model before training |

---

## Quick Start (Google Colab)

```bash
# 1. Set the data root (your COCO-format dataset)
export CODETR_DATA_ROOT=/content/drive/MyDrive/helmet_dataset/coco

# 2. Run the sanity check first
python training/codetr/sanity_check.py

# 3. If all checks pass, start training
python training/codetr/train.py \
    --config configs/codetr/helmet_codetr_swin_large.py \
    --work-dir work_dirs/helmet_codetr
```

---

## Environment Variables

All paths are configurable — **never hard-code personal Google Drive paths**.

| Variable | Default | Description |
|:---------|:--------|:------------|
| `CODETR_DATA_ROOT` | `data/coco` | Root of the COCO-format dataset |
| `CODETR_WORK_DIR` | `work_dirs/helmet_codetr` | Checkpoints & logs output |
| `CODETR_REPO` | `/content/Co-DETR` | Path to the cloned Co-DETR repository |

CLI arguments `--data-root`, `--work-dir` take priority over env vars.

---

## Expected Dataset Layout

```
$CODETR_DATA_ROOT/
├── instances_train.json    # COCO annotations (7 classes)
├── instances_val.json
├── instances_test.json     # optional
├── train/                  # training images
├── val/                    # validation images
└── test/                   # optional test images
```

The dataset is **not** stored in Git. Supply it via Google Drive mount or
direct upload.

---

## Configuration

The training config lives at:
[`configs/codetr/helmet_codetr_swin_large.py`](../../configs/codetr/helmet_codetr_swin_large.py)

Key settings:
- **Backbone**: Swin-Large (ImageNet-22K pretrained)
- **Classes**: 7 (temporary helmet dataset)
- **Batch size**: 1 (safe for T4 16 GB VRAM)
- **Optimizer**: AdamW, lr=1e-4
- **Schedule**: 1× (12 epochs, step decay at 8 & 11)

Override any setting at runtime:
```bash
python training/codetr/train.py \
    --cfg-options optimizer.lr=2e-4 runner.max_epochs=24
```

---

## Sanity Check

Run before training to catch configuration and data issues early:

```bash
python training/codetr/sanity_check.py --data-root /path/to/coco
```

Checks performed:
1. ✔ Config file parses
2. ✔ Dataset files exist (annotations + image dirs)
3. ✔ Class count matches config (7)
4. ✔ At least one image loads
5. ✔ GPU / CUDA available
6. ✔ Model instantiates and runs `extract_feat`
