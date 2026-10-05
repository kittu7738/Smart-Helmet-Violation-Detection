import { Router, Request, Response } from 'express';
import { detectionStore } from '../services/detectionStore';

const router = Router();

// GET /api/violations — return real violation rows derived from stored detection records
router.get('/', (req: Request, res: Response) => {
  const { search, type, status, limit } = req.query;

  const result = detectionStore.getViolationRows({
    search: search ? String(search) : undefined,
    type: (type && type !== 'ALL') ? (String(type) as 'DRIVER' | 'PASSENGER') : 'ALL',
    status: status ? String(status) : undefined,
    limit: limit ? Number(limit) : undefined
  });

  res.json({
    success: true,
    data: result.violations,
    total: result.total
  });
});

// GET /api/violations/analytics — return real aggregated metrics for Analytics page charts
router.get('/analytics', (_req: Request, res: Response) => {
  const metrics = detectionStore.getMetrics();
  res.json({
    success: true,
    data: metrics
  });
});

export default router;
