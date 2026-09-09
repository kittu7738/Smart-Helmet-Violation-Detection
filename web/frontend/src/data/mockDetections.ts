import { Detection, VideoDetectionResult } from '../types/detection';

export const mockDetectionsList: Detection[] = [
  {
    id: 'det-101',
    motorcycleId: 'Bike #01',
    riderType: 'DRIVER',
    helmetStatus: 'HELMET',
    confidence: 96.8,
    violation: false,
    timestamp: '10:43:10',
    location: 'Cam 01 - Main Toll'
  },
  {
    id: 'det-102',
    motorcycleId: 'Bike #01',
    riderType: 'PASSENGER',
    helmetStatus: 'NO_HELMET',
    confidence: 91.3,
    violation: true,
    timestamp: '10:43:10',
    location: 'Cam 01 - Main Toll'
  },
  {
    id: 'det-103',
    motorcycleId: 'Bike #02',
    riderType: 'DRIVER',
    helmetStatus: 'HELMET',
    confidence: 98.2,
    violation: false,
    timestamp: '10:43:02',
    location: 'Cam 02 - North Intersection'
  },
  {
    id: 'det-104',
    motorcycleId: 'Bike #03',
    riderType: 'DRIVER',
    helmetStatus: 'NO_HELMET',
    confidence: 94.7,
    violation: true,
    timestamp: '10:42:18',
    location: 'Cam 02 - North Intersection'
  },
  {
    id: 'det-105',
    motorcycleId: 'Bike #04',
    riderType: 'DRIVER',
    helmetStatus: 'HELMET',
    confidence: 97.1,
    violation: false,
    timestamp: '10:41:40',
    location: 'Cam 03 - Expressway Flyover'
  }
];

export const mockSampleVideoResult: VideoDetectionResult = {
  id: 'vid-demo-001',
  filename: 'traffic_junction_cctv_sample.mp4',
  durationSeconds: 45,
  framesProcessed: 1350,
  fps: 30,
  totalMotorcycles: 18,
  totalViolations: 3,
  complianceRate: 83.3,
  violationsBreakdown: [
    {
      id: 'v-vid-1',
      time: '00:08.4',
      vehicle: 'Bike #02 (Blue Pulsar)',
      violation: 'Driver Without Helmet',
      confidence: 95.1,
      status: 'Detected',
      riderType: 'DRIVER',
      location: 'Lane 1 Nearside'
    },
    {
      id: 'v-vid-2',
      time: '00:22.1',
      vehicle: 'Bike #07 (Silver Activa)',
      violation: 'Passenger Without Helmet',
      confidence: 92.4,
      status: 'Detected',
      riderType: 'PASSENGER',
      location: 'Lane 2 Farside'
    },
    {
      id: 'v-vid-3',
      time: '00:39.8',
      vehicle: 'Bike #14 (Black Splendor)',
      violation: 'Driver Without Helmet',
      confidence: 97.6,
      status: 'Detected',
      riderType: 'DRIVER',
      location: 'Lane 1 Center'
    }
  ],
  timeline: [
    { timestampSec: 5, motorcycles: 2, violations: 0 },
    { timestampSec: 8, motorcycles: 3, violations: 1, label: 'Violation: Driver No Helmet' },
    { timestampSec: 15, motorcycles: 4, violations: 0 },
    { timestampSec: 22, motorcycles: 3, violations: 1, label: 'Violation: Passenger No Helmet' },
    { timestampSec: 30, motorcycles: 2, violations: 0 },
    { timestampSec: 40, motorcycles: 4, violations: 1, label: 'Violation: Driver No Helmet' },
    { timestampSec: 45, motorcycles: 0, violations: 0 }
  ],
  processedAt: new Date().toISOString()
};
