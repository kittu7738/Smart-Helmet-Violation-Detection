import {
  DashboardStats,
  LiveDetectionSummary,
  RecentViolation,
  Detection,
  VideoDetectionResult,
  AnalyticsData
} from '../types/detection';
import { mockDashboardStats, mockLiveDetection, mockRecentViolations, mockAnalyticsData } from '../data/mockDashboard';
import { mockDetectionsList, mockSampleVideoResult } from '../data/mockDetections';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface DashboardResponse {
  stats: DashboardStats;
  live: LiveDetectionSummary;
  recentViolations: RecentViolation[];
}

export const api = {
  /**
   * Check backend health and API connectivity
   */
  async getHealth(): Promise<{ status: string; service: string; isConnected: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      const data = await res.json();
      return { ...data, isConnected: true };
    } catch {
      return {
        status: 'offline',
        service: 'smart-helmet-backend (fallback mode)',
        isConnected: false
      };
    }
  },

  /**
   * Fetch main dashboard statistics and live status
   */
  async getDashboard(): Promise<DashboardResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.statusText}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('Backend unavailable, utilizing mock dashboard fallback:', err);
      return {
        stats: mockDashboardStats,
        live: mockLiveDetection,
        recentViolations: mockRecentViolations.slice(0, 5)
      };
    }
  },

  /**
   * Fetch active detections feed
   */
  async getDetections(): Promise<Detection[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/detections`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error(`Detections fetch failed: ${res.statusText}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn('Backend unavailable, using mock detections fallback:', err);
      return mockDetectionsList;
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
    } catch (err) {
      console.warn('Backend unavailable, using mock violations fallback:', err);
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
      if (params?.type && params.type !== 'ALL') {
        filtered = filtered.filter((v) => v.riderType === params.type);
      }
      if (params?.status && params.status !== 'ALL') {
        filtered = filtered.filter((v) => v.status === params.status);
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
    } catch (err) {
      console.warn('Backend unavailable, using mock analytics fallback:', err);
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
    } catch (err) {
      console.warn('Backend video upload failed, returning mock detection result:', err);
      // Simulate slight processing latency
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        ...mockSampleVideoResult,
        filename: file.name
      };
    }
  }
};
