import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { detectionStore, DetectionRecord } from '../services/detectionStore';

const router = Router();

// Configure multer storage for video uploads (safe for Vercel /tmp)
const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `traffic-video-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video file format. Supported: mp4, avi, mov, mkv, webm.'));
    }
  }
});

// GET /api/detections — return all real detection records
router.get('/', (_req: Request, res: Response) => {
  const records = detectionStore.getAll();
  res.json({
    success: true,
    data: records,
    total: records.length
  });
});

// POST /api/detections/store — record normalized real Co-DETR detection
router.post('/store', (req: Request, res: Response) => {
  try {
    const body = req.body as DetectionRecord;
    if (!body || !body.id || !body.summary) {
      res.status(400).json({ success: false, error: 'Invalid detection record payload.' });
      return;
    }

    const stored = detectionStore.addRecord(body);
    res.json({
      success: true,
      message: 'Detection record stored.',
      data: stored,
      totalRecords: detectionStore.count()
    });
  } catch (error: any) {
    console.error('[POST /api/detections/store] Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to store detection record' });
  }
});

// POST /api/detection/video
router.post('/video', upload.single('video'), (_req: Request, res: Response) => {
  res.json({
    success: false,
    message: 'Video inference is not supported in the current deployment. Please use the Detection page for real-time Co-DETR image inference.',
  });
});

export default router;
