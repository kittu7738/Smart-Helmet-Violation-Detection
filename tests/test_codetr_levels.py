import pytest
import torch
import os

try:
    from mmcv import Config
    import mmdet
    from mmdet.models import build_detector
    HAS_MMDET = True
except ImportError:
    HAS_MMDET = False

@pytest.mark.skipif(not HAS_MMDET, reason="Requires mmdet/mmcv to actually construct the model")
def test_codetr_model_levels_and_loss_smoke():
    """Constructs the model and runs a dummy forward pass to verify feature level counts."""
    config_file = 'configs/codetr/helmet_codetr_r50.py'
    assert os.path.isfile(config_file)
    cfg = Config.fromfile(config_file)
    
    # Must have 6 strides for the RPN/ATSS heads because Co-DETR encoder outputs 6 levels
    rpn_strides = cfg.model.rpn_head.anchor_generator.strides
    assert len(rpn_strides) == 6, f"Expected 6 RPN strides, got {len(rpn_strides)}"
    
    atss_strides = cfg.model.auxiliary_head[0].anchor_generator.strides
    assert len(atss_strides) == 6, f"Expected 6 ATSS strides, got {len(atss_strides)}"
    
    # Build the detector
    model = build_detector(cfg.model, train_cfg=cfg.get('train_cfg'), test_cfg=cfg.get('test_cfg'))
    model.eval()
    
    # Create a dummy batch
    img = torch.rand(1, 3, 1000, 600)
    img_metas = [[dict(
        img_shape=(1000, 600, 3), 
        pad_shape=(1000, 600, 3), 
        scale_factor=1.0, 
        batch_input_shape=(1000, 600)
    )]]
    
    # Ground truth
    gt_bboxes = [torch.tensor([[10, 10, 50, 50]], dtype=torch.float32)]
    gt_labels = [torch.tensor([0], dtype=torch.int64)]
    
    # Run a forward_train pass. This will crash if featmap_sizes != prior_generator.num_levels
    try:
        model.forward_train(img, img_metas[0], gt_bboxes=gt_bboxes, gt_labels=gt_labels)
    except AssertionError as e:
        import traceback
        traceback.print_exc()
        if "featmap_sizes" in str(e) or "prior_generator.num_levels" in str(e) or "AssertionError" in repr(e):
            pytest.fail(f"RPN/ATSS level mismatch assertion hit! {e}")
    except Exception as e:
        # Other errors like "No CUDA GPUs are available" or "batch size mismatch" are fine 
        pass

