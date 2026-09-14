import os
import subprocess
import pytest

SCRIPT_PATH = "scripts/run_benchmark_matrix.sh"

def test_benchmark_matrix_requires_dataset_root(tmp_path):
    """Test that the benchmark matrix fails cleanly if no data root is provided and dataset_local is absent."""
    # Ensure /content/dataset_local does not exist in this test env
    env = os.environ.copy()
    
    result = subprocess.run(
        ["bash", SCRIPT_PATH],
        capture_output=True,
        text=True,
        env=env
    )
    
    # Should fail because no --data-root is passed and /content/dataset_local shouldn't exist in CI
    if not os.path.exists("/content/dataset_local"):
        assert result.returncode != 0
        assert "No --data-root provided" in result.stdout or "No --data-root provided" in result.stderr

def test_benchmark_matrix_passes_args(tmp_path):
    """Test that benchmark matrix correctly accepts and parses --data-root."""
    # Create a fake matrix script run by mocking train.py or just checking bash script parsing
    # Actually, we can just run bash with set -x and grep for data-root
    result = subprocess.run(
        ["bash", "-x", SCRIPT_PATH, "--data-root", str(tmp_path)],
        capture_output=True,
        text=True
    )
    
    # It should invoke train.py with --data-root
    # Since it will fail in train.py due to invalid dataset, the returncode should be non-zero
    assert result.returncode != 0
    # But it SHOULD pass --data-root to train.py
    assert "--data-root" in result.stderr or "--data-root" in result.stdout
    assert str(tmp_path) in result.stderr or str(tmp_path) in result.stdout

def test_benchmark_matrix_failure_status(tmp_path):
    """Test that if a benchmark experiment fails, the script returns non-zero."""
    result = subprocess.run(
        ["bash", SCRIPT_PATH, "--data-root", "/invalid/path/that/does/not/exist"],
        capture_output=True,
        text=True
    )
    assert result.returncode != 0
    assert "MATRIX COMPLETE" not in result.stdout
