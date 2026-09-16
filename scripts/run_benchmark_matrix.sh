#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "  CO-DETR BENCHMARK MATRIX (T4)"
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

# 0. Profile Baseline
echo "--------------------------------------------------"
echo "  PROFILING BASELINE COMPONENT BOTTLENECKS"
echo "--------------------------------------------------"
CODETR_PROFILE_COMPONENTS=1 python training/codetr/train.py --config configs/codetr/helmet_codetr_r50.py --benchmark-throughput "$@"

# C. Freeze Backbone
echo "--------------------------------------------------"
echo "  EXPERIMENT C: FREEZE ALL BACKBONE STAGES"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_C_freeze_backbone.py --benchmark-throughput "$@"

# E. ResNet-18 Backbone
echo "--------------------------------------------------"
echo "  EXPERIMENT E: RESNET-18 BACKBONE"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_E_r18.py --benchmark-throughput "$@"

# F. Feature Width 128
echo "--------------------------------------------------"
echo "  EXPERIMENT F: FEATURE WIDTH = 128"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_F_width_128.py --benchmark-throughput "$@"

# G. Input Resolution 512x320
echo "--------------------------------------------------"
echo "  EXPERIMENT G: RESOLUTION 512x320"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_G_res_512.py --benchmark-throughput "$@"

# H. Combined (ResNet-50 Frozen)
echo "--------------------------------------------------"
echo "  EXPERIMENT H: COMBINED (R50 Frozen, 512x320, 100Q, Depth 1)"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_H_combined.py --benchmark-throughput "$@"

# I. Combined (ResNet-18)
echo "--------------------------------------------------"
echo "  EXPERIMENT I: COMBINED (R18, 512x320, 100Q, Depth 1)"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_I_r18_combined.py --benchmark-throughput "$@"

echo "=================================================="
echo "  MATRIX COMPLETE"
echo "=================================================="
