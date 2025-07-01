import { RTAResponse, RTAData, VehicleMatch, AIDetected } from '../types';

// Backend API Configuration
const BACKEND_API_CONFIG = {
  baseUrl: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001',
  timeout: 20000, // 20 seconds for backend calls
};

// Original TSeChallan config (kept for reference)
const TSECHALLAN_CONFIG = {
  baseUrl: import.meta.env.VITE_RTA_API_URL || 'https://echallan.tspolice.gov.in/TSeChallanRS',
  vendorCode: import.meta.env.VITE_RTA_VENDOR_CODE || '',
  vendorKey: import.meta.env.VITE_RTA_VENDOR_KEY || '',
  timeout: 15000,
};

// Token management
let authToken: string | null = null;
let tokenExpiryTime: number = 0;

export class RTAService {
  /**
   * Check if we should use mock data, backend API, or direct TSeChallan calls
   */
  private static getApiMode(): 'mock' | 'backend' | 'direct' {
    const hasBackendUrl = !!import.meta.env.VITE_BACKEND_API_URL;
    const hasCredentials = TSECHALLAN_CONFIG.vendorCode && TSECHALLAN_CONFIG.vendorKey;
    const isDevelopment = import.meta.env.DEV;
    
    // Priority: Backend API > Direct (if credentials) > Mock
    if (hasBackendUrl) {
      return 'backend';
    } else if (hasCredentials) {
      return 'direct';
    } else if (isDevelopment) {
      return 'mock';
    } else {
      return 'mock';
    }
  }

  /**
   * Fetch vehicle details using appropriate method based on configuration
   */
  static async fetchVehicleDetails(registrationNumber: string): Promise<RTAResponse> {
    const mode = this.getApiMode();
    
    console.log(`🎯 API Mode: ${mode}`);
    
    switch (mode) {
      case 'backend':
        return this.fetchViaBackend(registrationNumber);
      case 'direct':
        return this.fetchViaDirect(registrationNumber);
      case 'mock':
      default:
        console.log('🟡 Using mock data - configure VITE_BACKEND_API_URL for real API');
        return this.fetchMockVehicleDetails(registrationNumber);
    }
  }

  /**
   * Fetch vehicle details via backend API (recommended for production)
   */
  private static async fetchViaBackend(registrationNumber: string): Promise<RTAResponse> {
    console.log('🟢 Using backend API for vehicle lookup:', registrationNumber);
    console.log('📡 Backend Endpoint:', BACKEND_API_CONFIG.baseUrl);

    try {
      // Basic validation - just ensure it's reasonable input
      if (!this.validateRegistrationNumber(registrationNumber)) {
        return {
          success: false,
          error: 'Registration number must be between 3 and 20 characters',
          errorCode: 'INVALID_FORMAT'
        };
      }

      console.log('📋 Making backend API request...');
      const response = await fetch(`${BACKEND_API_CONFIG.baseUrl}/api/vehicle-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationNumber: registrationNumber.toUpperCase()
        }),
        signal: AbortSignal.timeout(BACKEND_API_CONFIG.timeout)
      });

      console.log('📥 Backend response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Backend response data:', JSON.stringify(data, null, 2));

      if (data.success && data.data) {
        console.log('✅ Vehicle data retrieved via backend');
        return {
          success: true,
          data: data.data
        };
      } else {
        console.log('❌ Backend API error:', data.error);
        return {
          success: false,
          error: data.error || 'Vehicle not found',
          errorCode: data.errorCode || 'NOT_FOUND'
        };
      }

    } catch (error) {
      console.error('💥 Backend API Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Backend API request timeout',
            errorCode: 'API_ERROR'
          };
        }
        
        return {
          success: false,
          error: error.message,
          errorCode: 'API_ERROR'
        };
      }
      
      return {
        success: false,
        error: 'Unknown error occurred',
        errorCode: 'API_ERROR'
      };
    }
  }

  /**
   * Test backend connectivity
   */
  static async testBackendConnection(): Promise<{success: boolean, message: string, data?: any}> {
    try {
      console.log('🧪 Testing backend connection...');
      
      // Test health endpoint
      const healthResponse = await fetch(`${BACKEND_API_CONFIG.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!healthResponse.ok) {
        return {
          success: false,
          message: `Backend health check failed: ${healthResponse.status}`
        };
      }

      const healthData = await healthResponse.json();
      
      // Test credentials endpoint
      const credentialsResponse = await fetch(`${BACKEND_API_CONFIG.baseUrl}/api/test-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      const credentialsData = await credentialsResponse.json();

      return {
        success: credentialsResponse.ok && credentialsData.success,
        message: credentialsResponse.ok && credentialsData.success 
          ? 'Backend and TSeChallan credentials working correctly!'
          : credentialsData.error || 'Backend connection failed',
        data: {
          health: healthData,
          credentials: credentialsData
        }
      };

    } catch (error) {
      console.error('💥 Backend test error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Backend connection test failed'
      };
    }
  }

  /**
   * Fetch vehicle details via direct TSeChallan API (fallback - requires IP whitelisting)
   */
  private static async fetchViaDirect(registrationNumber: string): Promise<RTAResponse> {
    console.log('🟡 Using direct TSeChallan API (may fail due to IP restrictions)');
    console.log('📡 TSeChallan Endpoint:', TSECHALLAN_CONFIG.baseUrl);
    console.log('🔑 Vendor Code:', TSECHALLAN_CONFIG.vendorCode);

    try {
      // This will likely fail from localhost due to IP whitelisting
      // Keeping the original implementation for reference
      
      // Basic validation - just ensure it's reasonable input
      if (!this.validateRegistrationNumber(registrationNumber)) {
        return {
          success: false,
          error: 'Registration number must be between 3 and 20 characters',
          errorCode: 'INVALID_FORMAT'
        };
      }

      // Get authentication token
      console.log('🔐 Fetching authentication token...');
      const token = await this.getAuthToken();
      console.log('✅ Authentication successful, token obtained');

      console.log('📋 Making vehicle details request...');
      const requestBody = {
        vendorCode: TSECHALLAN_CONFIG.vendorCode,
        userID: "TG1",
        idCode: "1",
        idDetails: registrationNumber.toUpperCase()
      };
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${TSECHALLAN_CONFIG.baseUrl}/IDDetails/getIDInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(TSECHALLAN_CONFIG.timeout)
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`TSeChallan API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Response data:', JSON.stringify(data, null, 2));
      
      if (data.responseCode === "0" && data.responseMsg === "Success." && data.data) {
        console.log('✅ Vehicle data found successfully');
        return {
          success: true,
          data: this.transformTSeChallanResponse(data.data)
        };
      } else if (data.responseCode !== "0") {
        console.log('❌ Vehicle not found or API error:', data.responseMsg);
        return {
          success: false,
          error: data.responseMsg || 'Vehicle not found in RTA database',
          errorCode: 'NOT_FOUND'
        };
      } else {
        console.log('❓ Unexpected response format:', data);
        return {
          success: false,
          error: data.responseMsg || 'Unknown TSeChallan API error',
          errorCode: 'API_ERROR'
        };
      }

    } catch (error) {
      console.error('💥 TSeChallan API Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'TSeChallan API request timeout',
            errorCode: 'API_ERROR'
          };
        }
        
        return {
          success: false,
          error: error.message,
          errorCode: 'API_ERROR'
        };
      }
      
      return {
        success: false,
        error: 'Unknown error occurred',
        errorCode: 'API_ERROR'
      };
    }
  }

  /**
   * Get authentication token from TSeChallan API (for direct calls only)
   */
  private static async getAuthToken(): Promise<string> {
    // Check if we have a valid token
    if (authToken && Date.now() < tokenExpiryTime) {
      console.log('🔄 Using cached authentication token');
      return authToken;
    }

    // Validate credentials are configured
    if (!TSECHALLAN_CONFIG.vendorCode || !TSECHALLAN_CONFIG.vendorKey) {
      throw new Error('TSeChallan credentials not configured. Please set VITE_RTA_VENDOR_CODE and VITE_RTA_VENDOR_KEY environment variables.');
    }

    console.log('🔐 Requesting new authentication token from TSeChallan...');
    console.log('📡 Auth endpoint:', `${TSECHALLAN_CONFIG.baseUrl}/IDDetails/getAuthorization`);

    try {
      const authBody = {
        vendorCode: TSECHALLAN_CONFIG.vendorCode,
        vendorKey: TSECHALLAN_CONFIG.vendorKey
      };
      console.log('📤 Auth request body:', JSON.stringify({ ...authBody, vendorKey: '***HIDDEN***' }, null, 2));

      const response = await fetch(`${TSECHALLAN_CONFIG.baseUrl}/IDDetails/getAuthorization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authBody),
        signal: AbortSignal.timeout(TSECHALLAN_CONFIG.timeout)
      });

      console.log('📥 Auth response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Auth response data:', JSON.stringify(data, null, 2));
      
      if (data.responseCode === "0" && data.responseDesc) {
        const token = data.responseDesc;
        authToken = token;
        // Token expires in 60 minutes, we'll refresh 5 minutes early
        tokenExpiryTime = Date.now() + (55 * 60 * 1000);
        console.log('✅ Authentication token obtained successfully');
        console.log('⏰ Token will expire at:', new Date(tokenExpiryTime).toLocaleString());
        return token;
      } else {
        console.log('❌ Authentication failed:', data.responseDesc);
        throw new Error(`Authentication failed: ${data.responseDesc || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('💥 TSeChallan Authentication Error:', error);
      throw error;
    }
  }

  /**
   * Compare RTA data with AI detected vehicle details
   */
  static compareVehicleDetails(rtaData: RTAData, aiDetected: AIDetected): VehicleMatch[] {
    const matches: VehicleMatch[] = [];

    // Compare Make
    matches.push({
      field: 'Make',
      rtaData: rtaData.make,
      aiDetected: aiDetected.make,
      match: this.fuzzyMatch(rtaData.make, aiDetected.make),
      confidence: aiDetected.confidence
    });

    // Compare Model
    matches.push({
      field: 'Model',
      rtaData: rtaData.model,
      aiDetected: aiDetected.model,
      match: this.fuzzyMatch(rtaData.model, aiDetected.model),
      confidence: aiDetected.confidence
    });

    // Compare Color
    matches.push({
      field: 'Color',
      rtaData: rtaData.color,
      aiDetected: aiDetected.color,
      match: this.fuzzyMatch(rtaData.color, aiDetected.color),
      confidence: aiDetected.confidence
    });

    return matches;
  }

  /**
   * Calculate overall RTA match status
   */
  static calculateOverallMatch(vehicleMatches: VehicleMatch[]): boolean {
    // At least 2 out of 3 fields should match for overall match
    const matchCount = vehicleMatches.filter(match => match.match).length;
    return matchCount >= 2;
  }

  /**
   * Validate vehicle registration number - minimal validation, let backend/API validate format
   */
  private static validateRegistrationNumber(regNumber: string): boolean {
    // Minimal validation - just ensure it's not empty and has reasonable content
    // Let TSeChallan API validate the actual format since registration formats vary widely
    const cleanRegNumber = regNumber.trim();
    return cleanRegNumber.length >= 3 && cleanRegNumber.length <= 20;
  }

  /**
   * Fuzzy string matching for vehicle details comparison
   */
  private static fuzzyMatch(str1: string, str2: string, threshold: number = 0.8): boolean {
    if (!str1 || !str2) return false;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Exact match
    if (s1 === s2) return true;
    
    // Calculate similarity using Levenshtein distance
    const similarity = this.calculateSimilarity(s1, s2);
    return similarity >= threshold;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  /**
   * Transform TSeChallan API response to internal format
   */
  private static transformTSeChallanResponse(apiResponse: any): RTAData {
    // Parse the TSeChallan response data structure
    // The actual structure will depend on the real API response format
    return {
      registrationNumber: apiResponse.registrationNumber || apiResponse.regNo || apiResponse.vehicleNumber,
      ownerName: apiResponse.ownerName || apiResponse.owner,
      ownerAddress: apiResponse.ownerAddress || apiResponse.address,
      vehicleClass: apiResponse.vehicleClass || apiResponse.class || apiResponse.vehicleType,
      make: apiResponse.make || apiResponse.manufacturer,
      model: apiResponse.model || apiResponse.modelName,
      color: apiResponse.color || apiResponse.colour,
      fuelType: apiResponse.fuelType || apiResponse.fuel,
      engineNumber: apiResponse.engineNumber || apiResponse.engineNo,
      chassisNumber: apiResponse.chassisNumber || apiResponse.chassisNo,
      registrationDate: apiResponse.registrationDate || apiResponse.regDate,
      fitnessValidUpto: apiResponse.fitnessValidUpto || apiResponse.fitnessUpto,
      insuranceValidUpto: apiResponse.insuranceValidUpto || apiResponse.insuranceUpto,
      rcStatus: this.mapRCStatus(apiResponse.rcStatus || apiResponse.status || 'ACTIVE'),
      state: apiResponse.state || 'TELANGANA',
      rto: apiResponse.rto || apiResponse.rtoCode || apiResponse.rtaOffice
    };
  }

  /**
   * Map RTA API RC status to internal format
   */
  private static mapRCStatus(status: string): 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' {
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'ACTIVE':
      case 'VALID':
        return 'ACTIVE';
      case 'SUSPENDED':
      case 'BLOCKED':
        return 'SUSPENDED';
      case 'CANCELLED':
      case 'INVALID':
        return 'CANCELLED';
      default:
        return 'ACTIVE'; // Default assumption
    }
  }

  /**
   * Generate unique request ID for RTA API calls
   */
  private static generateRequestId(): string {
    return `RTA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Mock RTA data for development/testing
   */
  static async fetchMockVehicleDetails(registrationNumber: string): Promise<RTAResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const mockData: { [key: string]: RTAData } = {
      'TS09AB1234': {
        registrationNumber: 'TS09AB1234',
        ownerName: 'Rajesh Kumar',
        ownerAddress: '456 Park Avenue, Hyderabad, Telangana - 500032',
        vehicleClass: 'LMV',
        make: 'MARUTI SUZUKI',
        model: 'SWIFT',
        color: 'WHITE',
        fuelType: 'PETROL',
        engineNumber: 'K12M1234567',
        chassisNumber: 'MA3ERLF1S00123456',
        registrationDate: '2020-03-15',
        fitnessValidUpto: '2025-03-14',
        insuranceValidUpto: '2024-08-20',
        rcStatus: 'ACTIVE',
        state: 'TELANGANA',
        rto: 'TS09'
      },
      'TS07CD5678': {
        registrationNumber: 'TS07CD5678',
        ownerName: 'Priya Sharma',
        ownerAddress: '123 Banjara Hills, Hyderabad, Telangana - 500034',
        vehicleClass: '2WN',
        make: 'HONDA',
        model: 'ACTIVA',
        color: 'BLUE',
        fuelType: 'PETROL',
        engineNumber: 'JF50E7890123',
        chassisNumber: 'ME4JF500ABC123456',
        registrationDate: '2019-07-22',
        fitnessValidUpto: '2024-07-21',
        insuranceValidUpto: '2024-12-15',
        rcStatus: 'ACTIVE',
        state: 'TELANGANA',
        rto: 'TS07'
      }
    };

    const data = mockData[registrationNumber.toUpperCase()];
    
    if (data) {
      return {
        success: true,
        data
      };
    } else {
      return {
        success: false,
        error: 'Vehicle not found in RTA database',
        errorCode: 'NOT_FOUND'
      };
    }
  }
} 