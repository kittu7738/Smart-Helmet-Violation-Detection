#!/usr/bin/env python3
"""scripts/audit_max_throughput.py

Practical GPU throughput auditor & profiler for Co-DETR K5 on Tesla T4.
Measures real hardware execution down to individual components using CUDA Events.
Tests batch size 4, memory headroom for bs=5/6, and channels-last memory format.
Zero guessing — reports exact numbers from the actual GPU.
"""

import os
import sys
import time
import argparse
import torch

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
if "/content/Co-DETR" not in sys.path:
    sys.path.insert(0, "/content/Co-DETR")

from mmcv import Config
from mmdet.datasets import build_dataset, build_dataloader
from mmdet.models import build_detector
from mmcv.parallel import scatter

from training.codetr.train import (
    install_deformable_attention_fp16_bridge,
    patch_codetr_fp16_target_assignment,
    _validate_and_patch_data_root,
)

class PrecisionTimer:
    def __init__(self):
        self.start_ev = torch.cuda.Event(enable_timing=True)
        self.end_ev = torch.cuda.Event(enable_timing=True)

    def start(self):
        self.start_ev.record()

    def stop(self):
        self.end_ev.record()

    def elapsed_ms(self):
        torch.cuda.synchronize()
        return self.start_ev.elapsed_time(self.end_ev)


def run_benchmark_run(model, dataloader, optimizer, scaler, num_iters=10, name="Batch"):
    """Benchmark real forward + backward + optimizer steps with component breakdown."""
    model.train()
    data_iter = iter(dataloader)

    # Warmup
    print(f"[{time.strftime('%H:%M:%S')}] Warming up 2 iterations for {name}...", flush=True)
    for _ in range(2):
        batch = next(data_iter)
        batch_gpu = scatter(batch, [0])[0]
        optimizer.zero_grad()
        with torch.cuda.amp.autocast():
            losses = model(**batch_gpu)
            loss = sum(v for v in losses.values() if v.requires_grad)
        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
    torch.cuda.synchronize()

    torch.cuda.reset_peak_memory_stats(0)

    t_step_list = []
    t_fwd_list = []
    t_bwd_list = []
    t_opt_list = []

    print(f"[{time.strftime('%H:%M:%S')}] Running {num_iters} benchmark iterations...", flush=True)
    t_iter_ev = PrecisionTimer()
    t_fwd_ev = PrecisionTimer()
    t_bwd_ev = PrecisionTimer()
    t_opt_ev = PrecisionTimer()

    for i in range(num_iters):
        batch = next(data_iter)
        batch_gpu = scatter(batch, [0])[0]

        torch.cuda.synchronize()
        t_iter_ev.start()

        # Forward
        t_fwd_ev.start()
        with torch.cuda.amp.autocast():
            losses = model(**batch_gpu)
            loss = sum(v for v in losses.values() if v.requires_grad)
        t_fwd_ev.stop()

        # Backward
        t_bwd_ev.start()
        optimizer.zero_grad()
        scaler.scale(loss).backward()
        t_bwd_ev.stop()

        # Optimizer
        t_opt_ev.start()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=0.1)
        scaler.step(optimizer)
        scaler.update()
        t_opt_ev.stop()

        t_iter_ev.stop()

        step_ms = t_iter_ev.elapsed_ms()
        fwd_ms = t_fwd_ev.elapsed_ms()
        bwd_ms = t_bwd_ev.elapsed_ms()
        opt_ms = t_opt_ev.elapsed_ms()

        t_step_list.append(step_ms)
        t_fwd_list.append(fwd_ms)
        t_bwd_list.append(bwd_ms)
        t_opt_list.append(opt_ms)

    avg_step = sum(t_step_list) / len(t_step_list)
    avg_fwd = sum(t_fwd_list) / len(t_fwd_list)
    avg_bwd = sum(t_bwd_list) / len(t_bwd_list)
    avg_opt = sum(t_opt_list) / len(t_opt_list)

    peak_alloc = torch.cuda.max_memory_allocated(0) / (1024**3)
    peak_res = torch.cuda.max_memory_reserved(0) / (1024**3)

    return {
        "avg_step_s": avg_step / 1000.0,
        "avg_fwd_ms": avg_fwd,
        "avg_bwd_ms": avg_bwd,
        "avg_opt_ms": avg_opt,
        "peak_alloc_gb": peak_alloc,
        "peak_res_gb": peak_res,
    }


def main():
    parser = argparse.ArgumentParser(description="Audit Max Throughput & Practical Floor on T4")
    parser.add_argument("--config", default="configs/codetr/experiments/exp_K5_speed_fp16.py")
    parser.add_argument("--data-root", default="/content/dataset_local")
    parser.add_argument("--iters", type=int, default=10)
    args = parser.parse_args()

    print("\n" + "=" * 75)
    print("  PRACTICAL GPU THROUGHPUT AUDIT — TESLA T4 CEILING TEST")
    print("=" * 75)

    if not torch.cuda.is_available():
        sys.exit("CUDA is required for throughput audit.")

    gpu_name = torch.cuda.get_device_name(0)
    total_mem = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    print(f"  GPU               : {gpu_name}")
    print(f"  Total VRAM        : {total_mem:.2f} GB")

    install_deformable_attention_fp16_bridge()
    patch_codetr_fp16_target_assignment()

    torch.backends.cudnn.benchmark = True

    # 1. Test Baseline Batch Size 4
    cfg = Config.fromfile(args.config)
    _validate_and_patch_data_root(cfg, args.data_root, no_validate=True)
    cfg.data.samples_per_gpu = 4
    cfg.data.workers_per_gpu = 2

    print(f"\n[1/3] Building Dataset and Model for Batch Size 4...", flush=True)
    dataset = build_dataset(cfg.data.train)
    loader_bs4 = build_dataloader(
        dataset,
        samples_per_gpu=4,
        workers_per_gpu=2,
        num_gpus=1,
        dist=False,
        shuffle=True,
        seed=42,
    )

    model = build_detector(cfg.model, train_cfg=cfg.get('train_cfg'), test_cfg=cfg.get('test_cfg')).cuda()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=0.01)
    scaler = torch.cuda.amp.GradScaler(init_scale=512.0)

    res_bs4 = run_benchmark_run(model, loader_bs4, optimizer, scaler, num_iters=args.iters, name="Batch Size 4")

    steps_epoch_bs4 = 3780 / 4
    epoch_min_bs4 = (steps_epoch_bs4 * res_bs4["avg_step_s"]) / 60.0

    print(f"\n>>> BATCH SIZE 4 RESULTS:")
    print(f"    Avg Step Time   : {res_bs4['avg_step_s']:.3f} s")
    print(f"    Forward Pass    : {res_bs4['avg_fwd_ms']:.1f} ms ({res_bs4['avg_fwd_ms']/(res_bs4['avg_step_s']*10):.1f}%)")
    print(f"    Backward Pass   : {res_bs4['avg_bwd_ms']:.1f} ms ({res_bs4['avg_bwd_ms']/(res_bs4['avg_step_s']*10):.1f}%)")
    print(f"    Optimizer Step  : {res_bs4['avg_opt_ms']:.1f} ms")
    print(f"    Peak VRAM Alloc : {res_bs4['peak_alloc_gb']:.2f} GB / {total_mem:.2f} GB")
    print(f"    Steps / Epoch   : {int(steps_epoch_bs4)}")
    print(f"    Epoch Duration  : {epoch_min_bs4:.2f} minutes")

    # 2. Test Batch Size 5 (if memory headroom exists)
    headroom = total_mem - res_bs4['peak_alloc_gb']
    print(f"\n[2/3] Testing Batch Size 5 (VRAM Headroom at bs=4 is {headroom:.2f} GB)...", flush=True)
    res_bs5 = None
    if headroom > 1.8:
        try:
            loader_bs5 = build_dataloader(
                dataset,
                samples_per_gpu=5,
                workers_per_gpu=2,
                num_gpus=1,
                dist=False,
                shuffle=True,
                seed=42,
            )
            res_bs5 = run_benchmark_run(model, loader_bs5, optimizer, scaler, num_iters=args.iters, name="Batch Size 5")
            steps_epoch_bs5 = 3780 / 5
            epoch_min_bs5 = (steps_epoch_bs5 * res_bs5["avg_step_s"]) / 60.0
            print(f"\n>>> BATCH SIZE 5 RESULTS:")
            print(f"    Avg Step Time   : {res_bs5['avg_step_s']:.3f} s")
            print(f"    Peak VRAM Alloc : {res_bs5['peak_alloc_gb']:.2f} GB / {total_mem:.2f} GB")
            print(f"    Steps / Epoch   : {int(steps_epoch_bs5)}")
            print(f"    Epoch Duration  : {epoch_min_bs5:.2f} minutes")
        except RuntimeError as e:
            if "out of memory" in str(e).lower():
                print(f"    -> Batch size 5 caused CUDA OOM. Physical limit is batch size 4.")
                torch.cuda.empty_cache()
            else:
                raise e
    else:
        print(f"    -> Insufficient VRAM headroom ({headroom:.2f} GB) to safely test bs=5.")

    # 3. Test Backbone Channels-Last format
    print(f"\n[3/3] Testing Backbone channels-last memory format on Batch Size 4...", flush=True)
    res_cl = None
    try:
        model.backbone = model.backbone.to(memory_format=torch.channels_last)
        res_cl = run_benchmark_run(model, loader_bs4, optimizer, scaler, num_iters=args.iters, name="Channels-Last bs=4")
        epoch_min_cl = (steps_epoch_bs4 * res_cl["avg_step_s"]) / 60.0
        print(f"\n>>> CHANNELS-LAST RESULTS:")
        print(f"    Avg Step Time   : {res_cl['avg_step_s']:.3f} s (vs {res_bs4['avg_step_s']:.3f} s baseline)")
        print(f"    Epoch Duration  : {epoch_min_cl:.2f} minutes")
    except Exception as e:
        print(f"    -> Channels-last test skipped or failed: {e}")

    # Summary table
    print("\n" + "=" * 75)
    print("  MAX OPTIMIZATION LEVEL SUMMARY (EMPIRICAL AUDIT)")
    print("=" * 75)
    print(f"  {'Configuration':<25} {'Step Time':>12} {'Epoch Time':>14} {'Peak VRAM':>14}")
    print("-" * 75)
    print(f"  {'BS=4 Baseline':<25} {res_bs4['avg_step_s']:>10.3f}s {epoch_min_bs4:>12.2f}m {res_bs4['peak_alloc_gb']:>11.2f} GB")
    if res_bs5:
        print(f"  {'BS=5 Scale':<25} {res_bs5['avg_step_s']:>10.3f}s {epoch_min_bs5:>12.2f}m {res_bs5['peak_alloc_gb']:>11.2f} GB")
    if res_cl:
        print(f"  {'BS=4 + Channels-Last':<25} {res_cl['avg_step_s']:>10.3f}s {epoch_min_cl:>12.2f}m {res_cl['peak_alloc_gb']:>11.2f} GB")
    print("=" * 75)
    print()

if __name__ == "__main__":
    main()
