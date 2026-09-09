import { DashboardStats, LiveDetectionSummary, RecentViolation, AnalyticsData } from '../types/detection';

export const mockDashboardStats: DashboardStats = {
  totalRiders: 128,
  helmetCompliance: 92.4,
  violations: 17,
  detectionFps: 28,
  motorcyclesCount: 86,
  activeAlerts: 3,
  liveStatus: 'ONLINE',
  modelArchitecture: 'Co-DETR / Swin-L (Pipeline Ready)',
  lastSync: new Date().toISOString()
};

export const mockLiveDetection: LiveDetectionSummary = {
  motorcycles: 3,
  riders: 4,
  helmeted: 3,
  noHelmet: 1,
  violations: 1,
  currentDetection: {
    riderType: 'DRIVER',
    helmetStatus: 'NO_HELMET',
    confidence: 94.7,
    violation: true,
    motorcycleId: 'Bike #03',
    speedKmh: 42.6
  }
};

export const mockRecentViolations: RecentViolation[] = [
  {
    id: 'viol-001',
    time: '10:42:18',
    vehicle: 'Bike #03 (MH-04-AB-2041)',
    violation: 'Driver Without Helmet',
    confidence: 94.7,
    status: 'Detected',
    riderType: 'DRIVER',
    location: 'North Intersection Cam 02'
  },
  {
    id: 'viol-002',
    time: '10:40:51',
    vehicle: 'Bike #01 (DL-08-KL-9122)',
    violation: 'Passenger Without Helmet',
    confidence: 91.3,
    status: 'Detected',
    riderType: 'PASSENGER',
    location: 'Main Toll Gate Cam 01'
  },
  {
    id: 'viol-003',
    time: '10:35:12',
    vehicle: 'Bike #09 (KA-03-EM-4580)',
    violation: 'Driver Without Helmet',
    confidence: 96.2,
    status: 'Logged',
    riderType: 'DRIVER',
    location: 'Expressway Flyover Cam 04'
  },
  {
    id: 'viol-004',
    time: '10:28:44',
    vehicle: 'Bike #04 (TN-09-ZX-1134)',
    violation: 'Passenger Without Helmet',
    confidence: 88.9,
    status: 'Reviewed',
    riderType: 'PASSENGER',
    location: 'South Boulevard Cam 03'
  },
  {
    id: 'viol-005',
    time: '10:15:02',
    vehicle: 'Bike #07 (GJ-01-QQ-7891)',
    violation: 'Driver Without Helmet',
    confidence: 95.8,
    status: 'Logged',
    riderType: 'DRIVER',
    location: 'North Intersection Cam 02'
  },
  {
    id: 'viol-006',
    time: '09:58:30',
    vehicle: 'Bike #12 (AP-10-TR-6543)',
    violation: 'Dual Riders Without Helmet',
    confidence: 97.4,
    status: 'Reviewed',
    riderType: 'DRIVER',
    location: 'Central Junction Cam 05'
  },
  {
    id: 'viol-007',
    time: '09:44:19',
    vehicle: 'Bike #02 (MH-12-RT-3321)',
    violation: 'Passenger Without Helmet',
    confidence: 89.6,
    status: 'Pending',
    riderType: 'PASSENGER',
    location: 'East Corridor Cam 01'
  },
  {
    id: 'viol-008',
    time: '09:20:05',
    vehicle: 'Bike #15 (UP-32-BZ-9011)',
    violation: 'Driver Without Helmet',
    confidence: 93.1,
    status: 'Logged',
    riderType: 'DRIVER',
    location: 'North Intersection Cam 02'
  }
];

export const mockAnalyticsData: AnalyticsData = {
  complianceTrend: [
    { time: '06:00', compliance: 95.2, target: 95 },
    { time: '08:00', compliance: 89.4, target: 95 },
    { time: '10:00', compliance: 92.4, target: 95 },
    { time: '12:00', compliance: 94.1, target: 95 },
    { time: '14:00', compliance: 91.8, target: 95 },
    { time: '16:00', compliance: 88.5, target: 95 },
    { time: '18:00', compliance: 90.7, target: 95 },
    { time: '20:00', compliance: 93.6, target: 95 }
  ],
  violationsOverTime: [
    { hour: '06:00', violations: 3, warnings: 5 },
    { hour: '08:00', violations: 14, warnings: 12 },
    { hour: '10:00', violations: 17, warnings: 9 },
    { hour: '12:00', violations: 8, warnings: 7 },
    { hour: '14:00', violations: 11, warnings: 8 },
    { hour: '16:00', violations: 19, warnings: 15 },
    { hour: '18:00', violations: 15, warnings: 11 },
    { hour: '20:00', violations: 6, warnings: 4 }
  ],
  riderComparison: {
    driverViolations: 42,
    passengerViolations: 31
  },
  confidenceDistribution: [
    { range: '80-85%', count: 8 },
    { range: '85-90%', count: 19 },
    { range: '90-95%', count: 36 },
    { range: '95-100%', count: 65 }
  ],
  motorcycleVolume: [
    { day: 'Mon', count: 420 },
    { day: 'Tue', count: 465 },
    { day: 'Wed', count: 512 },
    { day: 'Thu', count: 489 },
    { day: 'Fri', count: 560 },
    { day: 'Sat', count: 390 },
    { day: 'Sun', count: 340 }
  ]
};
