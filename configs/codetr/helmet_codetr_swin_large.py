# -----------------------------------------------------------------------
# helmet_codetr_swin_large.py
#
# Project-specific Co-DETR configuration for Smart Helmet Violation
# Detection.  Adapted from the upstream Co-DETR config:
#   projects/configs/co_dino/co_dino_5scale_swin_large_1x_coco.py
#
# DO NOT edit the original Co-DETR repository files.
# This file is used for the TEMPORARY 7-class helmet dataset only.
#
# Environment
#   Python      3.7.11
#   PyTorch     1.11.0+cu113
#   MMCV        1.5.0
#   MMDetection 2.25.3
#
# Dataset layout expected on disk (relative to the repo root or
# /content/Smart-Helmet-Violation-Detection/ in Colab):
#   data/coco/instances_train.json
#   data/coco/instances_val.json
#   data/coco/instances_test.json
#   data/coco/train/<images>
#   data/coco/val/<images>
#   data/coco/test/<images>
# -----------------------------------------------------------------------

# ------------------------------------------------------------------
# Class definitions  (7 temporary helmet classes, 0-indexed)
# ------------------------------------------------------------------
CLASSES = (
    'driver_with_helmet',       # 0
    'bike',                     # 1
    'driver',                   # 2
    'passenger_with_helmet',    # 3
    'passenger',                # 4
    'driver_without_helmet',    # 5
    'passenger_without_helmet', # 6
)
num_classes = 7  # override here so all downstream uses stay in sync

# ------------------------------------------------------------------
# Dataset
# ------------------------------------------------------------------
dataset_type = 'CocoDataset'
data_root = 'data/coco/'

# ------------------------------------------------------------------
# Image normalization (ImageNet mean/std, same as upstream)
# ------------------------------------------------------------------
img_norm_cfg = dict(
    mean=[123.675, 116.28, 103.53],
    std=[58.395, 57.12, 57.375],
    to_rgb=True,
)

# ------------------------------------------------------------------
# Multi-scale training image sizes (5 scales, matching upstream)
# Reduced slightly from COCO defaults to fit T4 16 GB VRAM
# ------------------------------------------------------------------
image_size = (1024, 1024)

train_pipeline = [
    dict(type='LoadImageFromFile'),
    dict(type='LoadAnnotations', with_bbox=True),
    dict(
        type='RandomFlip',
        flip_ratio=0.5,
    ),
    dict(
        type='AutoAugment',
        policies=[
            [
                dict(
                    type='Resize',
                    img_scale=[
                        (480, 1333),
                        (512, 1333),
                        (544, 1333),
                        (576, 1333),
                        (608, 1333),
                        (640, 1333),
                        (672, 1333),
                        (704, 1333),
                        (736, 1333),
                        (768, 1333),
                        (800, 1333),
                    ],
                    multiscale_mode='value',
                    keep_ratio=True,
                )
            ],
            [
                dict(
                    type='Resize',
                    img_scale=[(400, 1333), (500, 1333), (600, 1333)],
                    multiscale_mode='value',
                    keep_ratio=True,
                ),
                dict(
                    type='RandomCrop',
                    crop_type='absolute_range',
                    crop_size=(384, 600),
                    allow_negative_crop=True,
                ),
                dict(
                    type='Resize',
                    img_scale=[
                        (480, 1333),
                        (512, 1333),
                        (544, 1333),
                        (576, 1333),
                        (608, 1333),
                        (640, 1333),
                        (672, 1333),
                        (704, 1333),
                        (736, 1333),
                        (768, 1333),
                        (800, 1333),
                    ],
                    multiscale_mode='value',
                    override=True,
                    keep_ratio=True,
                ),
            ],
        ],
    ),
    dict(type='Normalize', **img_norm_cfg),
    dict(type='Pad', size_divisor=32),
    dict(type='DefaultFormatBundle'),
    dict(type='Collect', keys=['img', 'gt_bboxes', 'gt_labels']),
]

test_pipeline = [
    dict(type='LoadImageFromFile'),
    dict(
        type='MultiScaleFlipAug',
        img_scale=(1333, 800),
        flip=False,
        transforms=[
            dict(type='Resize', keep_ratio=True),
            dict(type='RandomFlip'),
            dict(type='Normalize', **img_norm_cfg),
            dict(type='Pad', size_divisor=32),
            dict(type='ImageToTensor', keys=['img']),
            dict(type='Collect', keys=['img']),
        ],
    ),
]

data = dict(
    samples_per_gpu=1,   # adjust if memory allows
    workers_per_gpu=2,
    train=dict(
        type=dataset_type,
        ann_file=data_root + 'instances_train.json',
        img_prefix=data_root + 'train/',
        classes=CLASSES,
        pipeline=train_pipeline,
    ),
    val=dict(
        type=dataset_type,
        ann_file=data_root + 'instances_val.json',
        img_prefix=data_root + 'val/',
        classes=CLASSES,
        pipeline=test_pipeline,
    ),
    test=dict(
        type=dataset_type,
        ann_file=data_root + 'instances_test.json',
        img_prefix=data_root + 'test/',
        classes=CLASSES,
        pipeline=test_pipeline,
    ),
)

# ------------------------------------------------------------------
# Evaluation
# ------------------------------------------------------------------
evaluation = dict(interval=1, metric='bbox')

# ------------------------------------------------------------------
# Model  (Co-DINO / Co-DETR with Swin-L backbone – 5-scale FPN)
# Mirrors the upstream co_dino_5scale_swin_large_1x_coco.py exactly,
# except num_classes is overridden to 7.
# ------------------------------------------------------------------
pretrained = 'https://github.com/SwinTransformer/storage/releases/download/v1.0.0/swin_large_patch4_window12_384_22k.pth'  # noqa

model = dict(
    type='CoDETR',
    backbone=dict(
        type='SwinTransformer',
        pretrain_img_size=384,
        embed_dims=192,
        depths=[2, 2, 18, 2],
        num_heads=[6, 12, 24, 48],
        window_size=12,
        mlp_ratio=4,
        qkv_bias=True,
        qk_scale=None,
        drop_rate=0.,
        attn_drop_rate=0.,
        drop_path_rate=0.3,
        patch_norm=True,
        out_indices=(0, 1, 2, 3),
        with_cp=True,
        convert_weights=True,
        init_cfg=dict(
            type='Pretrained',
            checkpoint=pretrained,
        ),
    ),
    neck=dict(
        type='ChannelMapper',
        in_channels=[192, 384, 768, 1536],
        kernel_size=1,
        out_channels=256,
        act_cfg=None,
        norm_cfg=dict(type='GN', num_groups=32),
        num_outs=5,
    ),
    query_head=dict(
        type='CoDINOHead',
        num_query=900,
        num_classes=num_classes,
        in_channels=2048,
        sync_cls_avg_factor=True,
        with_box_refine=True,
        as_two_stage=True,
        mixed_selection=True,
        transformer=dict(
            type='CoDinoTransformer',
            with_coord_feat=False,
            num_co_heads=2,
            num_feature_levels=5,
            encoder=dict(
                type='DetrTransformerEncoder',
                num_layers=6,
                with_cp=6,
                transformerlayers=dict(
                    type='BaseTransformerLayer',
                    attn_cfgs=dict(
                        type='MultiScaleDeformAttn',
                        embed_dims=256,
                        num_levels=5,
                        dropout=0.0,
                    ),
                    feedforward_channels=2048,
                    ffn_dropout=0.0,
                    operation_order=('self_attn', 'norm', 'ffn', 'norm'),
                ),
            ),
            decoder=dict(
                type='DinoTransformerDecoder',
                num_layers=6,
                return_intermediate=True,
                transformerlayers=dict(
                    type='DetrTransformerDecoderLayer',
                    attn_cfgs=[
                        dict(
                            type='MultiheadAttention',
                            embed_dims=256,
                            num_heads=8,
                            dropout=0.0,
                        ),
                        dict(
                            type='MultiScaleDeformAttn',
                            embed_dims=256,
                            num_levels=5,
                            dropout=0.0,
                        ),
                    ],
                    feedforward_channels=2048,
                    ffn_dropout=0.0,
                    operation_order=(
                        'self_attn', 'norm',
                        'cross_attn', 'norm',
                        'ffn', 'norm',
                    ),
                ),
            ),
        ),
        positional_encoding=dict(
            type='SinePositionalEncoding',
            num_feats=128,
            temperature=20,
            normalize=True,
        ),
        loss_cls=dict(
            type='FocalLoss',
            use_sigmoid=True,
            gamma=2.0,
            alpha=0.25,
            loss_weight=1.0,
        ),
        loss_bbox=dict(type='L1Loss', loss_weight=5.0),
        loss_iou=dict(type='GIoULoss', loss_weight=2.0),
    ),
    rpn_head=dict(
        type='RPNHead',
        in_channels=256,
        feat_channels=256,
        anchor_generator=dict(
            type='AnchorGenerator',
            octave_base_scale=4,
            scales_per_octave=3,
            ratios=[0.5, 1.0, 2.0],
            strides=[4, 8, 16, 32, 64, 128],
        ),
        bbox_coder=dict(
            type='DeltaXYWHBBoxCoder',
            target_means=[0.0, 0.0, 0.0, 0.0],
            target_stds=[1.0, 1.0, 1.0, 1.0],
        ),
        loss_cls=dict(
            type='CrossEntropyLoss',
            use_sigmoid=True,
            loss_weight=1.0 * 2,
        ),
        loss_bbox=dict(type='L1Loss', loss_weight=1.0 * 2),
    ),
    roi_head=[
        dict(
            type='CoStandardRoIHead',
            bbox_roi_extractor=dict(
                type='SingleRoIExtractor',
                roi_layer=dict(type='RoIAlign', output_size=7, sampling_ratio=0),
                out_channels=256,
                featmap_strides=[4, 8, 16, 32, 64],
                finest_scale=56,
            ),
            bbox_head=dict(
                type='Shared2FCBBoxHead',
                in_channels=256,
                fc_out_channels=1024,
                roi_feat_size=7,
                num_classes=num_classes,
                bbox_coder=dict(
                    type='DeltaXYWHBBoxCoder',
                    target_means=[0., 0., 0., 0.],
                    target_stds=[0.1, 0.1, 0.2, 0.2],
                ),
                reg_class_agnostic=False,
                loss_cls=dict(
                    type='CrossEntropyLoss',
                    use_sigmoid=False,
                    loss_weight=1.0 * 2,
                ),
                loss_bbox=dict(type='L1Loss', loss_weight=1.0 * 2),
            ),
        )
    ],
    bbox_head=[
        dict(
            type='CoATSSHead',
            num_classes=num_classes,
            in_channels=256,
            stacked_convs=1,
            feat_channels=256,
            anchor_generator=dict(
                type='AnchorGenerator',
                ratios=[1.0],
                octave_base_scale=8,
                scales_per_octave=1,
                center_offset=0.0,
                strides=[4, 8, 16, 32, 64, 128],
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
                loss_weight=1.0 * 2,
            ),
            loss_bbox=dict(type='GIoULoss', loss_weight=2.0 * 2),
            loss_centerness=dict(
                type='CrossEntropyLoss',
                use_sigmoid=True,
                loss_weight=1.0 * 2,
            ),
        ),
    ],
    train_cfg=[
        # Co-DINO query head
        dict(
            assigner=dict(
                type='HungarianAssigner',
                cls_cost=dict(type='FocalLossCost', weight=2.0),
                reg_cost=dict(type='BBoxL1Cost', weight=5.0, box_format='xywh'),
                iou_cost=dict(type='IoUCost', iou_mode='giou', weight=2.0),
            ),
        ),
        # RPN
        dict(
            rpn=dict(
                assigner=dict(
                    type='MaxIoUAssigner',
                    pos_iou_thr=0.7,
                    neg_iou_thr=0.3,
                    min_pos_iou=0.3,
                    match_low_quality=True,
                    ignore_iof_thr=-1,
                ),
                sampler=dict(
                    type='RandomSampler',
                    num=256,
                    pos_fraction=0.5,
                    neg_pos_ub=-1,
                    add_gt_as_proposals=False,
                ),
                allowed_border=-1,
                pos_weight=-1,
                debug=False,
            ),
            rpn_proposal=dict(
                nms_pre=4000,
                max_per_img=1000,
                nms=dict(type='nms', iou_threshold=0.7),
                min_bbox_size=0,
            ),
            rcnn=dict(
                assigner=dict(
                    type='MaxIoUAssigner',
                    pos_iou_thr=0.5,
                    neg_iou_thr=0.5,
                    min_pos_iou=0.5,
                    match_low_quality=False,
                    ignore_iof_thr=-1,
                ),
                sampler=dict(
                    type='RandomSampler',
                    num=512,
                    pos_fraction=0.25,
                    neg_pos_ub=-1,
                    add_gt_as_proposals=True,
                ),
                pos_weight=-1,
                debug=False,
            ),
        ),
        # ATSS auxiliary head
        dict(
            assigner=dict(type='ATSSAssigner', topk=9),
            allowed_border=-1,
            pos_weight=-1,
            debug=False,
        ),
    ],
    test_cfg=[
        # Co-DINO query head
        dict(max_per_img=300),
        # RPN/ROI
        dict(
            rpn=dict(
                nms_pre=1000,
                max_per_img=1000,
                nms=dict(type='nms', iou_threshold=0.7),
                min_bbox_size=0,
            ),
            rcnn=dict(
                score_thr=0.0,
                nms=dict(type='nms', iou_threshold=0.5),
                max_per_img=100,
            ),
        ),
        # ATSS auxiliary head
        dict(
            nms_pre=1000,
            min_bbox_size=0,
            score_thr=0.0,
            nms=dict(type='nms', iou_threshold=0.6),
            max_per_img=100,
        ),
    ],
)

# ------------------------------------------------------------------
# Optimizer  (AdamW, mirrors upstream 1x schedule)
# ------------------------------------------------------------------
optimizer = dict(
    type='AdamW',
    lr=1e-4,
    weight_decay=0.0001,
    paramwise_cfg=dict(
        custom_keys={
            'backbone': dict(lr_mult=0.1),
            'sampling_offsets': dict(lr_mult=0.1),
            'reference_points': dict(lr_mult=0.1),
        },
    ),
)
optimizer_config = dict(
    grad_clip=dict(max_norm=0.1, norm_type=2),
)

# 1× schedule (12 epochs)
lr_config = dict(
    policy='step',
    step=[8, 11],
)
max_epochs = 12
runner = dict(type='EpochBasedRunner', max_epochs=max_epochs)

# ------------------------------------------------------------------
# Logging, checkpointing, and work directory
# ------------------------------------------------------------------
checkpoint_config = dict(interval=1)
log_config = dict(
    interval=50,
    hooks=[
        dict(type='TextLoggerHook'),
    ],
)
custom_hooks = [dict(type='SetEpochInfoHook')]

dist_params = dict(backend='nccl')
log_level = 'INFO'
load_from = None   # set to a .pth path if using a pretrained checkpoint
resume_from = None
workflow = [('train', 1)]
find_unused_parameters = False

# This must match the location of the Co-DETR repo when running in Colab.
# Example: if Co-DETR is cloned to /content/Co-DETR, set
#   PYTHONPATH=/content/Co-DETR:$PYTHONPATH
# before launching training.
