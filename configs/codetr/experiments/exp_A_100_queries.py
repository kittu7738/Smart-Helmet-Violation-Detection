_base_ = ['../helmet_codetr_r50.py']

model = dict(
    query_head=dict(
        num_query=100,
        dn_cfg=dict(
            group_cfg=dict(
                num_dn_queries=100,
            )
        )
    )
)
