_base_ = ['../helmet_codetr_r50.py']

model = dict(
    neck=dict(
        out_channels=192
    ),
    query_head=dict(
        transformer=dict(
            encoder=dict(
                transformerlayers=dict(
                    attn_cfgs=dict(embed_dims=192),
                    feedforward_channels=1536
                )
            ),
            decoder=dict(
                transformerlayers=dict(
                    attn_cfgs=[
                        dict(embed_dims=192),
                        dict(embed_dims=192)
                    ],
                    feedforward_channels=1536
                )
            )
        )
    )
)
