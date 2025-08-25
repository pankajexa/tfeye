import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WorkflowResponse } from '../services/api';
import { ViolationAnalysis, VehicleComparison, VehicleAnalysis, WorkflowSummary, RTAData, StepAnalysisResponse, QualityAssessmentData, OCRData } from '../types';
import { useAuth } from './AuthContext';

// Enhanced Challan interface that includes Step 6 workflow data
export interface Challan {
  id: string;
  originalFile: File;
  preview: string;
  image: string;
  status: 'processing' | 'pending-review' | 'approved' | 'rejected' | 'violation-not-tagged';
  timestamp: string;
  plateNumber?: string;
  violations: string[];
  sectorOfficer: {
    psName: string;
    cadre: string;
    name: string;
  };
  capturedBy: {
    psName: string;
    cadre: string;
    name: string;
  };
  jurisdiction: {
    psName: string;
    pointName: string;
  };
  offenceDateTime: {
    date: string;
    time: string;
  };
  vehicleMatches: Array<{
    field: string;
    rtaData: string;
    aiDetected: string;
    match: boolean;
    confidence?: number;
  }>;
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
  reviewedBy?: string;
  reviewTimestamp?: string;
  rejectionReason?: string;
}

interface ChallanContextType {
  challans: Challan[];
  addChallan: (file: File) => string; // returns challan ID
  updateChallanStatus: (id: string, status: Challan['status']) => void;
  updateChallanWithStepAnalysis: (id: string, stepAnalysisResponse: StepAnalysisResponse) => void; // NEW
  updateChallanWithWorkflow: (id: string, workflowResponse: WorkflowResponse) => void; // Legacy
  updateChallanWithAnalysis: (id: string, analysis: any) => void; // Legacy support
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
  const { currentOfficer } = useAuth();

  const addChallan = (file: File): string => {
    const id = `CH${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use current officer info if available, fallback to defaults
    const officerInfo = currentOfficer || {
      name: 'Unknown Officer',
      cadre: 'Officer',
      psName: 'Traffic PS'
    };
    
    const newChallan: Challan = {
      id,
      originalFile: file,
      preview: URL.createObjectURL(file),
      image: URL.createObjectURL(file),
      status: 'processing',
      timestamp: new Date().toISOString(),
      violations: [],
      plateNumber: undefined,
      sectorOfficer: {
        psName: 'Jubilee Hills Traffic PS',
        cadre: 'Police Constable',
        name: 'Unknown'
      },
      capturedBy: {
        psName: 'Jubilee Hills Traffic PS',
        cadre: 'Police Constable',
        name: 'Unknown'
      },
      jurisdiction: {
        psName: 'Jubilee Hills Traffic PS',
        pointName: 'Unknown'
      },
      offenceDateTime: {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      },
      vehicleMatches: [],
      driverGender: 'Unknown',
      fakePlate: false,
      ownerAddress: 'Unknown',
      rtaMatched: false
    };

    setChallans(prev => [...prev, newChallan]);
    return id;
  };

  const updateChallanStatus = (id: string, status: Challan['status']) => {
    setChallans(prev => prev.map(challan => 
      challan.id === id ? { ...challan, status } : challan
    ));
  };

  const updateChallanWithStepAnalysis = (id: string, stepAnalysisResponse: StepAnalysisResponse) => {
    setChallans(prev => prev.map(challan => {
      if (challan.id === id) {
        // Extract data from the new step analysis structure
        const step1Data = stepAnalysisResponse.results.step1?.data;
        const step2Data = stepAnalysisResponse.results.step2?.data;
        const step3Data = stepAnalysisResponse.results.step3?.data;
        const step4Data = stepAnalysisResponse.results.step4?.data;
        const step5Data = stepAnalysisResponse.results.step5?.data;
        const step6Data = stepAnalysisResponse.results.step6?.data;

        // Extract violations from Step 6 data
        const violationAnalysis = step6Data?.violation_analysis;
        const violations = violationAnalysis?.violation_types_found || [];
        const detectedViolationCount = violationAnalysis?.detected_violation_count || 0;

        // Determine status based on violation detection
        // Check multiple sources for violation detection
        const step2ViolationStatus = step2Data?.status;
        const step2ViolationCount = step2Data?.violations_detected?.length || 0;
        const step6ViolationCount = detectedViolationCount;
        
        let newStatus: Challan['status'];
        
        // If no violations are detected by AI system, mark as violation-not-tagged
        if ((step2ViolationStatus === 'NO_VIOLATION' || step2ViolationCount === 0) && 
            step6ViolationCount === 0 && 
            violations.length === 0) {
          newStatus = 'violation-not-tagged';
          console.log('🚫 No violations detected by AI - setting status to violation-not-tagged');
        } else {
          // Violations detected - send to pending review
          newStatus = 'pending-review';
          console.log('⚠️ Violations detected - sending to pending review');
        }

        // Extract vehicle comparison from Step 5
        const vehicleComparison = step5Data?.comparison_result;
        
        // Create vehicle matches from Step 5 comparison data
        const vehicleMatches = vehicleComparison ? 
          Object.entries(vehicleComparison.parameter_analysis).map(([field, analysis]: [string, any]) => ({
            field: field.charAt(0).toUpperCase() + field.slice(1),
            rtaData: analysis.rta_value || 'Not Available',
            aiDetected: analysis.ai_value || 'Not Detected',
            match: analysis.match_status === 'MATCH',
            confidence: vehicleComparison.confidence_score
          })) : [];

        // Extract license plate from multiple sources
        const extractedPlate = step1Data?.extracted_license_plate || 
                              step2Data?.license_plate || 
                              step3Data?.license_plate ||
                              step6Data?.license_plate;

        // ENHANCED: Extract timestamp from Step 1 analysis if available
        let offenceDateTime = challan.offenceDateTime; // Keep original as fallback
        
        if (step1Data?.timestamp_extraction?.timestamp_found) {
          const timestampData = step1Data.timestamp_extraction;
          console.log('🕐 TIMESTAMP EXTRACTION: Found embedded timestamp in image');
          console.log('  📅 Extracted Date:', timestampData.extracted_date);
          console.log('  🕒 Extracted Time:', timestampData.extracted_time);
          console.log('  📍 Location:', timestampData.timestamp_location);
          console.log('  🎯 Confidence:', timestampData.timestamp_confidence);
          
          if (timestampData.extracted_date && timestampData.extracted_time) {
            // Use extracted timestamp
            offenceDateTime = {
              date: timestampData.extracted_date,
              time: timestampData.extracted_time
            };
            console.log('✅ Using extracted timestamp for offence date/time');
          } else if (timestampData.extracted_date) {
            // Use extracted date with current time
            offenceDateTime = {
              date: timestampData.extracted_date,
              time: new Date().toLocaleTimeString()
            };
            console.log('✅ Using extracted date with current time');
          } else {
            console.log('⚠️ Partial timestamp data - keeping original');
          }
        } else {
          console.log('ℹ️ No embedded timestamp found - using original upload time');
        }

        const updatedChallan = {
          ...challan,
          status: newStatus,
          stepAnalysisResponse,
          qualityAssessment: step1Data,
          ocrData: step2Data,
          plateNumber: extractedPlate || undefined,
          violations,
          violationAnalysis,
          vehicleComparison,
          vehicleAnalysisData: step4Data?.vehicle_analysis,
          qualityCategory: step1Data?.quality_category,
          rtaData: step3Data?.rta_data,
          vehicleMatches,
          rtaMatched: vehicleComparison?.overall_verdict === 'MATCH',
          offenceDateTime, // Use extracted or fallback timestamp
          
          // Legacy compatibility
          vehicleDetails: step4Data?.vehicle_analysis ? {
            make: step4Data.vehicle_analysis.make || 'Unknown',
            model: step4Data.vehicle_analysis.model || 'Unknown',
            color: step4Data.vehicle_analysis.color || 'Unknown',
            vehicleType: step4Data.vehicle_analysis.vehicle_type || 'Unknown',
            confidence: {
              make: step4Data.vehicle_analysis.analysis_confidence || 0,
              model: step4Data.vehicle_analysis.analysis_confidence || 0,
              color: step4Data.vehicle_analysis.analysis_confidence || 0
            }
          } : undefined,
          rtaVerification: vehicleComparison ? {
            status: vehicleComparison.overall_verdict,
            matches: vehicleComparison.overall_verdict === 'MATCH',
            overallScore: vehicleComparison.confidence_score,
            registrationNumber: extractedPlate || 'Unknown'
          } : undefined
        };

        return updatedChallan;
      }
      return challan;
    }));
  };

  const updateChallanWithWorkflow = (id: string, workflowResponse: WorkflowResponse) => {
    setChallans(prev => prev.map(challan => {
      if (challan.id === id) {
        const summary = workflowResponse.summary;
        if (!summary) {
          return { ...challan, status: 'rejected' as Challan['status'] };
        }

        // Extract violations from Step 6 data
        const violations = summary.violation_types || [];
        const detectedViolationCount = summary.violations_found || 0;

        // Determine status based on violation detection (legacy workflow)
        let newStatus: Challan['status'];
        
        // If no violations are detected, mark as violation-not-tagged
        if (detectedViolationCount === 0 && violations.length === 0) {
          newStatus = 'violation-not-tagged';
          console.log('🚫 Legacy workflow: No violations detected - setting status to violation-not-tagged');
        } else {
          newStatus = 'pending-review';
          console.log('⚠️ Legacy workflow: Violations detected - sending to pending review');
        }

        // Create vehicle matches from Step 5 comparison data
        const vehicleMatches = summary.comparison_result ? 
          Object.entries(summary.comparison_result.parameter_analysis).map(([field, analysis]: [string, any]) => ({
            field: field.charAt(0).toUpperCase() + field.slice(1),
            rtaData: analysis.rta_value || 'Not Available',
            aiDetected: analysis.ai_value || 'Not Detected',
            match: analysis.match_status === 'MATCH',
            confidence: summary.comparison_result?.confidence_score
          })) : [];

        return {
          ...challan,
          status: newStatus,
          plateNumber: summary.license_plate || undefined,
          violations,
          workflowSummary: summary,
          violationAnalysis: summary.violation_analysis,
          vehicleComparison: summary.comparison_result,
          vehicleAnalysisData: summary.vehicle_analysis,
          qualityCategory: summary.quality_category,
          rtaData: summary.rta_data,
          vehicleMatches,
          rtaMatched: summary.comparison_result?.overall_verdict === 'MATCH',
          
          // Legacy compatibility
          vehicleDetails: summary.vehicle_analysis ? {
            make: summary.vehicle_analysis.make || 'Unknown',
            model: summary.vehicle_analysis.model || 'Unknown',
            color: summary.vehicle_analysis.color || 'Unknown',
            vehicleType: summary.vehicle_analysis.vehicle_type || 'Unknown',
            confidence: {
              make: summary.vehicle_analysis.analysis_confidence || 0,
              model: summary.vehicle_analysis.analysis_confidence || 0,
              color: summary.vehicle_analysis.analysis_confidence || 0
            }
          } : undefined,
          rtaVerification: summary.comparison_result ? {
            status: summary.comparison_result.overall_verdict,
            matches: summary.comparison_result.overall_verdict === 'MATCH',
            overallScore: summary.comparison_result.confidence_score,
            registrationNumber: summary.license_plate || 'Unknown'
          } : undefined
        };
      }
      return challan;
    }));
  };

  // Legacy method for backward compatibility
  const updateChallanWithAnalysis = (id: string, analysis: any) => {
    setChallans(prev => prev.map(challan => {
      if (challan.id === id) {
        const violations = analysis.gemini_analysis?.violations?.map((v: any) => v.type) || [];
        
        return {
          ...challan,
          // ALL successfully analyzed images go to pending-review
          // No auto-approval - everything requires manual review
          status: 'pending-review' as Challan['status'],
          geminiAnalysis: analysis,
          plateNumber: analysis.gemini_analysis?.vehicle_details?.number_plate?.text,
          violations,
          vehicleDetails: analysis.gemini_analysis?.vehicle_details ? {
            make: analysis.gemini_analysis.vehicle_details.make,
            model: analysis.gemini_analysis.vehicle_details.model,
            color: analysis.gemini_analysis.vehicle_details.color,
            vehicleType: analysis.gemini_analysis.vehicle_details.vehicle_type,
            confidence: {
              make: parseFloat(analysis.gemini_analysis.vehicle_details.confidence_scores?.make?.score?.replace('%', '') || '0'),
              model: parseFloat(analysis.gemini_analysis.vehicle_details.confidence_scores?.model?.score?.replace('%', '') || '0'),
              color: parseFloat(analysis.gemini_analysis.vehicle_details.confidence_scores?.color?.score?.replace('%', '') || '0')
            }
          } : undefined,
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
    updateChallanWithStepAnalysis,
    updateChallanWithWorkflow,
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