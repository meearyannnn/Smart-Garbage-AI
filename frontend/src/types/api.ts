/**
 * API service for garbage detection frontend
 * Updated to support GPS and dashboard endpoints
 */

const API_BASE = "http://127.0.0.1:8000";

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface DetectionResult {
  success: boolean;
  mode: string;
  detections: Array<{
    label: string;
    confidence: number;
    bbox: number[];
    area?: number;
    source?: string;
  }>;
  total_objects: number;
  output_image?: string;
  image_base64?: string;
  gps?: {
    latitude: number | null;
    longitude: number | null;
  };
}

/**
 * Get user's current GPS location
 * Returns a promise that resolves with coordinates or uses default
 */
export async function getUserLocation(): Promise<GPSCoordinates> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported, using default location");
      resolve({
        latitude: 28.6139,
        longitude: 77.2090,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        // Fallback to default location (Delhi)
        resolve({
          latitude: 28.6139,
          longitude: 77.2090,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Main detection function - works with your existing code
 * @param image File to detect
 * @param mode "single" or "pile" (mapped to yolo_cnn/dual_yolo)
 * @param gps Optional GPS coordinates
 */
export async function runDetection(
  image: File,
  mode: "single" | "pile",
  gps?: GPSCoordinates
): Promise<DetectionResult> {
  // Map frontend mode to backend mode
  const backendMode = mode === "single" ? "yolo_cnn" : "dual_yolo";

  const formData = new FormData();
  formData.append("file", image);
  formData.append("mode", backendMode);

  // Add GPS if available
  if (gps) {
    formData.append("latitude", gps.latitude.toString());
    formData.append("longitude", gps.longitude.toString());
  }

  const res = await fetch(`${API_BASE}/detect`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Detection failed");
  }

  return res.json();
}

/**
 * Process webcam frame
 * @param file Image file from webcam capture
 * @param mode "single" or "pile"
 * @param gps Optional GPS coordinates
 */
export async function processWebcamFrame(
  file: File,
  mode: "single" | "pile",
  gps?: GPSCoordinates
): Promise<DetectionResult> {
  const backendMode = mode === "single" ? "yolo_cnn" : "dual_yolo";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", backendMode);

  if (gps) {
    formData.append("latitude", gps.latitude.toString());
    formData.append("longitude", gps.longitude.toString());
  }

  const res = await fetch(`${API_BASE}/detect-frame`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Frame processing failed");
  }

  return res.json();
}

/**
 * Process base64 encoded image (alternative method)
 */
export async function processBase64Image(
  imageData: string,
  mode: "single" | "pile",
  gps?: GPSCoordinates
): Promise<DetectionResult> {
  const backendMode = mode === "single" ? "yolo_cnn" : "dual_yolo";

  const formData = new FormData();
  formData.append("image_data", imageData);
  formData.append("mode", backendMode);

  if (gps) {
    formData.append("latitude", gps.latitude.toString());
    formData.append("longitude", gps.longitude.toString());
  }

  const res = await fetch(`${API_BASE}/detect-base64`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Base64 processing failed");
  }

  return res.json();
}

/**
 * Dashboard API calls
 */
export const dashboardAPI = {
  async getSummary() {
    const response = await fetch(`${API_BASE}/dashboard/summary`);
    if (!response.ok) throw new Error("Failed to fetch summary");
    return response.json();
  },

  async getHeatmap(filters?: { waste_type?: string; mode?: string }) {
    const params = new URLSearchParams();
    if (filters?.waste_type && filters.waste_type !== "All") {
      params.append("waste_type", filters.waste_type);
    }
    if (filters?.mode && filters.mode !== "All Modes") {
      // Map frontend mode to backend mode
      const backendMode = filters.mode === "Single Object" ? "yolo_cnn" : 
                         filters.mode === "Garbage Pile" ? "dual_yolo" : 
                         filters.mode;
      params.append("mode", backendMode);
    }

    const url = `${API_BASE}/dashboard/heatmap${params.toString() ? `?${params}` : ""}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch heatmap");
    return response.json();
  },

  async getRecent(limit = 10) {
    const response = await fetch(`${API_BASE}/dashboard/recent?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch recent detections");
    return response.json();
  },

  async getWasteTypeDistribution() {
    const response = await fetch(`${API_BASE}/dashboard/stats/waste-type`);
    if (!response.ok) throw new Error("Failed to fetch waste type stats");
    return response.json();
  },

  async getTemporalStats(interval: "hour" | "day" | "week" = "day") {
    const response = await fetch(
      `${API_BASE}/dashboard/stats/temporal?interval=${interval}`
    );
    if (!response.ok) throw new Error("Failed to fetch temporal stats");
    return response.json();
  },

  async getModeComparison() {
    const response = await fetch(`${API_BASE}/dashboard/stats/mode-comparison`);
    if (!response.ok) throw new Error("Failed to fetch mode comparison");
    return response.json();
  },
};

/**
 * GPS Watchdog for continuous tracking
 */
export class GPSWatchdog {
  private watchId: number | null = null;
  private callback: (coords: GPSCoordinates) => void;

  constructor(callback: (coords: GPSCoordinates) => void) {
    this.callback = callback;
  }

  start() {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.warn("GPS watch error:", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

/**
 * Helper: Check if GPS is available
 */
export function isGPSAvailable(): boolean {
  return "geolocation" in navigator;
}

/**
 * Helper: Request GPS permission
 */
export async function requestGPSPermission(): Promise<boolean> {
  try {
    await getUserLocation();
    return true;
  } catch {
    return false;
  }
}

export default {
  runDetection,
  processWebcamFrame,
  processBase64Image,
  getUserLocation,
  dashboardAPI,
  GPSWatchdog,
  isGPSAvailable,
  requestGPSPermission,
};