_base_ = ['exp_J4_res_416.py']

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
