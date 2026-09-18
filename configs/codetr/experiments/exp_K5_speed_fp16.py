_base_ = ['exp_K5_balanced_r18.py']

# Exact K5 architecture with dynamic FP16 enabled (Turing Tensor Cores)
# 150 queries, 100 DN, 3 enc / 3 dec, 640x384
fp16 = dict(loss_scale=dict(init_scale=512.0))
data = dict(
    persistent_workers=True,
)
