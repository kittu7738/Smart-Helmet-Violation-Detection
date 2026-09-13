#!/bin/bash
echo "=================================================="
echo "  CO-DETR R50 BENCHMARK MATRIX (T4)"
echo "=================================================="

# 0. Profile Baseline
echo "--------------------------------------------------"
echo "  PROFILING BASELINE COMPONENT BOTTLENECKS"
echo "--------------------------------------------------"
CODETR_PROFILE_COMPONENTS=1 python training/codetr/train.py --config configs/codetr/helmet_codetr_r50.py --benchmark-throughput

# A. 100 Queries
echo "--------------------------------------------------"
echo "  EXPERIMENT A: 100 QUERIES"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_A_100_queries.py --benchmark-throughput

# B. Decoder Depth = 1
echo "--------------------------------------------------"
echo "  EXPERIMENT B: DECODER DEPTH = 1"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_B_decoder_1.py --benchmark-throughput

# C. Freeze Backbone
echo "--------------------------------------------------"
echo "  EXPERIMENT C: FREEZE ALL BACKBONE STAGES"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_C_freeze_backbone.py --benchmark-throughput

# D. Width = 192
echo "--------------------------------------------------"
echo "  EXPERIMENT D: FEATURE WIDTH = 192"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_D_width_192.py --benchmark-throughput

echo "=================================================="
echo "  MATRIX COMPLETE"
echo "=================================================="
