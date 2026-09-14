import torch
import torch.nn as nn
from training.codetr.profiler import patch_model_for_profiling

class MockRoIHead(nn.Module):
    def forward_train(self, x):
        return x * 2

class MockModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.roi_head = nn.ModuleList([MockRoIHead(), MockRoIHead()])
        
    def forward_train(self, x):
        out = []
        for head in self.roi_head:
            out.append(head.forward_train(x))
        return out

def test_profiler_with_modulelist():
    model = MockModel()
    patched_model = patch_model_for_profiling(model)
    
    # Try forward pass
    res = patched_model.forward_train(torch.tensor(1.0))
    
    # Assert successful execution
    assert res == [torch.tensor(2.0), torch.tensor(2.0)]
