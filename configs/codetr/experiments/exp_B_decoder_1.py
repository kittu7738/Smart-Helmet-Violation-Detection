_base_ = ['../helmet_codetr_r50.py']

model = dict(
    query_head=dict(
        transformer=dict(
            decoder=dict(
                num_layers=1
            )
        )
    )
)
