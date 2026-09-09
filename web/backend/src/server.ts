import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import healthRoute from './routes/health';
import dashboardRoute from './routes/dashboard';
import detectionsRoute from './routes/detections';
import violationsRoute from './routes/violations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*', // Allow development origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/health', healthRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/detections', detectionsRoute);
app.use('/api/violations', violationsRoute);
// Alias for detection video upload matching specification: POST /api/detection/video
app.use('/api/detection', detectionsRoute);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` SMART HELMET AI - REST API SERVER`);
  console.log(` Status: ONLINE`);
  console.log(` Port: ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(` Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`=================================================`);
});

export default app;
