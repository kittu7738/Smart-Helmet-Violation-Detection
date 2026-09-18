_base_ = ['exp_K5_balanced_r18.py']

# Exact K5 architecture with dynamic FP16 enabled (Turing Tensor Cores)
# 150 queries, 100 DN, 3 enc / 3 dec, 640x384
fp16 = dict(loss_scale=dict(init_scale=512.0))

# Safe system-level optimizations (Zero architecture / model changes):
# 1. cuDNN autotuning for fixed 640x384 resolution (optimal Tensor Core convolution kernels)
cudnn_benchmark = True

# 2. TF32 mode: T4 (Turing) supports TF32 for both matmul and cuDNN convolutions.
#    Gives ~3-4x speedup on GEMM with 10-bit mantissa (vs 23-bit FP32), safe with FP16 AMP.
#    Enabled by train.py at startup when this flag is set True.
enable_tf32 = True

# 3. High-throughput DataLoader: 4 worker processes, persistent workers, pinned memory, prefetching
data = dict(
    samples_per_gpu=4,
    workers_per_gpu=4,
    persistent_workers=True,
    pin_memory=True,
    prefetch_factor=2,
)

# 4. Reduce log interval: base config logs every 10 iters; each log call formats and prints
#    a dict of all loss components. Reducing to 50 cuts 5x logging overhead per epoch
#    (946 iters/epoch at bs=4: 94 logs → 18 logs, saving ~76 dict-format+print calls/epoch).
#    Training behavior, loss computation, and gradient updates are completely unaffected.
log_config = dict(
    interval=50,
    hooks=[dict(type='TextLoggerHook')],
)
