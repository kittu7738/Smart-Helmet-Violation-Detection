import os
import sys
import shutil
import tempfile
import unittest

# Add project root to sys.path so we can import training.codetr.train
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from training.codetr.train import stage_dataset_if_needed

class TestDatasetStaging(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        
        # Create mock data_root
        self.data_root = os.path.join(self.temp_dir, "mock_project_root")
        os.makedirs(self.data_root)
        
        # Create valid dataset structure
        os.makedirs(os.path.join(self.data_root, "train", "images"))
        os.makedirs(os.path.join(self.data_root, "vaid", "images"))
        
        with open(os.path.join(self.data_root, "train", "images", "img1.jpg"), "w") as f:
            f.write("mock image data")
            
        with open(os.path.join(self.data_root, "instances_train.json"), "w") as f:
            f.write("{}")
            
        # Create unrelated directories that SHOULD NOT be staged
        os.makedirs(os.path.join(self.data_root, ".git", "objects"))
        os.makedirs(os.path.join(self.data_root, "codetr_env"))
        os.makedirs(os.path.join(self.data_root, "work_dirs"))
        with open(os.path.join(self.data_root, ".git", "config"), "w") as f:
            f.write("mock git config")
            
        self.stage_dir = os.path.join(self.temp_dir, "dataset_local")
        
        # Force staging for test
        os.environ["CODETR_FORCE_STAGE"] = "1"

    def tearDown(self):
        shutil.rmtree(self.temp_dir)
        if "CODETR_FORCE_STAGE" in os.environ:
            del os.environ["CODETR_FORCE_STAGE"]

    def test_staging_excludes_unrelated_dirs(self):
        # Run the staging function
        staged_path = stage_dataset_if_needed(
            data_root=self.data_root,
            stage_dir=self.stage_dir,
            enabled=True
        )
        
        # Verify the staging occurred to the correct destination
        self.assertEqual(os.path.abspath(staged_path), os.path.abspath(self.stage_dir))
        
        # Verify that valid data was copied
        self.assertTrue(os.path.isfile(os.path.join(self.stage_dir, "instances_train.json")))
        self.assertTrue(os.path.isfile(os.path.join(self.stage_dir, "train", "images", "img1.jpg")))
        
        # Verify that UNRELATED data was NOT copied
        self.assertFalse(os.path.exists(os.path.join(self.stage_dir, ".git")))
        self.assertFalse(os.path.exists(os.path.join(self.stage_dir, "codetr_env")))
        self.assertFalse(os.path.exists(os.path.join(self.stage_dir, "work_dirs")))

if __name__ == '__main__':
    unittest.main()
