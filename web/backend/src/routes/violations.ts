import { Router, Request, Response } from 'express';
import { MockDetectionService } from '../services/mockDetectionService';

const router = Router();

// GET /api/violations
router.get('/', (req: Request, res: Response) => {
  const { search, type, status, limit } = req.query;

  const result = MockDetectionService.getRecentViolations({
    search: search ? String(search) : undefined,
    type: type ? String(type) : undefined,
    status: status ? String(status) : undefined,
    limit: limit ? Number(limit) : undefined
  });

  res.json({
    success: true,
    data: result.violations,
    total: result.total
  });
});

// GET /api/violations/analytics
router.get('/analytics', (_req: Request, res: Response) => {
  const analytics = MockDetectionService.getAnalyticsData();
  res.json({
    success: true,
    data: analytics
  });
});

export default router;
