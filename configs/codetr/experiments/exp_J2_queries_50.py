_base_ = ['exp_I_r18_combined.py']

model = dict(
    query_head=dict(
        num_query=50,
        dn_cfg=dict(
            group_cfg=dict(
                num_dn_queries=50,
            )
        )
    )
)
