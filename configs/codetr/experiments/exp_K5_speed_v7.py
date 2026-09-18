_base_ = ['exp_K5_balanced_r18.py']

# Candidate G: 100 queries, 50 DN, 2 enc / 2 dec, 640x384
model = dict(
    query_head=dict(
        num_query=100,
        transformer=dict(
            encoder=dict(num_layers=2),
            decoder=dict(num_layers=2)
        ),
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
