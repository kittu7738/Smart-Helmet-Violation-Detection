_base_ = ['exp_J8_combined.py']

model = dict(
    backbone=dict(
        depth=50,
        frozen_stages=1, # Make it trainable
        init_cfg=dict(type='Pretrained', checkpoint='torchvision://resnet50')
    ),
    neck=dict(
        in_channels=[256, 512, 1024, 2048]
    )
)
