import {
  DashboardStats,
  LiveDetectionSummary,
  RecentViolation,
  Detection,
  VideoDetectionResult,
  AnalyticsData,
  RiderType,
  HelmetStatus,
  ViolationStatus
} from '../types/detection';

export class MockDetectionService {
  private static mockViolations: RecentViolation[] = [
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
    }
  ];

  public static getDashboardStats(): DashboardStats {
    return {
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
  }

  public static getLiveDetectionSummary(): LiveDetectionSummary {
    return {
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
  }

  public static getRecentViolations(params?: {
    search?: string;
    type?: string;
    status?: string;
    limit?: number;
  }): { violations: RecentViolation[]; total: number } {
    let filtered = [...this.mockViolations];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.vehicle.toLowerCase().includes(q) ||
          v.violation.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q)
      );
    }

    if (params?.type && params.type !== 'ALL') {
      filtered = filtered.filter((v) => v.riderType === params.type);
    }

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((v) => v.status === params.status);
    }

    const limit = params?.limit || 20;
    return {
      violations: filtered.slice(0, limit),
      total: filtered.length
    };
  }

  public static getAllDetections(): Detection[] {
    return [
      {
        id: 'det-101',
        motorcycleId: 'Bike #01',
        riderType: 'DRIVER',
        helmetStatus: 'HELMET',
        confidence: 96.8,
        violation: false,
        timestamp: new Date(Date.now() - 5000).toISOString(),
        location: 'Cam 01 - Main Toll'
      },
      {
        id: 'det-102',
        motorcycleId: 'Bike #01',
        riderType: 'PASSENGER',
        helmetStatus: 'NO_HELMET',
        confidence: 91.3,
        violation: true,
        timestamp: new Date(Date.now() - 4800).toISOString(),
        location: 'Cam 01 - Main Toll'
      },
      {
        id: 'det-103',
        motorcycleId: 'Bike #02',
        riderType: 'DRIVER',
        helmetStatus: 'HELMET',
        confidence: 98.2,
        violation: false,
        timestamp: new Date(Date.now() - 3200).toISOString(),
        location: 'Cam 02 - North Intersection'
      },
      {
        id: 'det-104',
        motorcycleId: 'Bike #03',
        riderType: 'DRIVER',
        helmetStatus: 'NO_HELMET',
        confidence: 94.7,
        violation: true,
        timestamp: new Date(Date.now() - 1000).toISOString(),
        location: 'Cam 02 - North Intersection'
      }
    ];
  }

  public static processMockVideoDetection(filename: string): VideoDetectionResult {
    return {
      id: `vid-job-${Date.now()}`,
      filename,
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
  }

  public static getAnalyticsData(): AnalyticsData {
    return {
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
  }
}
