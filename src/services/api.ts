const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'https://trafficeye.onrender.com';

// Types for Gemini API responses
export interface GeminiVehicleDetails {
  vehicle_type: string;
  wheel_category: string;
  color: string;
  make: string;
  model: string;
  number_plate: {
    text: string;
    confidence: {
      score: string;
      reason: string;
    };
  };
  confidence_scores: {
    color: {
      score: string;
      reason: string;
    };
    make: {
      score: string;
      reason: string;
    };
    model: {
      score: string;
      reason: string;
    };
  };
}

export interface GeminiViolation {
  type: string;
  probability: string;
  reason: string;
}

export interface RTAVerification {
  registration_number: string;
  status: string;
  matches: boolean;
  confidence_scores: {
    make: number;
    model: number;
    color: number;
  };
  overall_score: number;
}

export interface GeminiAnalysisResponse {
  success: boolean;
  gemini_analysis: {
    vehicle_details: GeminiVehicleDetails;
    violations: GeminiViolation[];
  };
  rta_verification: RTAVerification | null;
  timestamp: string;
  error?: string;
  errorCode?: string;
}

export interface BackendHealthResponse {
  status: string;
  timestamp: string;
  service: string;
  tsechallan_configured: boolean;
  gemini_configured: boolean;
  rta_data_loaded: number;
  endpoints: {
    tsechallan_vehicle_lookup: string;
    gemini_image_analysis: string;
    test_gemini: string;
    rta_data: string;
  };
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BACKEND_URL;
  }

  // Test backend connectivity
  async testBackendHealth(): Promise<BackendHealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    return response.json();
  }

  // Test Gemini API configuration
  async testGeminiConnection(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/test-gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Gemini test failed: ${response.status}`);
    }
    return response.json();
  }

  // Upload and analyze image with Gemini
  async analyzeImage(imageFile: File): Promise<GeminiAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/analyze-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Image analysis failed: ${response.status}`);
    }

    return response.json();
  }

  // Get vehicle details from TSeChallan (if needed)
  async getVehicleDetails(registrationNumber: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/vehicle-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registrationNumber }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Vehicle lookup failed: ${response.status}`);
    }

    return response.json();
  }

  // Get RTA sample data
  async getRTAData(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/rta-data`);
    if (!response.ok) {
      throw new Error(`RTA data fetch failed: ${response.status}`);
    }
    return response.json();
  }
}

export const apiService = new ApiService(); 