import { Router, Request, Response } from 'express';
import { detectionStore } from '../services/detectionStore';

const router = Router();

// GET /api/dashboard — real aggregated stats from detection store
router.get('/', (_req: Request, res: Response) => {
  const metrics = detectionStore.getMetrics();
  const { violations: recentViolations } = detectionStore.getViolationRows({ limit: 5 });

  res.json({
    success: true,
    data: {
      stats: {
        totalRiders: metrics.totalDrivers + metrics.totalPassengers,
        helmetCompliance: metrics.helmetCompliancePercentage,
        withHelmet: metrics.withHelmet,
        withoutHelmet: metrics.withoutHelmet,
        violations: metrics.totalViolations,
        detectionFps: 0,
        motorcyclesCount: metrics.totalMotorcycles,
        activeAlerts: metrics.totalViolations,
        liveStatus: 'ONLINE',
        modelArchitecture: 'Co-DETR (ResNet-18 FP16)',
        lastSync: new Date().toISOString()
      },
      live: {
        motorcycles: metrics.totalMotorcycles,
        riders: metrics.totalDrivers + metrics.totalPassengers,
        helmeted: metrics.withHelmet,
        noHelmet: metrics.withoutHelmet,
        violations: metrics.totalViolations
      },
      recentViolations
    }
  });
});

export default router;
