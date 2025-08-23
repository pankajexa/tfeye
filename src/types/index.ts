export interface Officer {
  psName: string;
  cadre: string;
  name: string;
}

export interface Vehicle {
  make: string;
  model: string;
  color: string;
  plateNumber: string;
}

// Enhanced RTA Data structure for real API integration
export interface RTAData {
  registrationNumber: string;
  ownerName: string;
  ownerAddress: string;
  vehicleClass: string;
  vehicleCategory?: string;
  make: string;
  model: string;
  color: string;
  fuelType: string;
  engineNumber: string;
  chassisNumber: string;
  registrationDate: string;
  fitnessValidUpto?: string;
  insuranceValidUpto?: string;
  rcStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  state: string;
  rto: string;
  // Additional fields for the new structure
  series?: string;
  vehicleNumber?: string;
  makerName?: string;
  makerModel?: string;
}

// RTA API Response structure
export interface RTAResponse {
  success: boolean;
  data?: RTAData;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'INVALID_FORMAT' | 'API_ERROR' | 'UNAUTHORIZED';
}

export interface AIDetected {
  make: string;
  model: string;
  color: string;
  vehicleType?: string;
  confidence?: number;
}

export interface VehicleMatch {
  field: string;
  rtaData: string;
  aiDetected: string;
  match: boolean;
  confidence?: number;
}

// NEW: Enhanced Quality Assessment Types
export interface QualityAssessmentData {
  status: 'QUALIFIED' | 'REJECTED';
  reason: string;
  quality_score: number;
  visible_vehicles: boolean;
  license_plates_visible: boolean;
  image_clarity: 'excellent' | 'good' | 'fair' | 'poor';
  suitable_for_analysis: boolean;
  timestamp_extraction?: TimestampExtractionData;
}

// NEW: Timestamp Extraction Data structure
export interface TimestampExtractionData {
  timestamp_found: boolean;
  extracted_date?: string | null;
  extracted_time?: string | null;
  timestamp_location?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'not_found';
  timestamp_confidence?: number;
  raw_timestamp_text?: string;
  extraction_notes?: string;
}

// NEW: Enhanced OCR Types
export interface OCRData {
  license_plate: string | null;
  confidence: number;
  extraction_method: string;
  telangana_format_validated: boolean;
  format_valid: boolean;
  extraction_possible: boolean;
  source?: string;
}

// NEW: Step Analysis Response Types
export interface StepResponse {
  success: boolean;
  step: number;
  step_name: string;
  data?: any;
  error?: string;
  errorCode?: string;
}

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

// Step 6 Violation Detection Types
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

// Step 5 Vehicle Comparison Types
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

// Step 4 Vehicle Analysis Types
export interface VehicleAnalysis {
  vehicle_type: string;
  color: string;
  make: string | null;
  model: string | null;
  occupant_count: number;
  vehicle_condition: string;
  distinctive_features: string[];
  visibility_assessment: {
    color_clarity: string;
    make_model_clarity: string;
    overall_visibility: string;
  };
  analysis_confidence: number;
  reasoning: string;
}

// Workflow Summary Types (Legacy - for backward compatibility)
export interface WorkflowSummary {
  quality_category: string;
  suitable_for_analysis: boolean;
  license_plate_extracted: boolean;
  license_plate: string | null;
  rta_data_found: boolean;
  rta_data: RTAData | null;
  vehicle_analysis_completed: boolean;
  vehicle_analysis: VehicleAnalysis | null;
  comparison_completed: boolean;
  comparison_result: VehicleComparison | null;
  violation_detection_completed: boolean;
  violation_analysis: ViolationAnalysis | null;
  violations_found: number;
  violation_types: string[];
  next_step_recommendation: {
    action: string;
    reason: string;
    next_step: string | null;
    comparison_verdict?: string;
    verification_recommendation?: string;
  };
}

export interface Challan {
  id: string;
  image: string;
  timestamp: string;
  plateNumber?: string;
  status: 'processing' | 'pending-review' | 'approved' | 'rejected';
  rejectionReason?: string;
  sectorOfficer: Officer;
  capturedBy: Officer;
  jurisdiction: {
    psName: string;
    pointName: string;
  };
  offenceDateTime: {
    date: string;
    time: string;
  };
  vehicleMatches: VehicleMatch[];
  violations: string[];
  driverGender: string;
  fakePlate: boolean;
  ownerAddress: string;
  rtaMatched: boolean;
  
  // Enhanced fields for Step 6 implementation
  rtaData?: RTAData;
  rtaApiStatus?: 'pending' | 'success' | 'failed';
  rtaApiError?: string;
  
  // NEW: Step Analysis Workflow Data
  stepAnalysisResponse?: StepAnalysisResponse;
  qualityAssessment?: QualityAssessmentData;
  ocrData?: OCRData;
  
  // Step 6 Workflow Data (Legacy - for backward compatibility)
  workflowSummary?: WorkflowSummary;
  violationAnalysis?: ViolationAnalysis;
  vehicleComparison?: VehicleComparison;
  vehicleAnalysisData?: VehicleAnalysis;
  qualityCategory?: string;
  
  // Legacy support
  vehicleDetails?: {
    make: string;
    model: string;
    color: string;
    vehicleType: string;
    confidence: {
      make: number;
      model: number;
      color: number;
    };
  };
  rtaVerification?: {
    status: string;
    matches: boolean;
    overallScore: number;
    registrationNumber: string;
  };
  geminiAnalysis?: any; // Legacy Gemini response
  preview?: string; // Image preview URL
  originalFile?: File; // Original file reference
  reviewedBy?: string;
  reviewTimestamp?: string;
}

export type TabType = 'processing' | 'pending-review' | 'approved' | 'rejected';
export type RejectedSubTab = 'system-rejected' | 'operator-rejected' | 'rta-mismatch';