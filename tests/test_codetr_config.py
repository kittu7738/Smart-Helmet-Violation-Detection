"""
tests/test_codetr_config.py
===========================
Validation tests for the Co-DETR helmet detection configuration and training pipeline.
"""

import json
import os
import runpy
import sys
import pytest


REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CONFIG_PATH = os.path.join(REPO_ROOT, "configs", "codetr", "helmet_codetr_swin_large.py")
TRAIN_PY_PATH = os.path.join(REPO_ROOT, "training", "codetr", "train.py")


def test_config_file_exists():
    assert os.path.isfile(CONFIG_PATH), f"Config file not found at {CONFIG_PATH}"


def test_config_structure_and_classes():
    cfg = runpy.run_path(CONFIG_PATH)

    assert cfg["num_classes"] == 7
    expected_classes = (
        "driver_with_helmet",
        "bike",
        "driver",
        "passenger_with_helmet",
        "passenger",
        "driver_without_helmet",
        "passenger_without_helmet",
    )
    assert cfg["CLASSES"] == expected_classes
    assert len(cfg["CLASSES"]) == 7


def test_config_schedule_and_epochs():
    cfg = runpy.run_path(CONFIG_PATH)

    assert cfg["max_epochs"] == 12
    assert cfg["runner"]["type"] == "EpochBasedRunner"
    assert cfg["runner"]["max_epochs"] == 12
    assert cfg["lr_config"]["policy"] == "step"
    assert cfg["lr_config"]["step"] == [8, 11]
    assert cfg["lr_config"]["warmup"] == "linear"
    assert cfg["lr_config"]["warmup_iters"] == 250
    assert cfg["lr_config"]["warmup_ratio"] == 0.001


def test_config_generalization_improvements():
    cfg = runpy.run_path(CONFIG_PATH)

    # 1. PhotoMetricDistortion in train_pipeline
    pipeline = cfg["train_pipeline"]
    has_pmd = any(step.get("type") == "PhotoMetricDistortion" for step in pipeline)
    assert has_pmd is True, "PhotoMetricDistortion must be enabled in train_pipeline"

    # 2. Multi-scale scale bounded to 800 to prevent Tesla T4 VRAM thrashing
    auto_aug = [s for s in pipeline if s.get("type") == "AutoAugment"][0]
    scales_policy0 = auto_aug["policies"][0][0]["img_scale"]
    assert (800, 1333) in scales_policy0, "Expected scale (800, 1333) in AutoAugment policy 0"
    assert (960, 1333) not in scales_policy0, "Scale (960, 1333) must not be in policy 0 (causes T4 thrashing)"

    # 3. Regularization: Weight decay >= 0.01
    assert cfg["optimizer"]["weight_decay"] == 0.01

    # 4. IoU precision enhancement
    assert cfg["model"]["query_head"]["loss_iou"]["loss_weight"] == 3.0
    assert cfg["model"]["train_cfg"][0]["assigner"]["iou_cost"]["weight"] == 3.0

    # 5. Fast iteration logging
    assert cfg["log_config"]["interval"] == 10


def test_config_evaluation_and_checkpointing():
    cfg = runpy.run_path(CONFIG_PATH)

    assert cfg["evaluation"]["interval"] == 1
    assert cfg["evaluation"]["metric"] == "bbox"
    assert cfg["evaluation"]["save_best"] == "bbox_mAP"

    assert cfg["checkpoint_config"]["interval"] == 1
    assert cfg["checkpoint_config"]["max_keep_ckpts"] == 3


def test_config_model_and_losses():
    cfg = runpy.run_path(CONFIG_PATH)

    model = cfg["model"]
    assert model["type"] == "CoDETR"
    assert model["backbone"]["type"] == "SwinTransformer"
    assert model["neck"]["type"] == "ChannelMapper"
    assert model["neck"]["num_outs"] == 5

    # Query head (Co-DINO)
    query_head = model["query_head"]
    assert query_head["type"] == "CoDINOHead"
    assert query_head["num_classes"] == 7
    assert query_head["loss_cls"]["type"] == "QualityFocalLoss"
    assert query_head["loss_cls"]["use_sigmoid"] is True
    assert query_head["loss_bbox"]["type"] == "L1Loss"
    assert query_head["loss_iou"]["type"] == "GIoULoss"

    # Denoising configuration
    assert "dn_cfg" in query_head
    dn_cfg = query_head["dn_cfg"]
    assert dn_cfg["type"] == "CdnQueryGenerator"
    assert dn_cfg["group_cfg"]["num_dn_queries"] == 100

    # Auxiliary heads loss weights (aligned with upstream Co-DETR)
    # RPN
    assert model["rpn_head"]["loss_cls"]["loss_weight"] == 12.0
    assert model["rpn_head"]["loss_bbox"]["loss_weight"] == 12.0

    # RoI Head
    roi_bbox = model["roi_head"][0]["bbox_head"]
    assert roi_bbox["loss_cls"]["loss_weight"] == 12.0
    assert roi_bbox["loss_bbox"]["loss_weight"] == 120.0

    # ATSS Head
    atss = model["bbox_head"][0]
    assert atss["loss_cls"]["loss_weight"] == 12.0
    assert atss["loss_bbox"]["loss_weight"] == 24.0
    assert atss["loss_centerness"]["loss_weight"] == 12.0


def test_train_py_argument_parser():
    # Load _parse_args without executing main()
    module = runpy.run_path(TRAIN_PY_PATH)
    parse_args_func = module["_parse_args"]

    # Test parser flags
    orig_argv = sys.argv
    try:
        sys.argv = [
            "train.py",
            "--config", CONFIG_PATH,
            "--data-root", "data/coco",
            "--work-dir", "work_dirs/test",
            "--auto-resume",
            "--seed", "123",
        ]
        args = parse_args_func()
        assert args.config == CONFIG_PATH
        assert args.data_root == "data/coco"
        assert args.work_dir == "work_dirs/test"
        assert args.auto_resume is True
        assert args.seed == 123
        assert args.resume_from is None
    finally:
        sys.argv = orig_argv


def test_validate_and_patch_data_root_nested_and_flat(tmp_path):
    import json
    from types import SimpleNamespace

    module = runpy.run_path(TRAIN_PY_PATH)
    patch_func = module["_validate_and_patch_data_root"]

    # Test nested layout (Google Drive structure)
    data_root = tmp_path / "data"
    os.makedirs(data_root / "train" / "images", exist_ok=True)
    os.makedirs(data_root / "vaid" / "images", exist_ok=True)
    os.makedirs(data_root / "test" / "images", exist_ok=True)

    dummy_coco = {"images": [{"id": 1}], "annotations": []}
    with open(data_root / "train" / "instances_train.json", "w") as f:
        json.dump(dummy_coco, f)
    with open(data_root / "vaid" / "instances_val.json", "w") as f:
        json.dump(dummy_coco, f)
    with open(data_root / "test" / "instances_test.json", "w") as f:
        json.dump(dummy_coco, f)

    cfg = SimpleNamespace(
        data=SimpleNamespace(
            train=SimpleNamespace(ann_file="", img_prefix=""),
            val=SimpleNamespace(ann_file="", img_prefix=""),
            test=SimpleNamespace(ann_file="", img_prefix=""),
        )
    )

    patch_func(cfg, str(data_root))
    assert cfg.data.train.ann_file == str(data_root / "train" / "instances_train.json")
    assert cfg.data.train.img_prefix.endswith("train/images/")
    assert cfg.data.val.ann_file == str(data_root / "vaid" / "instances_val.json")
    assert cfg.data.test.ann_file == str(data_root / "test" / "instances_test.json")
    assert cfg.data.test.img_prefix.endswith("test/images/")


def test_sanity_check_dataset_control_flow(tmp_path):
    SANITY_CHECK_PY_PATH = os.path.join(REPO_ROOT, "training", "codetr", "sanity_check.py")
    module = runpy.run_path(SANITY_CHECK_PY_PATH)
    check_dataset_func = module["check_dataset"]

    # 1. Valid dataset with an actual readable dummy image
    data_root = tmp_path / "data"
    os.makedirs(data_root / "train" / "images", exist_ok=True)
    os.makedirs(data_root / "vaid" / "images", exist_ok=True)

    import cv2
    import numpy as np
    dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)
    cv2.imwrite(str(data_root / "train" / "images" / "test_img.jpg"), dummy_img)

    dummy_coco = {
        "categories": [{"id": i, "name": f"cat_{i}"} for i in range(7)],
        "images": [{"id": 1, "file_name": "test_img.jpg"}],
        "annotations": [],
    }
    with open(data_root / "train" / "instances_train.json", "w") as f:
        json.dump(dummy_coco, f)
    with open(data_root / "vaid" / "instances_val.json", "w") as f:
        json.dump(dummy_coco, f)

    cfg = {
        "num_classes": 7,
        "CLASSES": tuple(f"cat_{i}" for i in range(7)),
    }

    res = check_dataset_func(cfg, str(data_root))
    assert res is True  # Must return boolean True, no UnboundLocalError

    # 2. Missing image file -> must return False cleanly, no UnboundLocalError
    dummy_coco_missing = {
        "categories": [{"id": i, "name": f"cat_{i}"} for i in range(7)],
        "images": [{"id": 2, "file_name": "non_existent.jpg"}],
        "annotations": [],
    }
    with open(data_root / "train" / "instances_train.json", "w") as f:
        json.dump(dummy_coco_missing, f)
    res_missing = check_dataset_func(cfg, str(data_root))
    assert res_missing is False

    # 3. Empty images list -> must return False cleanly
    dummy_coco_empty = {
        "categories": [{"id": i, "name": f"cat_{i}"} for i in range(7)],
        "images": [],
        "annotations": [],
    }
    with open(data_root / "train" / "instances_train.json", "w") as f:
        json.dump(dummy_coco_empty, f)
    res_empty = check_dataset_func(cfg, str(data_root))
    assert res_empty is False


def test_train_py_performance_arguments():
    module = runpy.run_path(TRAIN_PY_PATH)
    parse_args_func = module["_parse_args"]

    orig_argv = sys.argv
    try:
        sys.argv = [
            "train.py",
            "--config", CONFIG_PATH,
            "--log-interval", "15",
            "--workers-per-gpu", "1",
            "--no-stage-data",
            "--stage-dir", "/tmp/custom_stage",
            "--swin-pretrained", "/tmp/custom_swin.pth",
        ]
        args = parse_args_func()
        assert args.log_interval == 15
        assert args.workers_per_gpu == 1
        assert args.no_stage_data is True
        assert args.stage_dir == "/tmp/custom_stage"
        assert args.swin_pretrained == "/tmp/custom_swin.pth"
    finally:
        sys.argv = orig_argv


def test_stage_dataset_if_needed(tmp_path):
    module = runpy.run_path(TRAIN_PY_PATH)
    stage_func = module["stage_dataset_if_needed"]

    # Create mock source dataset pretending to be on Google Drive
    src_dir = tmp_path / "content" / "drive" / "MyDrive" / "data"
    os.makedirs(src_dir / "train" / "images", exist_ok=True)
    with open(src_dir / "train" / "instances_train.json", "w") as f:
        f.write('{"test": 1}')
    with open(src_dir / "train" / "images" / "001.jpg", "wb") as f:
        f.write(b"mock_image_bytes")

    dst_dir = tmp_path / "content" / "dataset_local"

    # Stage dataset
    staged_path = stage_func(str(src_dir), stage_dir=str(dst_dir), enabled=True)
    assert staged_path == str(dst_dir)
    assert os.path.isfile(dst_dir / "train" / "instances_train.json")
    assert os.path.isfile(dst_dir / "train" / "images" / "001.jpg")

    # Calling again (idempotent)
    staged_path_2 = stage_func(str(src_dir), stage_dir=str(dst_dir), enabled=True)
    assert staged_path_2 == str(dst_dir)

    # Calling with enabled=False should return src_dir untouched
    res = stage_func(str(src_dir), stage_dir=str(dst_dir), enabled=False)
    assert res == str(src_dir)


def test_resolve_swin_backbone(tmp_path):
    from types import SimpleNamespace
    module = runpy.run_path(TRAIN_PY_PATH)
    resolve_func = module["_resolve_swin_backbone"]

    # 1. Test when swin_arg points to an existing file
    local_swin = tmp_path / "swin.pth"
    local_swin.write_bytes(b"0" * 1024)

    cfg = SimpleNamespace(
        model=SimpleNamespace(
            backbone=SimpleNamespace(
                init_cfg={
                    "type": "Pretrained",
                    "checkpoint": str(local_swin),
                }
            )
        )
    )
    resolve_func(cfg)
    assert cfg.model.backbone.init_cfg["checkpoint"] == str(local_swin)


def test_stage_marker(capsys):
    module = runpy.run_path(TRAIN_PY_PATH)
    marker_func = module["stage_marker"]

    marker_func(1, 8, "Testing stage", detail="detail_info", elapsed=1.23)
    captured = capsys.readouterr()
    assert "[Stage 1/8] Testing stage [detail_info] in 1.23s" in captured.out


def test_stage_dataset_fast_path_skip(tmp_path, capsys):
    module = runpy.run_path(TRAIN_PY_PATH)
    stage_func = module["stage_dataset_if_needed"]

    # Pre-populate dst_dir with >=300 mock images and annotations
    dst_dir = tmp_path / "content" / "dataset_local"
    img_dir = dst_dir / "train" / "images"
    os.makedirs(img_dir, exist_ok=True)
    with open(dst_dir / "instances_train.json", "w") as f:
        f.write("{}")
    for i in range(305):
        (img_dir / f"{i:04d}.jpg").write_bytes(b"x")

    src_dir = tmp_path / "content" / "drive" / "MyDrive" / "data"
    os.makedirs(src_dir, exist_ok=True)

    res = stage_func(str(src_dir), stage_dir=str(dst_dir), enabled=True)
    assert res == str(dst_dir)
    captured = capsys.readouterr()
    assert "skipping re-copy" in captured.out


def test_entrypoints_isolated_from_arbitrary_cwd():
    """Verify all Co-DETR CLI entry points resolve imports without PYTHONPATH from /tmp."""
    import subprocess
    env = {k: v for k, v in os.environ.items() if k != "PYTHONPATH"}
    scripts = [
        os.path.join(REPO_ROOT, "training", "codetr", "sanity_check.py"),
        os.path.join(REPO_ROOT, "training", "codetr", "train.py"),
        os.path.join(REPO_ROOT, "evaluation", "codetr", "evaluate.py"),
        os.path.join(REPO_ROOT, "inference", "codetr", "infer.py"),
    ]
    for script in scripts:
        res = subprocess.run(
            [sys.executable, script, "--help"],
            cwd="/tmp",
            env=env,
            capture_output=True,
            text=True,
        )
        assert res.returncode == 0, f"Script {script} failed from /tmp:\n{res.stderr}"


def test_sanity_check_check_dataset(tmp_path):
    """Test check_dataset in sanity_check.py with mock dataset."""
    module = runpy.run_path(os.path.join(REPO_ROOT, "training", "codetr", "sanity_check.py"))
    check_dataset_func = module["check_dataset"]

    # Setup mock dataset
    data_root = tmp_path / "mock_data"
    for split in ["train", "vaid", "test"]:
        split_dir = data_root / split
        img_dir = split_dir / "images"
        os.makedirs(img_dir, exist_ok=True)
        # 1 mock image
        try:
            from PIL import Image
            im = Image.new("RGB", (32, 32), color="red")
            im.save(img_dir / "img1.jpg")
        except ImportError:
            import cv2
            import numpy as np
            im = np.zeros((32, 32, 3), dtype=np.uint8)
            cv2.imwrite(str(img_dir / "img1.jpg"), im)
        coco_data = {
            "categories": [{"id": i + 1, "name": f"c_{i}"} for i in range(7)],
            "images": [{"id": 1, "file_name": "img1.jpg"}],
            "annotations": [{"id": 1, "image_id": 1, "category_id": 1, "bbox": [0, 0, 10, 10]}],
        }
        with open(split_dir / f"instances_{'val' if split == 'vaid' else split}.json", "w") as f:
            json.dump(coco_data, f)

    cfg = {
        "num_classes": 7,
        "CLASSES": tuple(f"c_{i}" for i in range(7)),
    }

    # Should pass check
    ok = check_dataset_func(cfg, str(data_root))
    assert isinstance(ok, bool)
    assert ok is True


def test_train_py_startup_diagnostic_flag():
    """Verify --startup-diagnostic argument is parsed cleanly by train.py."""
    module = runpy.run_path(TRAIN_PY_PATH)
    parse_args_func = module["_parse_args"]

    orig_argv = sys.argv
    try:
        sys.argv = ["train.py", "--config", CONFIG_PATH, "--startup-diagnostic"]
        args = parse_args_func()
        assert args.startup_diagnostic is True
    finally:
        sys.argv = orig_argv


def test_immediate_heartbeat_all_entrypoints_subprocess():
    """Subprocess test verifying all 4 entry points emit flushed heartbeat on line 1."""
    import subprocess
    env = {k: v for k, v in os.environ.items() if k != "PYTHONPATH"}
    scripts = {
        "train.py": os.path.join(REPO_ROOT, "training", "codetr", "train.py"),
        "sanity_check.py": os.path.join(REPO_ROOT, "training", "codetr", "sanity_check.py"),
        "evaluate.py": os.path.join(REPO_ROOT, "evaluation", "codetr", "evaluate.py"),
        "infer.py": os.path.join(REPO_ROOT, "inference", "codetr", "infer.py"),
    }
    for name, path in scripts.items():
        res = subprocess.run(
            [sys.executable, "-u", path, "--help"],
            cwd="/tmp",
            env=env,
            capture_output=True,
            text=True,
        )
        assert res.returncode == 0, f"{name} exited with error: {res.stderr}"
        lines = [ln.strip() for ln in res.stdout.splitlines() if ln.strip()]
        assert len(lines) > 0, f"{name} produced zero stdout!"
        first_line = lines[0]
        assert ">>> Co-DETR" in first_line and "initializing" in first_line, (
            f"Expected immediate heartbeat on line 1 of {name}, got: {first_line}"
        )

