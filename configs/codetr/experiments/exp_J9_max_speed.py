_base_ = ['exp_J8_combined.py']

model = dict(
    backbone=dict(
        frozen_stages=4 # Freeze all 4 stages of ResNet-18
    )
)
