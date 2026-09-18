_base_ = ['exp_K5_speed_fp16.py']

# ─────────────────────────────────────────────────────────────────
# K5 Batch-size-8 experiment config.
#
# PURPOSE: Diagnostic experiment only.
# Determines whether bs=8 fits in T4 VRAM (14.56 GB, ~11.05 GB peak at bs=4)
# and whether higher GPU utilization reduces step time enough for <10 min/epoch.
#
# EPOCH TIME MATH:
#   bs=4: 3780/4 = 946 iters  x step_time => need step_time <= 0.634 s
#   bs=8: 3780/8 = 473 iters  x step_time => need step_time <= 1.268 s
#   bs=6: 3780/6 = 630 iters  x step_time => need step_time <= 0.952 s
#
# VRAM LINEAR ESTIMATE: 11.05 GB * (8/4) = 22.1 GB -- likely OOM.
# VRAM REALISTIC (activations sub-linear): ~15-16 GB -- may fit.
# If OOM at bs=8, try bs=6 config exp_K5_speed_fp16_bs6.py.
#
# K5 architecture, data, annotations: COMPLETELY UNCHANGED.
# ─────────────────────────────────────────────────────────────────
data = dict(
    samples_per_gpu=8,
    workers_per_gpu=4,
    persistent_workers=True,
    pin_memory=True,
    prefetch_factor=2,
)
