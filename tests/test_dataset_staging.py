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


    def test_staging_finds_nested_dataset(self):
        # Create a new structure where data_root is the project root, but dataset is inside data/coco
        nested_temp = tempfile.mkdtemp()
        try:
            nested_data_root = os.path.join(nested_temp, "project_root")
            actual_dataset = os.path.join(nested_data_root, "data", "coco")
            os.makedirs(os.path.join(actual_dataset, "train", "images"))
            os.makedirs(os.path.join(actual_dataset, "vaid", "images"))
            
            with open(os.path.join(actual_dataset, "train", "images", "img2.jpg"), "w") as f:
                f.write("mock image data")
                
            with open(os.path.join(actual_dataset, "instances_train.json"), "w") as f:
                f.write("{}")
                
            # Create unrelated directories that SHOULD NOT be staged
            os.makedirs(os.path.join(nested_data_root, ".git"))
            
            stage_dir = os.path.join(nested_temp, "dataset_local")
            os.environ["CODETR_FORCE_STAGE"] = "1"
            
            # Run the staging function
            staged_path = stage_dataset_if_needed(
                data_root=nested_data_root,
                stage_dir=stage_dir,
                enabled=True
            )
            
            # Verify the staging occurred to the correct destination
            self.assertEqual(os.path.abspath(staged_path), os.path.abspath(stage_dir))
            
            # Verify that valid data was copied to the root of stage_dir
            self.assertTrue(os.path.isfile(os.path.join(stage_dir, "instances_train.json")))
            self.assertTrue(os.path.isfile(os.path.join(stage_dir, "train", "images", "img2.jpg")))
            
            # Verify that UNRELATED data was NOT copied
            self.assertFalse(os.path.exists(os.path.join(stage_dir, ".git")))
            
            # Verify it didn't recreate data/coco inside stage_dir
            self.assertFalse(os.path.exists(os.path.join(stage_dir, "data")))
        finally:
            shutil.rmtree(nested_temp)
            if "CODETR_FORCE_STAGE" in os.environ:
                del os.environ["CODETR_FORCE_STAGE"]

    def test_reuse_existing_staged_dataset_without_data_root(self):
        """Verify that if stage_dir is already valid, it reuses it even if data_root isn't a gdrive path."""
        import tempfile
        import shutil
        from training.codetr.train import stage_dataset_if_needed
        
        temp_dir = tempfile.mkdtemp()
        try:
            stage_dir = os.path.join(temp_dir, "dataset_local")
            os.makedirs(os.path.join(stage_dir, "train", "images"))
            
            with open(os.path.join(stage_dir, "instances_train.json"), "w") as f:
                f.write("{}")
                
            # Mock 300 images to pass the fast-path check
            for i in range(300):
                with open(os.path.join(stage_dir, "train", "images", f"img{i}.jpg"), "w") as f:
                    f.write("mock image data")
                    
            # Call stage_dataset_if_needed with data_root="data/coco" (not gdrive)
            staged_path = stage_dataset_if_needed(
                data_root="data/coco",
                stage_dir=stage_dir,
                enabled=True
            )
            
            # It should return the stage_dir because it's already populated
            self.assertEqual(os.path.abspath(staged_path), os.path.abspath(stage_dir))
            
        finally:
            shutil.rmtree(temp_dir)

    def test_ensure_dataset_stage_layout_creates_aliases(self):
        """Verify that _ensure_dataset_stage_layout creates flat and nested aliases."""
        from training.codetr.train import _ensure_dataset_stage_layout
        temp_dir = tempfile.mkdtemp()
        try:
            stage_dir = os.path.join(temp_dir, "dataset_local")
            os.makedirs(os.path.join(stage_dir, "annotations"), exist_ok=True)
            os.makedirs(os.path.join(stage_dir, "images"), exist_ok=True)

            with open(os.path.join(stage_dir, "annotations", "instances_train.json"), "w") as f:
                f.write("{}")

            _ensure_dataset_stage_layout(stage_dir)

            # Flat instances_train.json should now exist
            self.assertTrue(os.path.isfile(os.path.join(stage_dir, "instances_train.json")))
            # Nested train/images should now exist
            self.assertTrue(os.path.exists(os.path.join(stage_dir, "train", "images")))
        finally:
            shutil.rmtree(temp_dir)

    def test_resolve_data_root_auto_discovers_subfolder(self):
        """Verify _resolve_data_root discovers combined_train inside parent data_root."""
        from types import SimpleNamespace
        from training.codetr.train import _resolve_data_root
        temp_dir = tempfile.mkdtemp()
        try:
            parent = os.path.join(temp_dir, "project")
            combined = os.path.join(parent, "combined_train")
            os.makedirs(os.path.join(combined, "images"), exist_ok=True)
            os.makedirs(os.path.join(combined, "annotations"), exist_ok=True)
            with open(os.path.join(combined, "annotations", "instances_train.json"), "w") as f:
                f.write('{"images": [{"id": 1}], "annotations": []}')

            args = SimpleNamespace(data_root=parent)
            resolved = _resolve_data_root(args)
            self.assertEqual(os.path.abspath(resolved), os.path.abspath(combined))
        finally:
            shutil.rmtree(temp_dir)

    def test_stage_dataset_stages_validation_split(self):
        """Verify stage_dataset_if_needed stages val_data_root if provided."""
        temp_dir = tempfile.mkdtemp()
        try:
            train_root = os.path.join(temp_dir, "combined_train")
            os.makedirs(os.path.join(train_root, "images"), exist_ok=True)
            os.makedirs(os.path.join(train_root, "annotations"), exist_ok=True)
            with open(os.path.join(train_root, "annotations", "instances_train.json"), "w") as f:
                f.write('{"images": [{"id": 1}], "annotations": []}')

            val_root = os.path.join(temp_dir, "data")
            os.makedirs(os.path.join(val_root, "vaid", "images"), exist_ok=True)
            with open(os.path.join(val_root, "instances_val.json"), "w") as f:
                f.write('{"images": [{"id": 2}], "annotations": []}')
            with open(os.path.join(val_root, "vaid", "images", "val1.jpg"), "w") as f:
                f.write("val image data")

            stage_dir = os.path.join(temp_dir, "dataset_local")
            os.environ["CODETR_FORCE_STAGE"] = "1"

            staged = stage_dataset_if_needed(
                data_root=train_root,
                stage_dir=stage_dir,
                enabled=True,
                val_data_root=val_root
            )
            self.assertEqual(os.path.abspath(staged), os.path.abspath(stage_dir))
            # Validation images and annotations are now in stage_dir
            self.assertTrue(os.path.isfile(os.path.join(stage_dir, "instances_val.json")))
            self.assertTrue(os.path.isfile(os.path.join(stage_dir, "vaid", "images", "val1.jpg")))
        finally:
            shutil.rmtree(temp_dir)
            if "CODETR_FORCE_STAGE" in os.environ:
                del os.environ["CODETR_FORCE_STAGE"]

if __name__ == '__main__':
    unittest.main()
