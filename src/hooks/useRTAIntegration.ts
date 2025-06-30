import { useState, useCallback } from 'react';
import { RTAService } from '../services/rtaService';
import { Challan, RTAData, VehicleMatch, AIDetected } from '../types';

interface RTAIntegrationState {
  isLoading: boolean;
  error: string | null;
  rtaData: RTAData | null;
}

interface UseRTAIntegrationReturn {
  state: RTAIntegrationState;
  fetchRTAData: (plateNumber: string, aiDetected: AIDetected) => Promise<Challan | null>;
  clearState: () => void;
}

export const useRTAIntegration = (): UseRTAIntegrationReturn => {
  const [state, setState] = useState<RTAIntegrationState>({
    isLoading: false,
    error: null,
    rtaData: null
  });

  const fetchRTAData = useCallback(async (
    plateNumber: string,
    aiDetected: AIDetected
  ): Promise<Challan | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch RTA data - service automatically handles mock vs real API
      const rtaResponse = await RTAService.fetchVehicleDetails(plateNumber);

      if (rtaResponse.success && rtaResponse.data) {
        const rtaData = rtaResponse.data;
        
        // Compare RTA data with AI detected data
        const vehicleMatches = RTAService.compareVehicleDetails(rtaData, aiDetected);
        const rtaMatched = RTAService.calculateOverallMatch(vehicleMatches);

        setState({
          isLoading: false,
          error: null,
          rtaData
        });

        // Return updated challan data structure
        const updatedChallan: Partial<Challan> = {
          plateNumber,
          vehicleMatches,
          rtaMatched,
          rtaData,
          rtaApiStatus: 'success',
          ownerAddress: rtaData.ownerAddress
        };

        return updatedChallan as Challan;

      } else {
        const errorMessage = rtaResponse.error || 'Failed to fetch RTA data';
        setState({
          isLoading: false,
          error: errorMessage,
          rtaData: null
        });

        // Return challan with error status
        const errorChallan: Partial<Challan> = {
          plateNumber,
          vehicleMatches: [],
          rtaMatched: false,
          rtaApiStatus: 'failed',
          rtaApiError: errorMessage,
          ownerAddress: ''
        };

        return errorChallan as Challan;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown RTA error';
      
      setState({
        isLoading: false,
        error: errorMessage,
        rtaData: null
      });

      return null;
    }
  }, []);

  const clearState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      rtaData: null
    });
  }, []);

  return {
    state,
    fetchRTAData,
    clearState
  };
};

// Helper function to simulate AI-detected vehicle data (for testing)
export const simulateAIDetection = (plateNumber: string): AIDetected => {
  // This would normally come from your AI service
  const mockAIData: { [key: string]: AIDetected } = {
    'TS09AB1234': {
      make: 'MARUTI',
      model: 'ALTO', // Intentional mismatch for testing
      color: 'SILVER', // Intentional mismatch for testing
      vehicleType: 'CAR',
      confidence: 0.85
    },
    'TS07CD5678': {
      make: 'HONDA',
      model: 'ACTIVA',
      color: 'BLUE',
      vehicleType: 'SCOOTER',
      confidence: 0.92
    }
  };

  return mockAIData[plateNumber.toUpperCase()] || {
    make: 'UNKNOWN',
    model: 'UNKNOWN',
    color: 'UNKNOWN',
    vehicleType: 'UNKNOWN',
    confidence: 0.0
  };
}; 