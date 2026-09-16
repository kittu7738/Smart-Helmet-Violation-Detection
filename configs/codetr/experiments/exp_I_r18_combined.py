_base_ = ['exp_H_combined.py']

model = dict(
    backbone=dict(
        depth=18,
        frozen_stages=1, # Don't freeze all stages, just let it train since it's light
        init_cfg=dict(type='Pretrained', checkpoint='torchvision://resnet18')
    ),
    neck=dict(
        in_channels=[64, 128, 256, 512]
    )
)
