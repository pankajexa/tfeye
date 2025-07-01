import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GeminiAnalysisResponse } from '../services/api';

// Enhanced Challan interface that includes Gemini analysis
export interface Challan {
  id: string;
  originalFile: File;
  preview: string;
  status: 'processing' | 'pending-review' | 'approved' | 'rejected';
  timestamp: string;
  
  // Gemini Analysis Results
  geminiAnalysis?: GeminiAnalysisResponse;
  
  // Review Data
  plateNumber?: string;
  violations: string[];
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
  
  // RTA Verification
  rtaVerification?: {
    status: string;
    matches: boolean;
    overallScore: number;
    registrationNumber: string;
  };
  
  // Review Decision
  reviewedBy?: string;
  reviewTimestamp?: string;
  rejectionReason?: string;
  
  // Officer Information (for future implementation)
  sectorOfficer?: {
    psName: string;
    cadre: string;
    name: string;
  };
  capturedBy?: {
    psName: string;
    cadre: string;
    name: string;
  };
  jurisdiction?: {
    psName: string;
    pointName: string;
  };
  offenceDateTime?: {
    date: string;
    time: string;
  };
}

interface ChallanContextType {
  challans: Challan[];
  addChallan: (file: File) => string; // returns challan ID
  updateChallanStatus: (id: string, status: Challan['status']) => void;
  updateChallanWithAnalysis: (id: string, analysis: GeminiAnalysisResponse) => void;
  approveChallan: (id: string, reviewedBy: string) => void;
  rejectChallan: (id: string, reason: string, reviewedBy: string) => void;
  modifyChallan: (id: string, updates: Partial<Challan>) => void;
  getChallansByStatus: (status: Challan['status']) => Challan[];
}

const ChallanContext = createContext<ChallanContextType | undefined>(undefined);

export const useChallanContext = () => {
  const context = useContext(ChallanContext);
  if (!context) {
    throw new Error('useChallanContext must be used within a ChallanProvider');
  }
  return context;
};

interface ChallanProviderProps {
  children: ReactNode;
}

export const ChallanProvider: React.FC<ChallanProviderProps> = ({ children }) => {
  const [challans, setChallans] = useState<Challan[]>([]);

  const addChallan = (file: File): string => {
    const id = `CH${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChallan: Challan = {
      id,
      originalFile: file,
      preview: URL.createObjectURL(file),
      status: 'processing',
      timestamp: new Date().toISOString(),
      violations: [],
    };

    setChallans(prev => [...prev, newChallan]);
    return id;
  };

  const updateChallanStatus = (id: string, status: Challan['status']) => {
    setChallans(prev => prev.map(challan => 
      challan.id === id ? { ...challan, status } : challan
    ));
  };

  const updateChallanWithAnalysis = (id: string, analysis: GeminiAnalysisResponse) => {
    setChallans(prev => prev.map(challan => {
      if (challan.id === id) {
        const violations = analysis.gemini_analysis.violations.map(v => v.type);
        
        return {
          ...challan,
          status: violations.length > 0 ? 'pending-review' : 'approved' as Challan['status'],
          geminiAnalysis: analysis,
          plateNumber: analysis.gemini_analysis.vehicle_details.number_plate.text,
          violations,
          vehicleDetails: {
            make: analysis.gemini_analysis.vehicle_details.make,
            model: analysis.gemini_analysis.vehicle_details.model,
            color: analysis.gemini_analysis.vehicle_details.color,
            vehicleType: analysis.gemini_analysis.vehicle_details.vehicle_type,
            confidence: {
              make: parseFloat(analysis.gemini_analysis.vehicle_details.confidence_scores.make.score.replace('%', '')),
              model: parseFloat(analysis.gemini_analysis.vehicle_details.confidence_scores.model.score.replace('%', '')),
              color: parseFloat(analysis.gemini_analysis.vehicle_details.confidence_scores.color.score.replace('%', ''))
            }
          },
          rtaVerification: analysis.rta_verification ? {
            status: analysis.rta_verification.status,
            matches: analysis.rta_verification.matches,
            overallScore: analysis.rta_verification.overall_score,
            registrationNumber: analysis.rta_verification.registration_number
          } : undefined
        };
      }
      return challan;
    }));
  };

  const approveChallan = (id: string, reviewedBy: string) => {
    setChallans(prev => prev.map(challan => 
      challan.id === id ? { 
        ...challan, 
        status: 'approved',
        reviewedBy,
        reviewTimestamp: new Date().toISOString()
      } : challan
    ));
  };

  const rejectChallan = (id: string, reason: string, reviewedBy: string) => {
    setChallans(prev => prev.map(challan => 
      challan.id === id ? { 
        ...challan, 
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy,
        reviewTimestamp: new Date().toISOString()
      } : challan
    ));
  };

  const modifyChallan = (id: string, updates: Partial<Challan>) => {
    setChallans(prev => prev.map(challan => 
      challan.id === id ? { ...challan, ...updates } : challan
    ));
  };

  const getChallansByStatus = (status: Challan['status']) => {
    return challans.filter(challan => challan.status === status);
  };

  const value: ChallanContextType = {
    challans,
    addChallan,
    updateChallanStatus,
    updateChallanWithAnalysis,
    approveChallan,
    rejectChallan,
    modifyChallan,
    getChallansByStatus
  };

  return (
    <ChallanContext.Provider value={value}>
      {children}
    </ChallanContext.Provider>
  );
}; 