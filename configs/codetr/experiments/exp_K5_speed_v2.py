_base_ = ['exp_K5_balanced_r18.py']

# Candidate B: 120 queries, 100 DN, 3 enc / 3 dec, 640x384
model = dict(
    query_head=dict(
        num_query=120,
    )
)
data = dict(
    persistent_workers=True,
)
