_base_ = ['exp_K5_speed_fp16.py']

# ─────────────────────────────────────────────────────────────────
# K5 Batch-size-6 experiment config.
#
# PURPOSE: Fallback experiment if bs=8 causes OOM.
#
# EPOCH TIME MATH:
#   bs=6: 3780/6 = 630 iters  x step_time => need step_time <= 0.952 s
#
# K5 architecture, data, annotations: COMPLETELY UNCHANGED.
# ─────────────────────────────────────────────────────────────────
data = dict(
    samples_per_gpu=6,
    workers_per_gpu=4,
    persistent_workers=True,
    pin_memory=True,
    prefetch_factor=2,
)
