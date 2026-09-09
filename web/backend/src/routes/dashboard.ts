import { Router, Request, Response } from 'express';
import { MockDetectionService } from '../services/mockDetectionService';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const stats = MockDetectionService.getDashboardStats();
  const live = MockDetectionService.getLiveDetectionSummary();
  const { violations } = MockDetectionService.getRecentViolations({ limit: 5 });

  res.json({
    success: true,
    data: {
      stats,
      live,
      recentViolations: violations
    }
  });
});

export default router;
