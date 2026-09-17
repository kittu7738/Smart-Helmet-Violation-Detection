import os
import pytest
try:
    from mmcv import Config
    has_mmcv = True
except ImportError:
    has_mmcv = False

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def load_config_dict(filename):
    if not has_mmcv:
        pytest.skip("MMCV not installed, skipping full config resolution tests.")
    cfg = Config.fromfile(os.path.join(REPO_ROOT, "configs", "codetr", "experiments", filename))
    return cfg

@pytest.mark.parametrize("filename", [
    "exp_K1_res_640.py",
    "exp_K2_queries_150.py",
    "exp_K3_depth_3.py",
    "exp_K4_r50.py",
    "exp_K5_balanced_r18.py",
])
def test_k_experiments_load(filename):
    cfg = load_config_dict(filename)
    assert cfg is not None
