# Co-DETR Training Module (Paper Reproduction)

This directory is designated for the training implementation of the research paper:

> **"Robust Motorcycle Helmet Detection in Real-World Scenarios: Using Co-DETR and Minority Class Enhancement"** (CVPRW 2024)

---

## Architecture Plan (Scheduled for Phase 2 & Future Milestones)

- **Model Framework**: Co-DETR (Collaborative Detection Transformer) based on Co-DINO with Swin-Large (`Swin-L`) backbone.
- **Target Classes**: 9 classes (Motorbike, DHelmet, DNoHelmet, P1Helmet, P1NoHelmet, P2Helmet, P2NoHelmet, P0Helmet, P0NoHelmet).
- **Minority Class Enhancement**: Minority Optimizer & Virtual Expander (Phase 3).
- **Execution Target**: Google Colab Tesla T4 GPU.

> [!NOTE]
> In accordance with Phase 1 scope:
> - Model training is **not** implemented in this phase.
> - Only dataset inspection, validation, and preparation for AI City Track 5 are handled in Phase 1.
