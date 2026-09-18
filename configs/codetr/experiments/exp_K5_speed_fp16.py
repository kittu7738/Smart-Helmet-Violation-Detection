_base_ = ['exp_K5_balanced_r18.py']

# Exact K5 architecture with dynamic FP16 enabled (Turing Tensor Cores)
# 150 queries, 100 DN, 3 enc / 3 dec, 640x384
fp16 = dict(loss_scale=dict(init_scale=512.0))

# Safe system-level optimizations (Zero architecture / model changes):
# 1. cuDNN autotuning for fixed 640x384 resolution (optimal Tensor Core convolution kernels)
cudnn_benchmark = True

# 2. High-throughput DataLoader: 4 worker processes, persistent workers, pinned memory, prefetching
data = dict(
    samples_per_gpu=4,
    workers_per_gpu=4,
    persistent_workers=True,
    pin_memory=True,
    prefetch_factor=2,
)
