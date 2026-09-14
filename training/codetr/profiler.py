import torch
import time
from collections import defaultdict

class ComponentProfiler:
    def __init__(self):
        self.timings = defaultdict(list)
        self.events = {}
        self.use_cuda = torch.cuda.is_available()
        
    def _get_events(self, name):
        if name not in self.events:
            if self.use_cuda:
                self.events[name] = (torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True))
            else:
                self.events[name] = None
        return self.events[name]

    def profile_block(self, name, func, *args, **kwargs):
        if self.use_cuda:
            start_evt, end_evt = self._get_events(name)
            start_evt.record()
            result = func(*args, **kwargs)
            end_evt.record()
            self.timings[name].append((start_evt, end_evt))
        else:
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            self.timings[name].append((start_time, end_time))
            
        return result

    def print_summary(self):
        if self.use_cuda:
            torch.cuda.synchronize()
        print("\n" + "=" * 60)
        print("  COMPONENT PROFILING SUMMARY (Averaged over iters)")
        print("=" * 60)
        
        # Calculate averages
        for name, timing_data in self.timings.items():
            # Skip first 2 warmups if possible
            valid_pairs = timing_data[2:] if len(timing_data) > 3 else timing_data
            
            total_ms = 0
            for s, e in valid_pairs:
                if self.use_cuda:
                    total_ms += s.elapsed_time(e)
                else:
                    total_ms += (e - s) * 1000.0
                
            avg_ms = total_ms / len(valid_pairs) if valid_pairs else 0
            print(f"  {name.ljust(25)} : {avg_ms:.2f} ms")
        print("=" * 60 + "\n")

global_profiler = ComponentProfiler()

def patch_model_for_profiling(model):
    """Monkey-patch the model to intercept major components safely handling ModuleLists."""
    
    def patch_component(comp, name_prefix, method_name='forward_train'):
        if isinstance(comp, torch.nn.ModuleList) or isinstance(comp, (list, tuple)):
            for i, c in enumerate(comp):
                patch_component(c, f"{name_prefix} [{i}]", method_name)
            return

        if hasattr(comp, method_name):
            orig_fn = getattr(comp, method_name)
            # Create a factory to correctly bind name and orig_fn in the closure
            def make_prof_fn(name, orig):
                def prof_fn(*args, **kwargs):
                    return global_profiler.profile_block(name, orig, *args, **kwargs)
                return prof_fn
            setattr(comp, method_name, make_prof_fn(name_prefix, orig_fn))

    # 1. Backbone
    if hasattr(model, 'backbone'):
        patch_component(model.backbone, "1. Backbone", "forward")

    # 2. Neck / ChannelMapper
    if hasattr(model, 'neck'):
        patch_component(model.neck, "2. Neck/ChannelMapper", "forward")
        
    # 3. Query Head (CoDINO Head)
    if hasattr(model, 'query_head'):
        patch_component(model.query_head, "3. CoDINO Head", "forward_train")

    # 4. RPN Head
    if hasattr(model, 'rpn_head'):
        patch_component(model.rpn_head, "4. RPN Head", "forward_train")

    # 5. RoI Head
    if hasattr(model, 'roi_head'):
        patch_component(model.roi_head, "5. Aux RoI Head", "forward_train")
        
    # 6. BBox Head (ATSS in Co-DETR)
    if hasattr(model, 'bbox_head'):
        patch_component(model.bbox_head, "6. Aux BBox Head (ATSS)", "forward_train")

    # Patch the main forward_train to catch everything
    if hasattr(model, 'forward_train'):
        orig_forward_train = model.forward_train
        def prof_forward_train(*args, **kwargs):
            return global_profiler.profile_block("0. Total Forward Pass", orig_forward_train, *args, **kwargs)
        model.forward_train = prof_forward_train
    
    return model
