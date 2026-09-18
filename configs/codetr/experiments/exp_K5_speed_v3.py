_base_ = ['exp_K5_balanced_r18.py']

# Candidate C: 100 queries, 100 DN, 3 enc / 3 dec, 640x384
model = dict(
    query_head=dict(
        num_query=100,
    )
)
data = dict(
    persistent_workers=True,
)
