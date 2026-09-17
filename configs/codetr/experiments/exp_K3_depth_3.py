_base_ = ['exp_J8_combined.py']

model = dict(
    query_head=dict(
        transformer=dict(
            encoder=dict(num_layers=3),
            decoder=dict(num_layers=3)
        )
    )
)
