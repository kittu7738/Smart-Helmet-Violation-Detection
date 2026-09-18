_base_ = ['exp_K5_balanced_r18.py']

# Candidate E: 100 queries, 50 DN, 3 enc / 3 dec, 640x384
model = dict(
    query_head=dict(
        num_query=100,
        dn_cfg=dict(
            group_cfg=dict(
                num_dn_queries=50,
            )
        )
    )
)
data = dict(
    persistent_workers=True,
)
