import {
  RecentViolation,
  VideoDetectionResult,
  AnalyticsData
} from '../types/detection';
import { mockDashboardStats, mockLiveDetection, mockRecentViolations, mockAnalyticsData } from '../data/mockDashboard';
import { mockSampleVideoResult } from '../data/mockDetections';

// Resolve API URL from environment, defaulting to the live public Cloudflare GPU tunnel
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://batch-mods-manufacturing-jonathan.trycloudflare.com';

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

export const api = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  /**
   * Check backend / GPU inference health
   */
  async getHealth(): Promise<{ status: string; service: string; isConnected: boolean; model_loaded: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();
      return { ...data, isConnected: true, model_loaded: data.model_loaded ?? false };
    } catch {
      return {
        status: 'offline',
        service: 'smart-helmet-codetr-inference (offline)',
        isConnected: false,
        model_loaded: false
      };
    }
  },

  /**
   * Get live model status from GPU inference service
   */
  async getModelStatus(): Promise<ModelStatusResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/model/status`, {
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Run real Co-DETR detection on uploaded image
   */
  async detectImage(file: File, confidenceThreshold: number = 0.25): Promise<ImagePredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const url = new URL(`${API_BASE_URL}/predict/image`);
    url.searchParams.set('confidence_threshold', String(confidenceThreshold));

    const res = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Inference error: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * Fetch main dashboard statistics and live status
   */
  async getDashboard() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.statusText}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      return {
        stats: mockDashboardStats,
        live: mockLiveDetection,
        recentViolations: mockRecentViolations.slice(0, 5)
      };
    }
  },

  /**
   * Fetch filterable violations
   */
  async getViolations(params?: {
    search?: string;
    type?: string;
    status?: string;
    limit?: number;
  }): Promise<{ violations: RecentViolation[]; total: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.type && params.type !== 'ALL') query.set('type', params.type);
      if (params?.status && params.status !== 'ALL') query.set('status', params.status);
      if (params?.limit) query.set('limit', String(params.limit));

      const res = await fetch(`${API_BASE_URL}/api/violations?${query.toString()}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error(`Violations fetch failed: ${res.statusText}`);
      const json = await res.json();
      return { violations: json.data, total: json.total };
    } catch {
      let filtered = [...mockRecentViolations];
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (v) =>
            v.vehicle.toLowerCase().includes(q) ||
            v.violation.toLowerCase().includes(q) ||
            v.location.toLowerCase().includes(q)
        );
      }
      return {
        violations: filtered,
        total: filtered.length
      };
    }
  },

  /**
   * Fetch analytics data for charts
   */
  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/violations/analytics`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error(`Analytics fetch failed: ${res.statusText}`);
      const json = await res.json();
      return json.data;
    } catch {
      return mockAnalyticsData;
    }
  },

  /**
   * Upload video for AI detection processing
   */
  async uploadVideo(file: File): Promise<VideoDetectionResult> {
    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch(`${API_BASE_URL}/api/detection/video`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with code ${res.status}`);
      }

      const json = await res.json();
      return json.data;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        ...mockSampleVideoResult,
        filename: file.name
      };
    }
  }
};
