import {
  RecentViolation,
  VideoDetectionResult,
  AnalyticsData,
  RealMetrics
} from '../types/detection';

const STORAGE_KEY = 'SMART_HELMET_API_URL';
const DEFAULT_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://tion-guided-generating-citysearch.trycloudflare.com';

let currentApiBaseUrl: string = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim().replace(/\/$/, '');
  }
  return DEFAULT_URL.replace(/\/$/, '');
})();

// Secondary backend base (for local development or Vercel serverless)
const BACKEND_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? ''
    : 'http://localhost:5001');

export interface DetectionItem {
  class_id: number;
  class_name: string;
  display_name: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  violation: boolean;
}

export interface ImagePredictionResponse {
  success: boolean;
  detections: DetectionItem[];
  summary: {
    vehicles: number;
    riders: number;
    helmet_detected: number;
    violations: number;
    total_detections: number;
  };
  inference_time_ms: number;
  image_width: number;
  image_height: number;
  model_name: string;
  device: string;
}

export interface ModelStatusResponse {
  model_name: string;
  backbone: string;
  loaded: boolean;
  device: string;
  checkpoint_path?: string;
  config_path?: string;
  num_classes: number;
  class_names: string[];
  cuda_available: boolean;
  gpu_name?: string;
  memory_allocated_mb?: number;
  memory_reserved_mb?: number;
}

export interface StoredDetectionRecord {
  id: string;
  timestamp: string;
  fileName: string;
  processedImage?: string;
  detections: Array<{
    className: string;
    displayName: string;
    confidence: number;
    bbox: [number, number, number, number];
    violation: boolean;
  }>;
  summary: {
    motorcycles: number;
    drivers: number;
    passengers: number;
    withHelmet: number;
    withoutHelmet: number;
    violations: number;
    driverViolations: number;
    passengerViolations: number;
  };
  inferenceTimeMs: number;
  device?: string;
  status?: string;
}

export interface ActiveDetectionSession {
  file: File | null;
  previewUrl: string | null;
  prediction: ImagePredictionResponse | null;
  confidenceThreshold: number;
  fileName: string | null;
  processedImage?: string | null;
  recentDetections?: any[];
}

let activeSession: ActiveDetectionSession | null = null;

// In-app listener set for live UI updates across pages
type DetectionListener = () => void;
const detectionListeners: Set<DetectionListener> = new Set();

export const api = {
  getBaseUrl(): string {
    return currentApiBaseUrl;
  },

  setBaseUrl(url: string) {
    const cleanUrl = url.trim().replace(/\/$/, '');
    currentApiBaseUrl = cleanUrl;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, cleanUrl);
    }
  },

  resetBaseUrl() {
    currentApiBaseUrl = DEFAULT_URL.replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  /**
   * Subscribe to new real detection events to trigger instant page re-fetch
   */
  onDetection(callback: DetectionListener) {
    detectionListeners.add(callback);
    return () => {
      detectionListeners.delete(callback);
    };
  },

  notifyDetection() {
    detectionListeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Error in detection listener:', err);
      }
    });
  },

  /**
   * Check backend / GPU inference health
   */
  async getHealth(targetUrl?: string): Promise<{ status: string; service: string; isConnected: boolean; model_loaded: boolean; latencyMs?: number }> {
    const url = targetUrl ? targetUrl.trim().replace(/\/$/, '') : currentApiBaseUrl;
    const start = performance.now();
    try {
      const res = await fetch(`${url}/health`, {
        signal: AbortSignal.timeout(4000)
      });
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();
      return { ...data, isConnected: true, model_loaded: data.model_loaded ?? false, latencyMs };
    } catch {
      return {
        status: 'offline',
        service: 'smart-helmet-codetr-inference',
        isConnected: false,
        model_loaded: false
      };
    }
  },

  /**
   * Get live model status from GPU inference service
   */
  async getModelStatus(targetUrl?: string): Promise<ModelStatusResponse | null> {
    const url = targetUrl ? targetUrl.trim().replace(/\/$/, '') : currentApiBaseUrl;
    try {
      const res = await fetch(`${url}/model/status`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  getActiveSession(): ActiveDetectionSession | null {
    if (!activeSession && typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('SMART_HELMET_SESSION');
        if (raw) {
          activeSession = JSON.parse(raw);
        }
      } catch {}
    }
    return activeSession;
  },

  setActiveSession(session: ActiveDetectionSession | null) {
    activeSession = session;
    if (typeof window !== 'undefined') {
      try {
        if (session) {
          const { file, ...serializable } = session;
          sessionStorage.setItem('SMART_HELMET_SESSION', JSON.stringify(serializable));
        } else {
          sessionStorage.removeItem('SMART_HELMET_SESSION');
        }
      } catch {}
    }
  },

  /**
   * Fetch all real detection records from central backend store
   */
  async getDetections(): Promise<StoredDetectionRecord[]> {
    try {
      const res = await fetch(`${currentApiBaseUrl}/api/detections`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {}

    try {
      const res = await fetch(`${BACKEND_BASE}/api/detections`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {}

    return [];
  },

  /**
   * Fetch the latest real detection record from backend
   */
  async getLatestDetection(): Promise<StoredDetectionRecord | null> {
    // Try FastAPI first
    try {
      const res = await fetch(`${currentApiBaseUrl}/api/detections/latest`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.record) {
          return json.record;
        }
      }
    } catch {}

    // Fallback to Express backend
    try {
      const res = await fetch(`${BACKEND_BASE}/api/detections/latest`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.record) {
          return json.record;
        }
      }
    } catch {}

    return null;
  },

  /**
   * Run real Co-DETR detection on uploaded image
   */
  async detectImage(file: File, confidenceThreshold: number = 0.25): Promise<ImagePredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const url = new URL(`${currentApiBaseUrl}/predict/image`);
    // Request with base cutoff 0.05 so the frontend slider can dynamically reveal all real candidates
    const baseCutoff = Math.min(0.05, confidenceThreshold);
    url.searchParams.set('confidence_threshold', String(baseCutoff));

    const res = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Inference server returned HTTP ${res.status}`);
    }

    const data: ImagePredictionResponse = await res.json();

    // Trigger local listeners so Reports & Analytics update immediately
    this.notifyDetection();

    return data;
  },

  /**
   * Normalize a Co-DETR ImagePredictionResponse and save to backend store
   */
  async storeDetectionRecord(result: ImagePredictionResponse, fileName: string): Promise<void> {
    let driverViolations = 0;
    let passengerViolations = 0;
    let drivers = 0;
    let passengers = 0;
    let motorcycles = 0;
    let withHelmet = 0;
    let withoutHelmet = 0;

    for (const det of result.detections) {
      const cn = det.class_name.toLowerCase();
      const conf = det.confidence || 0;
      if (cn === 'bike') {
        if (conf >= 0.20) motorcycles++;
      } else if (cn.includes('driver')) {
        if (conf >= 0.20) drivers++;
        if (cn === 'driver_without_helmet' || det.violation) {
          if (conf >= 0.20) {
            withoutHelmet++;
            driverViolations++;
          }
        } else if (cn === 'driver_with_helmet') {
          if (conf >= 0.20) withHelmet++;
        }
      } else if (cn.includes('passenger')) {
        if (conf >= 0.20) passengers++;
        if (cn === 'passenger_without_helmet' || det.violation) {
          if (conf >= 0.20) {
            withoutHelmet++;
            passengerViolations++;
          }
        } else if (cn === 'passenger_with_helmet') {
          if (conf >= 0.20) withHelmet++;
        }
      }
    }

    const totalViolations = driverViolations + passengerViolations;

    const record: StoredDetectionRecord = {
      id: `det-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      fileName: fileName || 'Unknown',
      detections: result.detections.map((d) => ({
        className: d.class_name,
        displayName: d.display_name,
        confidence: d.confidence,
        bbox: d.bbox,
        violation: (d.class_name === 'driver_without_helmet' || d.class_name === 'passenger_without_helmet') && (d.confidence >= 0.20)
      })),
      summary: {
        motorcycles: motorcycles || result.summary.vehicles,
        drivers,
        passengers,
        withHelmet: withHelmet || result.summary.helmet_detected,
        withoutHelmet: withoutHelmet || result.summary.violations,
        violations: totalViolations,
        driverViolations,
        passengerViolations
      },
      inferenceTimeMs: result.inference_time_ms,
      device: result.device
    };

    // Forward to backends in parallel (Colab FastAPI and Express)
    const targets = [
      `${currentApiBaseUrl}/api/detections/store`,
      `${BACKEND_BASE}/api/detections/store`
    ];

    await Promise.allSettled(
      targets.map((tgt) =>
        fetch(tgt, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
          signal: AbortSignal.timeout(3000)
        })
      )
    );

    this.notifyDetection();
  },

  /**
   * Fetch real filterable violations derived from real Co-DETR detection records.
   * Returns empty array if no records exist. NO MOCK DATA.
   */
  async getViolations(params?: {
    search?: string;
    type?: string;
    status?: string;
    limit?: number;
  }): Promise<{ violations: RecentViolation[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.type && params.type !== 'ALL') query.set('type', params.type);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));

    // Try currentApiBaseUrl (Colab FastAPI) first
    try {
      const res = await fetch(`${currentApiBaseUrl}/api/violations?${query.toString()}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        return {
          violations: Array.isArray(json.data) ? json.data : [],
          total: typeof json.total === 'number' ? json.total : (json.data?.length || 0)
        };
      }
    } catch {
      // Fallback to Express backend
    }

    try {
      const res = await fetch(`${BACKEND_BASE}/api/violations?${query.toString()}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        return {
          violations: Array.isArray(json.data) ? json.data : [],
          total: typeof json.total === 'number' ? json.total : (json.data?.length || 0)
        };
      }
    } catch {
      // Both unreachable
    }

    // Zero mock data fallback
    return { violations: [], total: 0 };
  },

  /**
   * Fetch real aggregated metrics for Analytics page.
   * NO MOCK DATA.
   */
  async getMetrics(): Promise<RealMetrics | null> {
    try {
      const res = await fetch(`${currentApiBaseUrl}/api/metrics`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch {
      // Fallback to Express backend
    }

    try {
      const res = await fetch(`${BACKEND_BASE}/api/metrics`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch {
      // Both unreachable
    }

    return null;
  },

  /**
   * Fetch analytics data for charts from real detection store
   */
  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const metrics = await this.getMetrics();
      if (metrics) {
        return {
          violationsOverTime: metrics.violationsOverTime || [],
          riderComparison: metrics.riderComparison || { driverViolations: 0, passengerViolations: 0 },
        };
      }
    } catch (e) {
      console.warn('[api.getAnalytics] error:', e);
    }

    return {
      violationsOverTime: [],
      riderComparison: { driverViolations: 0, passengerViolations: 0 }
    };
  },

  /**
   * Fetch main dashboard statistics and live status
   */
  async getDashboard() {
    try {
      const res = await fetch(`${currentApiBaseUrl}/api/dashboard`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Try Express backend
    }

    try {
      const res = await fetch(`${BACKEND_BASE}/api/dashboard`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Unreachable
    }

    return null;
  },

  /**
   * Simulated fallback detection when no GPU backend is online
   */
  getSimulatedDetection(imageWidth: number, imageHeight: number): ImagePredictionResponse {
    const w = imageWidth || 1280;
    const h = imageHeight || 720;

    return {
      success: true,
      detections: [
        {
          class_id: 1,
          class_name: 'bike',
          display_name: 'Motorcycle',
          confidence: 0.954,
          bbox: [Math.round(w * 0.24), Math.round(h * 0.38), Math.round(w * 0.76), Math.round(h * 0.89)],
          violation: false
        },
        {
          class_id: 5,
          class_name: 'driver_without_helmet',
          display_name: 'Driver (No Helmet)',
          confidence: 0.912,
          bbox: [Math.round(w * 0.41), Math.round(h * 0.16), Math.round(w * 0.59), Math.round(h * 0.52)],
          violation: true
        }
      ],
      summary: {
        vehicles: 1,
        riders: 1,
        helmet_detected: 0,
        violations: 1,
        total_detections: 2
      },
      inference_time_ms: 114,
      image_width: w,
      image_height: h,
      model_name: 'co_detr_resnet18_fp16',
      device: 'cuda:0'
    };
  },

  async uploadVideo(_file: File): Promise<VideoDetectionResult> {
    throw new Error('Video inference is not supported in the current deployment. Use image detection via the Detection page.');
  }
};
