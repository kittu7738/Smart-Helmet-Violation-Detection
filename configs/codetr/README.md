# Co-DETR Configuration (Paper Reproduction)

This directory will house the configuration files for Co-DETR (e.g. MMDetection / Co-DETR config files specifying `Swin-L` backbone, multi-scale training schedules, and 9-class dataset heads).

---

### Planned Configuration Components (Phase 2):
1. Backbone: `Swin-Large` pre-trained on ImageNet-22K
2. Multi-scale feature extractor and query heads
3. Number of classes: 9 (`num_classes=9`)
4. Learning rate schedules, batch sizing for Tesla T4 GPU (16 GB VRAM)
