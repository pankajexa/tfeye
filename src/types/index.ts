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
  // Enhanced fields for real RTA integration
  rtaData?: RTAData;
  rtaApiStatus?: 'pending' | 'success' | 'failed';
  rtaApiError?: string;
}

export type TabType = 'processing' | 'pending-review' | 'approved' | 'rejected';
export type RejectedSubTab = 'system-rejected' | 'operator-rejected' | 'rta-mismatch';