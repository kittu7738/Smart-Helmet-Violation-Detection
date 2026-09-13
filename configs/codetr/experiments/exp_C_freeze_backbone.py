_base_ = ['../helmet_codetr_r50.py']

model = dict(
    backbone=dict(
        frozen_stages=4 # Freeze all 4 stages of ResNet-50. Greatly speeds up backward pass.
    )
)
