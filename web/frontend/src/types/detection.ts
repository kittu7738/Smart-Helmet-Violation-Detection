export type HelmetStatus = 'HELMET' | 'NO_HELMET';
export type RiderType = 'DRIVER' | 'PASSENGER';
export type ViolationStatus = 'Detected' | 'Logged' | 'Reviewed' | 'Pending';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Rider {
  id: string;
  riderType: RiderType;
  helmetStatus: HelmetStatus;
  confidence: number;
  violation: boolean;
  boundingBox?: BoundingBox;
}

export interface Motorcycle {
  id: string;
  licensePlate?: string;
  confidence: number;
  speedKmh?: number;
  riders: Rider[];
  boundingBox?: BoundingBox;
}

export interface Detection {
  id: string;
  motorcycleId: string;
  riderType: RiderType;
  helmetStatus: HelmetStatus;
  confidence: number;
  violation: boolean;
  timestamp: string;
  location?: string;
  snapshotUrl?: string;
}

export interface RecentViolation {
  id: string;
  time: string;
  vehicle: string;
  violation: string;
  confidence: number;
  status: ViolationStatus;
  riderType: RiderType;
  location: string;
}

export interface DashboardStats {
  totalRiders: number;
  helmetCompliance: number;
  violations: number;
  detectionFps: number;
  motorcyclesCount: number;
  activeAlerts: number;
  liveStatus: 'ONLINE' | 'STANDBY' | 'DEGRADED';
  modelArchitecture: string;
  lastSync: string;
}

export interface LiveDetectionSummary {
  motorcycles: number;
  riders: number;
  helmeted: number;
  noHelmet: number;
  violations: number;
  currentDetection: {
    riderType: RiderType;
    helmetStatus: HelmetStatus;
    confidence: number;
    violation: boolean;
    motorcycleId: string;
    speedKmh: number;
  };
}

export interface VideoTimelinePoint {
  timestampSec: number;
  motorcycles: number;
  violations: number;
  label?: string;
}

export interface VideoDetectionResult {
  id: string;
  filename: string;
  durationSeconds: number;
  framesProcessed: number;
  fps: number;
  totalMotorcycles: number;
  totalViolations: number;
  complianceRate: number;
  violationsBreakdown: RecentViolation[];
  timeline: VideoTimelinePoint[];
  processedAt: string;
}

export interface AnalyticsData {
  complianceTrend: Array<{ time: string; compliance: number; target: number }>;
  violationsOverTime: Array<{ hour: string; violations: number; warnings: number }>;
  riderComparison: { driverViolations: number; passengerViolations: number };
  confidenceDistribution: Array<{ range: string; count: number }>;
  motorcycleVolume: Array<{ day: string; count: number }>;
}
