_base_ = ['exp_J8_combined.py']

model = dict(
    query_head=dict(
        num_query=150,
        dn_cfg=dict(
            group_cfg=dict(
                num_dn_queries=100, # Max safe dn_queries
            )
        )
    )
)
