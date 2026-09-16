#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status

echo "=================================================="
echo "  CO-DETR BENCHMARK MATRIX J (T4)"
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

# I. Baseline Experiment I
echo "--------------------------------------------------"
echo "  PROFILING BASELINE (EXPERIMENT I)"
echo "--------------------------------------------------"
CODETR_PROFILE_COMPONENTS=1 python training/codetr/train.py --config configs/codetr/experiments/exp_I_r18_combined.py --benchmark-throughput "$@"

# J1. Query Reduction
echo "--------------------------------------------------"
echo "  EXPERIMENT J1: 64 QUERIES"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_J1_queries_64.py --benchmark-throughput "$@"

# J2. Query Reduction
echo "--------------------------------------------------"
echo "  EXPERIMENT J2: 50 QUERIES"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_J2_queries_50.py --benchmark-throughput "$@"

# J3. Resolution Reduction
echo "--------------------------------------------------"
echo "  EXPERIMENT J3: RESOLUTION 448x288"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_J3_res_448.py --benchmark-throughput "$@"

# J4. Resolution Reduction
echo "--------------------------------------------------"
echo "  EXPERIMENT J4: RESOLUTION 416x256"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_J4_res_416.py --benchmark-throughput "$@"

# J8. Combined Conservative
echo "--------------------------------------------------"
echo "  EXPERIMENT J8: COMBINED (416x256, 50 queries)"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_J8_combined.py --benchmark-throughput "$@"

# J9. Max Speed
echo "--------------------------------------------------"
echo "  EXPERIMENT J9: MAX SPEED (J8 + Frozen Backbone)"
echo "--------------------------------------------------"
python training/codetr/train.py --config configs/codetr/experiments/exp_J9_max_speed.py --benchmark-throughput "$@"

echo "=================================================="
echo "  MATRIX J COMPLETE"
echo "=================================================="
