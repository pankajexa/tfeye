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

export interface RTAData {
  make: string;
  model: string;
  color: string;
}

export interface AIDetected {
  make: string;
  model: string;
  color: string;
}

export interface VehicleMatch {
  field: string;
  rtaData: string;
  aiDetected: string;
  match: boolean;
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
}

export type TabType = 'processing' | 'pending-review' | 'approved' | 'rejected';
export type RejectedSubTab = 'system-rejected' | 'operator-rejected' | 'rta-mismatch';