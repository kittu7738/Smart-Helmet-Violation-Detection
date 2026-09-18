_base_ = ['exp_K5_balanced_r18.py']

# Candidate A: Full K5 Architecture (Reference for Speed Optimization)
# 150 queries, 100 DN, 3 enc / 3 dec, 640x384
data = dict(
    persistent_workers=True,
)
