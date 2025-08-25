const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'https://trafficeye.onrender.com';

// Types for Step-by-Step Analysis Responses
export interface StepResponse {
  success: boolean;
  step: number;
  step_name: string;
  data?: any;
  error?: string;
  errorCode?: string;
}

// NEW: Updated structure for the new backend analysis methods
export interface StepAnalysisResponse {
  success: boolean;
  step: number;
  step_name: string;
  timestamp: string;
  results: {
    step1?: StepResponse;
    step2?: StepResponse;
    step3?: StepResponse;
    step4?: StepResponse;
    step5?: StepResponse;
    step6?: StepResponse;
  };
  recommendation: string;
  next_steps: string[];
  error?: string;
  errorCode?: string;
}

// LEGACY: Old workflow structure for backward compatibility
export interface WorkflowResponse {
  success: boolean;
  workflow_name: string;
  timestamp: string;
  steps: StepResponse[];
  summary?: {
    quality_category: string;
    suitable_for_analysis: boolean;
    license_plate_extracted: boolean;
    license_plate: string | null;
    rta_data_found: boolean;
    rta_data: any;
    vehicle_analysis_completed: boolean;
    vehicle_analysis: any;
    comparison_completed: boolean;
    comparison_result: any;
    violation_detection_completed: boolean;
    violation_analysis: any;
    violations_found: number;
    violation_types: string[];
    next_step_recommendation: any;
  };
}

// Enhanced Quality Assessment Types (NEW)
export interface QualityAssessmentData {
  quality_category: 'GOOD' | 'NEEDS_BETTER_REVIEW' | 'BLURRY_NOT_FIT';
  confidence: number;
  reasoning: string;
  suitable_for_analysis: boolean;
  license_plate_extractable: boolean;
  extracted_license_plate?: string;
  extraction_confidence?: number;
  format_validation_failed?: boolean;
}

// Enhanced OCR Types (NEW)
export interface OCRData {
  license_plate: string | null;
  confidence: number;
  extraction_method: string;
  telangana_format_validated: boolean;
  format_valid: boolean;
  extraction_possible: boolean;
  source?: string;
}

// Violation Detection Types
export interface ViolationDetection {
  violation_type: 'No Helmet' | 'Cell Phone Driving' | 'Triple Riding' | 'Wrong Side Driving';
  detected: boolean;
  confidence: number;
  description: string;
  reasoning: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface ViolationAnalysis {
  violations_detected: ViolationDetection[];
  overall_assessment: {
    total_violations: number;
    violation_summary: string;
    image_clarity_for_detection: string;
    analysis_confidence: number;
  };
  enforcement_recommendation: {
    action: 'ISSUE_CHALLAN' | 'REVIEW_REQUIRED' | 'NO_ACTION';
    priority: 'High' | 'Medium' | 'Low';
    notes: string;
  };
  detected_violation_count: number;
  violation_types_found: string[];
}

// Vehicle Comparison Types
export interface VehicleComparison {
  overall_verdict: 'MATCH' | 'PARTIAL_MATCH' | 'MISMATCH';
  confidence_score: number;
  parameter_analysis: {
    color: {
      ai_value: string;
      rta_value: string;
      match_status: 'MATCH' | 'PARTIAL' | 'MISMATCH';
      reasoning: string;
    };
    make: {
      ai_value: string;
      rta_value: string;
      match_status: 'MATCH' | 'PARTIAL' | 'MISMATCH';
      reasoning: string;
    };
    model: {
      ai_value: string;
      rta_value: string;
      match_status: 'MATCH' | 'PARTIAL' | 'MISMATCH';
      reasoning: string;
    };
    vehicle_type: {
      ai_value: string;
      rta_value: string;
      match_status: 'MATCH' | 'PARTIAL' | 'MISMATCH';
      reasoning: string;
    };
  };
  discrepancies: string[];
  explanation: string;
  verification_recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
}

// Legacy types for backward compatibility
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
  google_cloud_vision_configured: boolean;
  rta_data_loaded: number;
  implementation_status: {
    step_1_quality_assessment: string;
    step_2_license_plate_ocr: string;
    step_3_rta_lookup: string;
    step_4_vehicle_analysis: string;
    step_5_details_comparison: string;
    step_6_violation_detection: string;
  };
  endpoints: {
    step6_complete_workflow: string;
    step5_complete_workflow: string;
    step4_complete_workflow: string;
    step3_complete_workflow: string;
    step2_workflow: string;
    violation_detection: string;
    vehicle_comparison: string;
    vehicle_analysis: string;
    rta_details_lookup: string;
    image_quality_assessment: string;
    license_plate_ocr: string;
    [key: string]: string;
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

  // NEW: Step 6 Complete Analysis - Returns new structure
  async analyzeImageStep6(imageFile: File): Promise<StepAnalysisResponse> {
    console.log('🚀 FRONTEND API: Starting Step 6 analysis');
    console.log('  📡 Backend URL:', this.baseUrl);
    console.log('  📡 Full endpoint:', `${this.baseUrl}/api/step6-analysis`);
    console.log('  📁 Image file:', imageFile.name, imageFile.size, 'bytes');
    
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/step6-analysis`, {
      method: 'POST',
      body: formData,
    });

    console.log('📥 FRONTEND API: Response received');
    console.log('  📊 Status:', response.status, response.statusText);
    console.log('  📊 Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('💥 FRONTEND API: Request failed:', errorData);
      throw new Error(errorData.error || `Step 6 analysis failed: ${response.status}`);
    }

    const jsonResponse = await response.json();
    console.log('✅ FRONTEND API: JSON response received');
    console.log('  📋 Response success:', jsonResponse.success);
    console.log('  📋 Response keys:', Object.keys(jsonResponse));
    console.log('  📋 Full response:', jsonResponse);
    
    return jsonResponse;
  }

  // TEST METHOD: Uses hardcoded successful response
  async testAnalyzeImageStep6(imageFile: File): Promise<StepAnalysisResponse> {
    console.log('🧪 USING TEST ENDPOINT - Will return hardcoded success');
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/test-step6-analysis`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Test Step 6 analysis failed: ${response.status}`);
    }

    return response.json();
  }

  // NEW: Step 5 Complete Analysis - Returns new structure
  async analyzeImageStep5(imageFile: File): Promise<StepAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/step5-analysis`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Step 5 analysis failed: ${response.status}`);
    }

    return response.json();
  }

  // NEW: Step 4 Complete Analysis - Returns new structure
  async analyzeImageStep4(imageFile: File): Promise<StepAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/step4-analysis`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Step 4 analysis failed: ${response.status}`);
    }

    return response.json();
  }

  // NEW: Step 3 Complete Analysis - Returns new structure
  async analyzeImageStep3(imageFile: File): Promise<StepAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/step3-analysis`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Step 3 analysis failed: ${response.status}`);
    }

    return response.json();
  }

  // NEW: Step 2 Complete Analysis - Returns new structure
  async analyzeImageStep2(imageFile: File): Promise<StepAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/step2-analysis`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Step 2 analysis failed: ${response.status}`);
    }

    return response.json();
  }

  // Individual Step Operations
  async assessImageQuality(imageFile: File): Promise<StepResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/api/assess-image-quality`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Quality assessment failed: ${response.status}`);
    }

    return response.json();
  }

  async extractLicensePlate(imageFile: File, qualityCategory?: string): Promise<StepResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (qualityCategory) {
      formData.append('quality_category', qualityCategory);
    }

    const response = await fetch(`${this.baseUrl}/api/extract-license-plate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `License plate extraction failed: ${response.status}`);
    }

    return response.json();
  }

  async fetchRTADetails(licensePlate: string): Promise<StepResponse> {
    const response = await fetch(`${this.baseUrl}/api/fetch-rta-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ license_plate: licensePlate }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `RTA lookup failed: ${response.status}`);
    }

    return response.json();
  }

  async analyzeVehicleDetails(imageFile: File, qualityCategory?: string): Promise<StepResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (qualityCategory) {
      formData.append('quality_category', qualityCategory);
    }

    const response = await fetch(`${this.baseUrl}/api/analyze-vehicle-details`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Vehicle analysis failed: ${response.status}`);
    }

    return response.json();
  }

  async compareVehicleDetails(aiAnalysis: any, rtaData: any): Promise<StepResponse> {
    const response = await fetch(`${this.baseUrl}/api/compare-vehicle-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aiAnalysis, rtaData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Vehicle comparison failed: ${response.status}`);
    }

    return response.json();
  }

  async reAnalyzeWithCorrectedPlate(imageFile: File, correctedPlateNumber: string): Promise<StepAnalysisResponse> {
    console.log('🔄 Re-analyzing with corrected license plate:', correctedPlateNumber);

    try {
      // Use the new focused re-analysis endpoint
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('corrected_license_plate', correctedPlateNumber.trim().toUpperCase());

      console.log('📡 Calling focused re-analysis endpoint...');
      const response = await fetch(`${this.baseUrl}/api/reanalyze-with-corrected-plate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Re-analysis failed: ${response.status}`);
      }

      const stepAnalysisResponse = await response.json();
      console.log('✅ Focused re-analysis completed successfully');
      console.log('📋 Response success:', stepAnalysisResponse.success);
      console.log('📋 Corrected plate:', correctedPlateNumber);
      
      return stepAnalysisResponse;

    } catch (error) {
      console.error('Failed to re-analyze with corrected plate:', error);
      throw new Error(`Re-analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async detectViolations(imageFile: File, qualityCategory?: string, vehicleAnalysis?: any): Promise<StepResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (qualityCategory) {
      formData.append('quality_category', qualityCategory);
    }
    if (vehicleAnalysis) {
      formData.append('vehicle_analysis', JSON.stringify(vehicleAnalysis));
    }

    const response = await fetch(`${this.baseUrl}/api/detect-violations`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Violation detection failed: ${response.status}`);
    }

    return response.json();
  }

  // Legacy method for backward compatibility
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

  // Get vehicle details from TSeChallan (legacy method)
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

  // Violations API methods
  async getViolations() {
    const response = await fetch(`${BACKEND_URL}/api/violations`);
    return response.json();
  }

  async getViolationsByVehicleType(vehicleType: string) {
    const response = await fetch(`${BACKEND_URL}/api/violations/vehicle/${encodeURIComponent(vehicleType)}`);
    return response.json();
  }

  async calculateFine(violationNames: string[], vehicleType: string) {
    const response = await fetch(`${BACKEND_URL}/api/violations/calculate-fine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        violationNames,
        vehicleType,
      }),
    });
    return response.json();
  }
}

export const apiService = new ApiService(); 