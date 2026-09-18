_base_ = ['exp_K5_balanced_r18.py']

# Candidate D: 100 queries, 75 DN, 3 enc / 3 dec, 640x384
model = dict(
    query_head=dict(
        num_query=100,
        dn_cfg=dict(
            group_cfg=dict(
                num_dn_queries=75,
            )
        )
    )
)
data = dict(
    persistent_workers=True,
)
