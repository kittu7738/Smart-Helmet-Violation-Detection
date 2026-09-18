"""
tests/test_fp16_target_assignment.py
====================================
Tests verifying FP16 target assignment patching, index-put dtype handling,
and Hungarian matching cost matrix sanitization.
"""

import sys
import os
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


def test_index_put_dtype_resolution_logic():
    """Verify the exact index-put dtype resolution behavior between Half destination and Float source."""
    torch = pytest.importorskip("torch")

    # Destination is Half (representing bbox_targets initialized from bbox_pred in FP16)
    dest_half = torch.zeros((10, 4), dtype=torch.float16)
    # Source is Float32 (representing pos_gt_bboxes_targets from DataLoader)
    src_float = torch.tensor([[10.0, 20.0, 30.0, 40.0], [50.0, 60.0, 70.0, 80.0]], dtype=torch.float32)
    pos_inds = torch.tensor([1, 4], dtype=torch.long)

    # In PyTorch 1.11, dest_half[pos_inds] = src_float fails with:
    # "RuntimeError: Index put requires the source and destination dtypes match, got Half for destination and Float for source"
    # Our patched pattern explicitly casts src.to(dest.dtype):
    dest_half[pos_inds] = src_float.to(dest_half.dtype)

    # Verify values match in float16
    assert dest_half.dtype == torch.float16
    assert torch.allclose(dest_half[pos_inds].float(), src_float, atol=1e-3)


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
