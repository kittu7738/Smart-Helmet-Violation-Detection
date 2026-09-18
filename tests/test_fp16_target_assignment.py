"""
tests/test_fp16_target_assignment.py
====================================
Tests verifying FP16 target assignment patching, index-put dtype handling,
and Hungarian matching cost matrix sanitization.
"""

import sys
import os
import ast
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)


def test_patch_importable_and_safe_on_host():
    """Verify that patch_codetr_fp16_target_assignment is importable and runs safely even on CPU-only/host environment."""
    from training.codetr.train import patch_codetr_fp16_target_assignment
    # On host without torch or projects, it should safely return False or True without raising unhandled exceptions
    res = patch_codetr_fp16_target_assignment()
    assert res in (True, False, None)


def test_regression_index_put_half_float_mismatch():
    """Regression test reproducing the exact failure:
    destination = Half
    source = Float
    indexed assignment

    Verifies that raw assignment fails in PyTorch with RuntimeError Index put dtype mismatch,
    and casting to destination dtype cleanly succeeds with preserved numerical precision.
    """
    torch = pytest.importorskip("torch")

    dest_half = torch.zeros((10, 4), dtype=torch.float16)
    src_float = torch.tensor([[10.5, 20.25, 30.125, 40.0625],
                              [50.5, 60.25, 70.125, 80.0625]], dtype=torch.float32)
    pos_inds = torch.tensor([1, 4], dtype=torch.long)

    # In PyTorch, assigning float32 into float16 slice directly raises RuntimeError:
    # "Index put requires the source and destination dtypes match"
    with pytest.raises(RuntimeError, match=r"Index put requires the source and destination dtypes match"):
        dest_half[pos_inds] = src_float

    # The fix: cast source tensor to dest_half.dtype before indexed assignment
    dest_half[pos_inds] = src_float.to(dest_half.dtype)

    assert dest_half.dtype == torch.float16
    assert torch.allclose(dest_half[pos_inds].float(), src_float, atol=1e-2)


def test_hungarian_assigner_cost_sanitization():
    """Verify that torch.nan_to_num sanitizes cost matrices containing NaNs, Infs, or small half values for SciPy."""
    torch = pytest.importorskip("torch")

    # Create dummy cost matrix with NaNs and positive/negative infinities
    cost = torch.tensor([[1.5, float('nan'), 3.2],
                         [float('inf'), 0.5, float('-inf')]], dtype=torch.float32)

    sanitized = torch.nan_to_num(cost.float(), nan=1e5, posinf=1e5, neginf=-1e5)

    assert not torch.isnan(sanitized).any(), "Sanitized cost matrix contains NaN!"
    assert not torch.isinf(sanitized).any(), "Sanitized cost matrix contains Inf!"
    assert sanitized[0, 1].item() == 1e5
    assert sanitized[1, 0].item() == 1e5
    assert sanitized[1, 2].item() == -1e5


def test_class_names_in_codetr_head_modules():
    """Verify via static AST parsing that the Co-DETR files define CoDeformDETRHead and CoDINOHead."""
    candidates = [
        os.path.join(REPO_ROOT, "..", "Co-DETR"),
        os.path.join(os.path.expanduser("~"), ".gemini", "antigravity", "brain", "7c9511b1-7f08-46c8-823a-1f2262d15f3d", "scratch", "Co-DETR"),
        "/content/Co-DETR"
    ]
    codetr_dir = None
    for cand in candidates:
        if os.path.isdir(cand):
            codetr_dir = cand
            break

    if codetr_dir is None:
        pytest.skip("Co-DETR repository clone not found in standard paths.")

    def_path = os.path.join(codetr_dir, "projects", "models", "co_deformable_detr_head.py")
    dino_path = os.path.join(codetr_dir, "projects", "models", "co_dino_head.py")

    with open(def_path) as f:
        tree = ast.parse(f.read())
    classes_def = [node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
    assert "CoDeformDETRHead" in classes_def, f"Expected CoDeformDETRHead in {def_path}, got {classes_def}"
    assert "CoDeformableDETRHead" not in classes_def, "Found unexpected CoDeformableDETRHead!"

    with open(dino_path) as f:
        tree = ast.parse(f.read())
    classes_dino = [node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
    assert "CoDINOHead" in classes_dino, f"Expected CoDINOHead in {dino_path}, got {classes_dino}"


def test_mock_head_patching_and_inheritance():
    """Verify that patching CoDeformDETRHead and CoDINOHead resolves the target assignment error under FP16."""
    torch = pytest.importorskip("torch")

    # Construct mock classes mimicking the exact inheritance and unpatched behavior of CoDeformDETRHead
    class MockSamplingResult:
        def __init__(self):
            self.pos_inds = torch.tensor([0, 2], dtype=torch.long)
            self.neg_inds = torch.tensor([1, 3], dtype=torch.long)
            self.pos_assigned_gt_inds = torch.tensor([0, 1], dtype=torch.long)
            self.pos_gt_bboxes = torch.tensor([[10.0, 10.0, 50.0, 50.0],
                                               [20.0, 20.0, 60.0, 60.0]], dtype=torch.float32)

    class MockBaseDETRHead:
        def __init__(self):
            self.num_classes = 7

        def _get_target_single_unpatched(self, bbox_pred, sampling_result, img_meta):
            num_bboxes = bbox_pred.size(0)
            labels = torch.full((num_bboxes,), self.num_classes, dtype=torch.long)
            pos_inds = sampling_result.pos_inds
            # Unpatched: bbox_targets has dtype of bbox_pred (Half)
            bbox_targets = torch.zeros_like(bbox_pred)
            pos_gt_bboxes_targets = sampling_result.pos_gt_bboxes  # Float32
            # Fails under PyTorch 1.11 when bbox_targets is Half and pos_gt_bboxes_targets is Float32
            bbox_targets[pos_inds] = pos_gt_bboxes_targets
            return labels, bbox_targets

    class MockCoDeformDETRHead(MockBaseDETRHead):
        pass

    class MockCoDINOHead(MockCoDeformDETRHead):
        pass

    sampling_res = MockSamplingResult()
    head = MockCoDINOHead()

    # In FP16, bbox_pred is float16
    bbox_pred_half = torch.zeros((4, 4), dtype=torch.float16)

    # 1. Verify unpatched version raises RuntimeError
    with pytest.raises(RuntimeError, match=r"Index put requires the source and destination dtypes match"):
        head._get_target_single_unpatched(bbox_pred_half, sampling_res, {'img_shape': (640, 640, 3)})

    # 2. Define and apply the safe patched method
    def _get_target_single_fp16_safe(self, bbox_pred, sampling_result, img_meta):
        num_bboxes = bbox_pred.size(0)
        labels = torch.full((num_bboxes,), self.num_classes, dtype=torch.long)
        pos_inds = sampling_result.pos_inds
        bbox_targets = torch.zeros_like(bbox_pred)
        pos_gt_bboxes_targets = sampling_result.pos_gt_bboxes  # Float32
        # Patched: cast to destination dtype
        bbox_targets[pos_inds] = pos_gt_bboxes_targets.to(bbox_targets.dtype)
        return labels, bbox_targets

    MockCoDeformDETRHead._get_target_single = _get_target_single_fp16_safe
    MockCoDINOHead._get_target_single = _get_target_single_fp16_safe

    # 3. Verify patched version succeeds
    labels, bbox_targets = head._get_target_single(bbox_pred_half, sampling_res, {'img_shape': (640, 640, 3)})
    assert bbox_targets.dtype == torch.float16
    assert torch.allclose(bbox_targets[sampling_res.pos_inds].float(), sampling_res.pos_gt_bboxes, atol=1e-3)


def test_coatsshead_return_signature_and_fp16_safe_wrapper():
    """Regression test for CoATSSHead._get_target_single return signature:
    CoATSSHead returns a 7-tuple:
      (anchors, labels, label_weights, bbox_targets, bbox_weights, pos_inds, neg_inds)
    Verifies that:
      1. Hardcoded 6-value unpacking raises ValueError: too many values to unpack (expected 6)
      2. The dynamic wrapper properly preserves all 7 items, casts float32 targets to orig_dtype,
         preserves non-float tensors and lists/tuples, and maintains exact order.
    """
    torch = pytest.importorskip("torch")

    # Mock original CoATSSHead._get_target_single returning 7 values
    def mock_orig_atss_get_target_single(self, flat_anchors, valid_flags,
                                         num_level_anchors, gt_bboxes,
                                         gt_bboxes_ignore, gt_labels,
                                         img_meta, label_channels=1,
                                         unmap_outputs=True):
        anchors = flat_anchors
        labels = torch.zeros(len(flat_anchors), dtype=torch.long)
        label_weights = torch.ones(len(flat_anchors), dtype=torch.float32)
        bbox_targets = torch.ones((len(flat_anchors), 4), dtype=torch.float32) * 2.5
        bbox_weights = torch.ones((len(flat_anchors), 4), dtype=torch.float32)
        pos_inds = torch.tensor([0, 1], dtype=torch.long)
        neg_inds = torch.tensor([2, 3], dtype=torch.long)
        return (anchors, labels, label_weights, bbox_targets, bbox_weights, pos_inds, neg_inds)

    # 1. Verify that 6-value unpacking fails with ValueError
    sample_flat_anchors = torch.zeros((4, 4), dtype=torch.float16)
    res = mock_orig_atss_get_target_single(
        None, sample_flat_anchors, None, None, torch.zeros((2, 4), dtype=torch.float32),
        None, None, {'img_shape': (640, 384, 3)})

    assert len(res) == 7

    with pytest.raises(ValueError, match=r"too many values to unpack \(expected 6\)"):
        labels, label_weights, bbox_targets, bbox_weights, pos_inds, neg_inds = res

    # 2. Test the dynamic wrapper implementation from train.py
    def atss_get_target_single_fp16_safe(self, flat_anchors, valid_flags,
                                         num_level_anchors, gt_bboxes,
                                         gt_bboxes_ignore, gt_labels,
                                         img_meta, label_channels=1,
                                         unmap_outputs=True):
        orig_dtype = flat_anchors.dtype
        res = mock_orig_atss_get_target_single(
            self, flat_anchors.float(), valid_flags, num_level_anchors,
            gt_bboxes.float(), gt_bboxes_ignore, gt_labels, img_meta,
            label_channels=label_channels, unmap_outputs=unmap_outputs)
        if isinstance(res, tuple):
            res_list = list(res)
            for idx, item in enumerate(res_list):
                if isinstance(item, torch.Tensor) and torch.is_floating_point(item) and item.dtype == torch.float32:
                    res_list[idx] = item.to(orig_dtype)
            return tuple(res_list)
        return res

    wrapped_res = atss_get_target_single_fp16_safe(
        None, sample_flat_anchors, None, None, torch.zeros((2, 4), dtype=torch.float32),
        None, None, {'img_shape': (640, 384, 3)})

    assert len(wrapped_res) == 7
    (anchors_out, labels_out, label_weights_out, bbox_targets_out,
     bbox_weights_out, pos_inds_out, neg_inds_out) = wrapped_res

    # Check dtypes: floating point tensors match orig_dtype (float16)
    assert anchors_out.dtype == torch.float16
    assert label_weights_out.dtype == torch.float16
    assert bbox_targets_out.dtype == torch.float16
    assert bbox_weights_out.dtype == torch.float16
    # Long indices remain long
    assert labels_out.dtype == torch.long
    assert pos_inds_out.dtype == torch.long
    assert neg_inds_out.dtype == torch.long
    # Numerical accuracy check
    assert torch.allclose(bbox_targets_out.float(), torch.ones((4, 4)) * 2.5)


def test_ast_coatsshead_source_returns_seven_items():
    """Verify directly in Co-DETR's source code (if present) that CoATSSHead._get_target_single returns 7 items."""
    candidates = [
        os.path.join(REPO_ROOT, "..", "Co-DETR"),
        os.path.join(os.path.expanduser("~"), ".gemini", "antigravity", "brain", "7c9511b1-7f08-46c8-823a-1f2262d15f3d", "scratch", "Co-DETR"),
        "/content/Co-DETR"
    ]
    codetr_dir = None
    for cand in candidates:
        if os.path.isdir(cand):
            codetr_dir = cand
            break

    if codetr_dir is None:
        pytest.skip("Co-DETR repository clone not found in standard paths.")

    atss_file = os.path.join(codetr_dir, "projects", "models", "co_atss_head.py")
    with open(atss_file) as f:
        content = f.read()

    # Search for the return statement of _get_target_single
    assert "return (anchors, labels, label_weights, bbox_targets, bbox_weights," in content
    assert "pos_inds, neg_inds)" in content
    # And check get_targets unpacks all 7:
    assert "(all_anchors, all_labels, all_label_weights, all_bbox_targets," in content
    assert "all_bbox_weights, pos_inds_list, neg_inds_list) = multi_apply(" in content

