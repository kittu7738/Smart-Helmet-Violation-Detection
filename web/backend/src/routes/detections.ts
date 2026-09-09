import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { MockDetectionService } from '../services/mockDetectionService';

const router = Router();

// Configure multer storage for video uploads
const uploadDir = path.join(__dirname, '../../uploads');
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

// GET /api/detections
router.get('/', (_req: Request, res: Response) => {
  const detections = MockDetectionService.getAllDetections();
  res.json({
    success: true,
    data: detections
  });
});

// POST /api/detection/video
router.post('/video', upload.single('video'), (req: Request, res: Response) => {
  try {
    const file = req.file;
    const filename = file ? file.originalname : 'sample_traffic_feed.mp4';
    
    // In production, this will forward to Python Co-DETR inference service:
    // await axios.post(process.env.PYTHON_INFERENCE_URL + '/detect', form)
    // For now, return structured mock detection response
    const results = MockDetectionService.processMockVideoDetection(filename);

    res.json({
      success: true,
      message: 'Video processed successfully by Smart Helmet AI pipeline (Mock Engine)',
      data: results
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process video detection'
    });
  }
});

export default router;
