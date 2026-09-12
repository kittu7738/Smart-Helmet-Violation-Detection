"""
tests/test_colab_environment.py
================================
Validation tests for:
- scripts/setup_codetr_colab.sh (bash syntax, strict flags, verification paths)
- run_codetr.sh (runner wrapper, candidate resolution)
- Python environment detection and compatibility diagnostics
- data/validate_dataset.py CLI argument parsing and subprocess execution
"""

import os
import sys
import subprocess
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SETUP_SCRIPT = os.path.join(REPO_ROOT, "scripts", "setup_codetr_colab.sh")
RUNNER_SCRIPT = os.path.join(REPO_ROOT, "run_codetr.sh")
VALIDATE_SCRIPT = os.path.join(REPO_ROOT, "data", "validate_dataset.py")


def test_setup_codetr_colab_bash_syntax():
    """Verify scripts/setup_codetr_colab.sh is valid bash syntax and uses set -euo pipefail."""
    assert os.path.isfile(SETUP_SCRIPT), f"setup script missing: {SETUP_SCRIPT}"
    res = subprocess.run(["bash", "-n", SETUP_SCRIPT], capture_output=True, text=True)
    assert res.returncode == 0, f"Bash syntax check failed: {res.stderr}"

    with open(SETUP_SCRIPT, "r") as f:
        content = f.read()

    assert "set -euo pipefail" in content
    assert "exit 1" in content, "Setup script must exit 1 on verification failure"
    assert "exit 0" in content, "Setup script must exit 0 on verification success"
    assert "micromamba" in content.lower() or "miniconda" in content.lower()


def test_run_codetr_wrapper_syntax_and_search_order():
    """Verify run_codetr.sh is valid bash and includes expected candidate paths."""
    assert os.path.isfile(RUNNER_SCRIPT), f"runner script missing: {RUNNER_SCRIPT}"
    res = subprocess.run(["bash", "-n", RUNNER_SCRIPT], capture_output=True, text=True)
    assert res.returncode == 0, f"Bash syntax check failed: {res.stderr}"

    with open(RUNNER_SCRIPT, "r") as f:
        content = f.read()

    assert "/content/codetr_env/bin/python" in content
    assert "PYTHONPATH" in content
    assert "OMP_NUM_THREADS" in content


def test_validate_dataset_cli_help():
    """Verify data/validate_dataset.py responds to --help via subprocess."""
    res = subprocess.run(
        [sys.executable, VALIDATE_SCRIPT, "--help"],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0
    assert "--data-root" in res.stdout
    assert "--strict" in res.stdout
    assert "--fast" in res.stdout


def test_incompatible_python_diagnostic_message():
    """Verify running train.py under Python 3.13 without MMCV prints actionable environment diagnosis."""
    train_script = os.path.join(REPO_ROOT, "training", "codetr", "train.py")
    res = subprocess.run(
        [sys.executable, train_script, "--config", "configs/codetr/helmet_codetr_swin_large.py"],
        capture_output=True,
        text=True,
    )
    # Expected to exit with code != 0 because mmcv is not installed in local python 3.13
    assert res.returncode != 0
    err_out = res.stdout + res.stderr
    assert "ENVIRONMENT ERROR" in err_out or "No module named" in err_out
    assert "setup_codetr_colab.sh" in err_out or "run_codetr.sh" in err_out
