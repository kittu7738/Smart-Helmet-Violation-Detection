#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "  CO-DETR ACCURACY RECOVERY MATRIX K (T4)"
echo "=================================================="

has_data_root=false
for arg in "$@"; do
    if [[ "$arg" == "--data-root" || "$arg" == "--data-root="* ]]; then
        has_data_root=true
        break
    fi
done

if [ "$has_data_root" = false ]; then
    if [ ! -d "/content/dataset_local" ]; then
        echo "[ERROR] No --data-root provided and /content/dataset_local is missing."
        echo "Please provide --data-root /path/to/drive/dataset"
        exit 1
    fi
fi

# Baseline J8
echo "--------------------------------------------------"
echo "  BASELINE: EXPERIMENT J8 (416x256, 50Q, R18, D1)"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_J8_combined.py --benchmark-throughput "$@"

# K1. Resolution 640x384
echo "--------------------------------------------------"
echo "  EXPERIMENT K1: RESOLUTION 640x384"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_K1_res_640.py --benchmark-throughput "$@"

# K2. Queries 150
echo "--------------------------------------------------"
echo "  EXPERIMENT K2: 150 QUERIES"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_K2_queries_150.py --benchmark-throughput "$@"

# K3. Depth 3
echo "--------------------------------------------------"
echo "  EXPERIMENT K3: ENCODER/DECODER DEPTH 3"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_K3_depth_3.py --benchmark-throughput "$@"

# K4. ResNet-50
echo "--------------------------------------------------"
echo "  EXPERIMENT K4: RESNET-50 BACKBONE"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_K4_r50.py --benchmark-throughput "$@"

# K5. Balanced R18
echo "--------------------------------------------------"
echo "  EXPERIMENT K5: BALANCED R18 (640x384, 150Q, D3)"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_K5_balanced_r18.py --benchmark-throughput "$@"

echo "=================================================="
echo "  MATRIX K COMPLETE"
echo "=================================================="
