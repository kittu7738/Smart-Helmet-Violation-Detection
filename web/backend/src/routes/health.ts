import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'smart-helmet-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiEngine: {
      framework: 'Co-DETR',
      backbone: 'Swin-L',
      status: 'inference_pipeline_ready'
    }
  });
});

export default router;
