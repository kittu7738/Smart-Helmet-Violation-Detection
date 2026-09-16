import os
import pytest
import runpy
import importlib.util

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def load_config_dict(filename):
    """Load configuration as a dictionary using mmcv if available, otherwise just parse carefully or skip."""
    # Since we can't reliably resolve _base_ without mmcv Config, we will test using runpy for now,
    # but runpy does not resolve _base_. To properly validate, we need to check if mmcv is available.
    try:
        from mmcv import Config
        cfg = Config.fromfile(os.path.join(REPO_ROOT, "configs", "codetr", "experiments", filename))
        return cfg
    except ImportError:
        pytest.skip("MMCV not installed, skipping full config resolution tests.")

@pytest.mark.parametrize("filename,expected_width", [
    ("exp_F_width_128.py", 128),
    ("exp_D_width_192.py", 192),
])
def test_experiment_config_structural_integrity(filename, expected_width):
    cfg = load_config_dict(filename)
    
    # 1. Check Neck
    assert cfg.model.neck.out_channels == expected_width, "Neck out_channels mismatch"
    
    # 2. Check Transformer Encoder
    enc = cfg.model.query_head.transformer.encoder
    enc_layers = enc.transformerlayers
    
    # Check attn_cfgs
    assert 'type' in enc_layers.attn_cfgs, "Encoder attn_cfgs lost its 'type' due to list/dict overwrite"
    assert enc_layers.attn_cfgs.embed_dims == expected_width, "Encoder attn_cfgs embed_dims mismatch"
    
    # Check ffn_cfgs
    assert 'ffn_cfgs' in enc_layers, "ffn_cfgs is missing from encoder transformerlayers"
    assert enc_layers.ffn_cfgs.embed_dims == expected_width, "Encoder ffn_cfgs embed_dims mismatch"
    assert enc_layers.ffn_cfgs.feedforward_channels == expected_width * 8, "Encoder feedforward_channels mismatch"
    
    # 3. Check Transformer Decoder
    dec = cfg.model.query_head.transformer.decoder
    dec_layers = dec.transformerlayers
    
    # Check attn_cfgs (should be list of 2)
    assert isinstance(dec_layers.attn_cfgs, list), "Decoder attn_cfgs must be a list"
    assert len(dec_layers.attn_cfgs) == 2, "Decoder attn_cfgs must have 2 attention modules"
    assert 'type' in dec_layers.attn_cfgs[0], "Decoder attn_cfgs[0] lost its 'type'"
    assert dec_layers.attn_cfgs[0].embed_dims == expected_width, "Decoder attn_cfgs[0] embed_dims mismatch"
    assert 'type' in dec_layers.attn_cfgs[1], "Decoder attn_cfgs[1] lost its 'type'"
    assert dec_layers.attn_cfgs[1].embed_dims == expected_width, "Decoder attn_cfgs[1] embed_dims mismatch"
    
    # Check ffn_cfgs
    assert 'ffn_cfgs' in dec_layers, "ffn_cfgs is missing from decoder transformerlayers"
    assert dec_layers.ffn_cfgs.embed_dims == expected_width, "Decoder ffn_cfgs embed_dims mismatch"
    assert dec_layers.ffn_cfgs.feedforward_channels == expected_width * 8, "Decoder feedforward_channels mismatch"
    
    # 4. Check auxiliary heads (lists)
    assert isinstance(cfg.model.roi_head, list), "roi_head must be a list"
    assert 'type' in cfg.model.roi_head[0], "roi_head[0] lost its 'type'"
    assert cfg.model.roi_head[0].bbox_head.in_channels == expected_width
    
    assert isinstance(cfg.model.bbox_head, list), "bbox_head must be a list"
    assert 'type' in cfg.model.bbox_head[0], "bbox_head[0] lost its 'type'"
    assert cfg.model.bbox_head[0].in_channels == expected_width

@pytest.mark.parametrize("filename", [
    "exp_E_r18.py",
    "exp_G_res_512.py",
    "exp_H_combined.py",
    "exp_I_r18_combined.py",
])
def def_test_other_experiments_load(filename):
    cfg = load_config_dict(filename)
    assert cfg is not None
