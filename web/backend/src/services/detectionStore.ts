/**
 * web/backend/src/services/detectionStore.ts
 * ============================================
 * Central in-memory detection store — the single backend source of truth
 * for real Co-DETR inference results in the Node/Express backend.
 *
 * Persists records to detection_records.json so they survive server restarts.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

export interface DetectionItem {
  className: string;      // e.g. "driver_without_helmet"
  displayName: string;    // e.g. "Driver (No Helmet)"
  confidence: number;     // 0.0 – 1.0
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  violation: boolean;
}

export interface DetectionSummary {
  motorcycles: number;
  drivers: number;
  passengers: number;
  withHelmet: number;
  withoutHelmet: number;
  violations: number;
  driverViolations: number;
  passengerViolations: number;
}

export interface DetectionRecord {
  id: string;
  timestamp: string;       // ISO 8601
  fileName: string;
  processedImage?: string;
  rawDetections?: DetectionItem[];
  detections: DetectionItem[];
  summary: DetectionSummary;
  inferenceTimeMs: number;
  device?: string;
  status?: string;
}

export interface ViolationRecord {
  id: string;
  time: string;
  vehicle: string;
  violation: string;
  confidence: number;
  status: 'VIOLATION DETECTED' | 'REVIEWED' | 'RESOLVED';
  riderType: 'DRIVER' | 'PASSENGER';
  location: string;
  timestamp: string;
}

export interface AggregatedMetrics {
  totalDetectionRuns: number;
  totalDetections: number;
  totalMotorcycles: number;
  totalDrivers: number;
  totalPassengers: number;
  withHelmet: number;
  withoutHelmet: number;
  totalViolations: number;
  driverViolations: number;
  passengerViolations: number;
  helmetCompliancePercentage: number;
  violationRate: number;
  averageConfidence: number;
  averageInferenceTime: number;
  violationsOverTime: Array<{ hour: string; violations: number; compliant: number }>;
  riderComparison: {
    driverViolations: number;
    passengerViolations: number;
    driverPercent: number;
    passengerPercent: number;
  };
  detectionsOverTime: Array<{ time: string; detections: number; violations: number }>;
  totalRecords: number;
}

const STORE_FILE = 'detection_records.json';
const STORE_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), STORE_FILE)
  : path.join(__dirname, '../../../work_dirs', STORE_FILE);

let records: DetectionRecord[] = [];
let storeLoaded = false;

function loadFromDisk(): void {
  if (storeLoaded) return;
  storeLoaded = true;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        records = parsed;
        console.log(`[DetectionStore] Loaded ${records.length} record(s) from ${STORE_PATH}`);
      }
    }
  } catch (err) {
    console.warn('[DetectionStore] Could not load persisted records:', err);
    records = [];
  }
}

function saveToDisk(): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[DetectionStore] Could not persist records to disk:', err);
  }
}

export const detectionStore = {
  addRecord(record: DetectionRecord): DetectionRecord {
    loadFromDisk();

    // Idempotent deduplication guard
    if (records.length > 0) {
      const latest = records[0];
      if (
        (record.id && latest.id === record.id) ||
        (latest.fileName === record.fileName &&
          Math.abs((latest.inferenceTimeMs || 0) - (record.inferenceTimeMs || 0)) < 0.2 &&
          (latest.detections?.length || 0) === (record.detections?.length || 0))
      ) {
        console.log(`[DetectionStore] Idempotent deduplication: skipping duplicate record for ${record.fileName}`);
        return latest;
      }
    }

    records.unshift(record);
    if (records.length > 1000) records = records.slice(0, 1000);
    saveToDisk();
    console.log(`[DetectionStore] Stored record ${record.id} | ${record.fileName} | violations=${record.summary.violations}`);
    return record;
  },

  getAll(): DetectionRecord[] {
    loadFromDisk();
    return [...records];
  },

  getLatestRecord(): DetectionRecord | null {
    loadFromDisk();
    return records.length > 0 ? { ...records[0] } : null;
  },

  count(): number {
    loadFromDisk();
    return records.length;
  },

  getViolationRows(params?: {
    search?: string;
    type?: 'DRIVER' | 'PASSENGER' | 'ALL';
    status?: string;
    limit?: number;
  }): { violations: ViolationRecord[]; total: number } {
    loadFromDisk();

    const rows: ViolationRecord[] = [];

    for (const rec of records) {
      let timeStr = 'Unknown';
      if (rec.timestamp) {
        try {
          const ts = new Date(rec.timestamp);
          timeStr = ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        } catch {
          timeStr = rec.timestamp.slice(11, 19) || 'Unknown';
        }
      }

      for (const [idx, det] of (rec.detections || []).entries()) {
        const cname = det.className || '';
        // Exact rule: Violation is created ONLY when detection contains driver_without_helmet or passenger_without_helmet
        if (cname !== 'driver_without_helmet' && cname !== 'passenger_without_helmet') {
          continue;
        }

        const isDriver = cname === 'driver_without_helmet';
        const riderType: 'DRIVER' | 'PASSENGER' = isDriver ? 'DRIVER' : 'PASSENGER';
        const violationLabel = isDriver ? 'Driver Without Helmet' : 'Passenger Without Helmet';

        rows.push({
          id: `${rec.id}-v${idx}`,
          time: timeStr,
          vehicle: rec.fileName || 'Unknown',
          violation: violationLabel,
          confidence: Math.round(det.confidence * 1000) / 10,
          status: 'VIOLATION DETECTED',
          riderType,
          location: 'Unknown',
          timestamp: rec.timestamp,
        });
      }
    }

    let filtered = rows;

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

    const limit = params?.limit || 500;
    return {
      violations: filtered.slice(0, limit),
      total: filtered.length,
    };
  },

  getMetrics(): AggregatedMetrics {
    loadFromDisk();

    if (records.length === 0) {
      return {
        totalDetectionRuns: 0,
        totalDetections: 0,
        totalMotorcycles: 0,
        totalDrivers: 0,
        totalPassengers: 0,
        withHelmet: 0,
        withoutHelmet: 0,
        totalViolations: 0,
        driverViolations: 0,
        passengerViolations: 0,
        helmetCompliancePercentage: 0.0,
        violationRate: 0.0,
        averageConfidence: 0.0,
        averageInferenceTime: 0.0,
        violationsOverTime: [],
        riderComparison: {
          driverViolations: 0,
          passengerViolations: 0,
          driverPercent: 0.0,
          passengerPercent: 0.0
        },
        detectionsOverTime: [],
        totalRecords: 0
      };
    }

    let totalDetections = 0;
    let totalMotorcycles = 0;
    let totalDrivers = 0;
    let totalPassengers = 0;
    let withHelmet = 0;
    let withoutHelmet = 0;
    let totalViolations = 0;
    let driverViolations = 0;
    let passengerViolations = 0;
    let sumConfidence = 0;
    let confidenceCount = 0;
    let sumInferenceMs = 0;

    const hourlyMap: Record<string, { violations: number; compliant: number }> = {};
    const timeline: Array<{ time: string; detections: number; violations: number }> = [];

    for (const rec of [...records].reverse()) {
      const s = rec.summary || {
        motorcycles: 0,
        drivers: 0,
        passengers: 0,
        withHelmet: 0,
        withoutHelmet: 0,
        violations: 0,
        driverViolations: 0,
        passengerViolations: 0
      };

      totalDetections += (rec.detections || []).length;
      totalMotorcycles += s.motorcycles;
      totalDrivers += s.drivers;
      totalPassengers += s.passengers;
      withHelmet += s.withHelmet;
      withoutHelmet += s.withoutHelmet;
      totalViolations += s.violations;
      driverViolations += s.driverViolations;
      passengerViolations += s.passengerViolations;
      sumInferenceMs += (rec.inferenceTimeMs || 0);

      for (const det of (rec.detections || [])) {
        if (typeof det.confidence === 'number') {
          sumConfidence += det.confidence;
          confidenceCount++;
        }
      }

      let hourKey = 'Unknown';
      let minKey = 'Unknown';
      if (rec.timestamp) {
        try {
          const ts = new Date(rec.timestamp);
          hourKey = `${String(ts.getHours()).padStart(2, '0')}:00`;
          minKey = `${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`;
        } catch {
          hourKey = 'Unknown';
          minKey = 'Unknown';
        }
      }

      if (!hourlyMap[hourKey]) {
        hourlyMap[hourKey] = { violations: 0, compliant: 0 };
      }
      hourlyMap[hourKey].violations += s.violations;
      hourlyMap[hourKey].compliant += s.withHelmet;

      timeline.push({
        time: minKey,
        detections: (rec.detections || []).length,
        violations: s.violations
      });
    }

    const violationsOverTime = Object.entries(hourlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, data]) => ({ hour, ...data }));

    const totalRiders = withHelmet + withoutHelmet;
    const helmetCompliancePercentage = totalRiders > 0 ? Math.round((withHelmet / totalRiders) * 1000) / 10 : 0.0;
    const violationRate = totalRiders > 0 ? Math.round((withoutHelmet / totalRiders) * 1000) / 10 : 0.0;
    const averageConfidence = confidenceCount > 0 ? Math.round((sumConfidence / confidenceCount) * 1000) / 10 : 0.0;
    const averageInferenceTime = records.length > 0 ? Math.round((sumInferenceMs / records.length) * 10) / 10 : 0.0;

    const riderTotalViolations = driverViolations + passengerViolations;
    const driverPercent = riderTotalViolations > 0 ? Math.round((driverViolations / riderTotalViolations) * 1000) / 10 : 0.0;
    const passengerPercent = riderTotalViolations > 0 ? Math.round((passengerViolations / riderTotalViolations) * 1000) / 10 : 0.0;

    return {
      totalDetectionRuns: records.length,
      totalDetections,
      totalMotorcycles,
      totalDrivers,
      totalPassengers,
      withHelmet,
      withoutHelmet,
      totalViolations,
      driverViolations,
      passengerViolations,
      helmetCompliancePercentage,
      violationRate,
      averageConfidence,
      averageInferenceTime,
      violationsOverTime,
      riderComparison: {
        driverViolations,
        passengerViolations,
        driverPercent,
        passengerPercent
      },
      detectionsOverTime: timeline.slice(-20),
      totalRecords: records.length
    };
  },

  clear(): void {
    records = [];
    saveToDisk();
  }
};
