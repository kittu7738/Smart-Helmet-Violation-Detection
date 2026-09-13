import torch
import time
from collections import defaultdict

class ComponentProfiler:
    def __init__(self):
        self.timings = defaultdict(list)
        self.events = {}
        
    def _get_events(self, name):
        if name not in self.events:
            self.events[name] = (torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True))
        return self.events[name]

    def profile_block(self, name, func, *args, **kwargs):
        start_evt, end_evt = self._get_events(name)
        start_evt.record()
        
        result = func(*args, **kwargs)
        
        end_evt.record()
        # We synchronize later when printing to avoid stalling the pipeline here
        self.timings[name].append((start_evt, end_evt))
        
        return result

    def print_summary(self):
        torch.cuda.synchronize()
        print("\n" + "=" * 60)
        print("  CUDA COMPONENT PROFILING SUMMARY (Averaged over iters)")
        print("=" * 60)
        
        # Calculate averages
        for name, event_pairs in self.timings.items():
            # Skip first 2 warmups if possible
            valid_pairs = event_pairs[2:] if len(event_pairs) > 3 else event_pairs
            
            total_ms = 0
            for s, e in valid_pairs:
                total_ms += s.elapsed_time(e)
                
            avg_ms = total_ms / len(valid_pairs) if valid_pairs else 0
            print(f"  {name.ljust(25)} : {avg_ms:.2f} ms")
        print("=" * 60 + "\n")

global_profiler = ComponentProfiler()

def patch_model_for_profiling(model):
    """Monkey-patch the model to intercept major components."""
    
    # 1. Backbone
    if hasattr(model, 'backbone'):
        orig_backbone = model.backbone.forward
        def prof_backbone(*args, **kwargs):
            return global_profiler.profile_block("1. Backbone", orig_backbone, *args, **kwargs)
        model.backbone.forward = prof_backbone

    # 2. Neck / ChannelMapper
    if hasattr(model, 'neck'):
        orig_neck = model.neck.forward
        def prof_neck(*args, **kwargs):
            return global_profiler.profile_block("2. Neck/ChannelMapper", orig_neck, *args, **kwargs)
        model.neck.forward = prof_neck
        
    # 3. Query Head (CoDINO Head)
    if hasattr(model, 'query_head'):
        orig_query_forward = model.query_head.forward_train
        def prof_query_head(*args, **kwargs):
            return global_profiler.profile_block("3. CoDINO Head (Enc+Dec)", orig_query_forward, *args, **kwargs)
        model.query_head.forward_train = prof_query_head

    # 4. RPN Head
    if hasattr(model, 'rpn_head'):
        orig_rpn = model.rpn_head.forward_train
        def prof_rpn(*args, **kwargs):
            return global_profiler.profile_block("4. RPN Head", orig_rpn, *args, **kwargs)
        model.rpn_head.forward_train = prof_rpn

    # 5. RoI Head / ATSS (Depending on architecture)
    if hasattr(model, 'roi_head'):
        orig_roi = model.roi_head.forward_train
        def prof_roi(*args, **kwargs):
            return global_profiler.profile_block("5. Auxiliary RoI/ATSS", orig_roi, *args, **kwargs)
        model.roi_head.forward_train = prof_roi

    # Patch the main forward_train to catch everything
    orig_forward_train = model.forward_train
    def prof_forward_train(*args, **kwargs):
        return global_profiler.profile_block("0. Total Forward Pass", orig_forward_train, *args, **kwargs)
    model.forward_train = prof_forward_train
    
    return model
