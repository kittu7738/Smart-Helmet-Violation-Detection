import os
import glob
import runpy
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def test_checkpoint_config_no_save_best():
    """
    MMCV 1.5.0 CheckpointHook does not accept save_best in checkpoint_config.
    save_best should only be present in evaluation config for EvalHook.
    """
    config_files = glob.glob(os.path.join(REPO_ROOT, "configs", "**", "*.py"), recursive=True)
    
    for config_file in config_files:
        # Avoid running experiments that just inherit and don't define checkpoint_config
        # We can just parse text to avoid complex execution, or use runpy carefully.
        with open(config_file, 'r') as f:
            content = f.read()
            
        if "checkpoint_config" in content:
            # simple text-based heuristic: if it defines checkpoint_config with save_best
            # It's better to verify through dict, but this ensures no textual overrides.
            lines = content.split('\n')
            for line in lines:
                if 'checkpoint_config' in line and '=' in line and 'save_best' in line:
                    pytest.fail(f"Found save_best in checkpoint_config in {config_file}. MMCV 1.5.0 CheckpointHook does not support this.")

def test_evaluation_config_has_save_best():
    """
    Ensure we didn't lose the save_best functionality. It should be in the evaluation config.
    """
    base_config = os.path.join(REPO_ROOT, "configs", "codetr", "helmet_codetr_r50.py")
    with open(base_config, 'r') as f:
        content = f.read()
    
    assert "evaluation = dict(" in content
    assert "save_best='bbox_mAP'" in content
