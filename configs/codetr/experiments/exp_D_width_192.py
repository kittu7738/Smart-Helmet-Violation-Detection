_base_ = ['../helmet_codetr_r50.py']

num_classes = 7

model = dict(
    neck=dict(
        out_channels=192
    ),
    query_head=dict(
        positional_encoding=dict(
            num_feats=96,
        ),
        transformer=dict(
            encoder=dict(
                transformerlayers=dict(
                    attn_cfgs=dict(
                        type='MultiScaleDeformableAttention',
                        embed_dims=192,
                        num_levels=5,
                        dropout=0.0,
                    ),
                    feedforward_channels=1536,
                    ffn_cfgs=dict(
                        type='FFN',
                        embed_dims=192,
                        feedforward_channels=1536,
                        num_fcs=2,
                        ffn_drop=0.0,
                        act_cfg=dict(type='ReLU', inplace=True)
                    )
                )
            ),
            decoder=dict(
                transformerlayers=dict(
                    attn_cfgs=[
                        dict(
                            type='MultiheadAttention',
                            embed_dims=192,
                            num_heads=8,
                            dropout=0.0,
                        ),
                        dict(
                            type='MultiScaleDeformableAttention',
                            embed_dims=192,
                            num_levels=5,
                            dropout=0.0,
                        ),
                    ],
                    feedforward_channels=1536,
                    ffn_cfgs=dict(
                        type='FFN',
                        embed_dims=192,
                        feedforward_channels=1536,
                        num_fcs=2,
                        ffn_drop=0.0,
                        act_cfg=dict(type='ReLU', inplace=True)
                    )
                )
            )
        )
    ),
    rpn_head=dict(
        in_channels=192,
        feat_channels=192
    ),
    roi_head=[
        dict(
            type='CoStandardRoIHead',
            bbox_roi_extractor=dict(
                type='SingleRoIExtractor',
                roi_layer=dict(type='RoIAlign', output_size=7, sampling_ratio=0),
                out_channels=192,
                featmap_strides=[4, 8, 16, 32, 96],
                finest_scale=56,
            ),
            bbox_head=dict(
                type='Shared2FCBBoxHead',
                in_channels=192,
                fc_out_channels=1536,
                roi_feat_size=7,
                num_classes=num_classes,
                bbox_coder=dict(
                    type='DeltaXYWHBBoxCoder',
                    target_means=[0., 0., 0., 0.],
                    target_stds=[0.1, 0.1, 0.2, 0.2],
                ),
                reg_class_agnostic=False,
                reg_decoded_bbox=True,
                loss_cls=dict(
                    type='CrossEntropyLoss',
                    use_sigmoid=False,
                    loss_weight=1.0 * 6 * 2.0,
                ),
                loss_bbox=dict(type='GIoULoss', loss_weight=10.0 * 6 * 2.0),
            ),
        )
    ],
    bbox_head=[
        dict(
            type='CoATSSHead',
            num_classes=num_classes,
            in_channels=192,
            stacked_convs=1,
            feat_channels=192,
            anchor_generator=dict(
                type='AnchorGenerator',
                ratios=[1.0],
                octave_base_scale=4,
                scales_per_octave=1,
                center_offset=0.0,
                strides=[4, 8, 16, 32, 96, 192],
            ),
            bbox_coder=dict(
                type='DeltaXYWHBBoxCoder',
                target_means=[.0, .0, .0, .0],
                target_stds=[0.1, 0.1, 0.2, 0.2],
            ),
            loss_cls=dict(
                type='FocalLoss',
                use_sigmoid=True,
                gamma=2.0,
                alpha=0.25,
                loss_weight=1.0 * 6 * 2.0,
            ),
            loss_bbox=dict(type='GIoULoss', loss_weight=2.0 * 6 * 2.0),
            loss_centerness=dict(
                type='CrossEntropyLoss',
                use_sigmoid=True,
                loss_weight=1.0 * 6 * 2.0,
            ),
        ),
    ]
)
