import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle, Loader2, Info, Zap } from 'lucide-react';
import { useRTAIntegration, simulateAIDetection } from '../hooks/useRTAIntegration';
import { RTAData, VehicleMatch } from '../types';

const RTATestComponent: React.FC = () => {
  const [plateNumber, setPlateNumber] = useState('');
  const [quickTestNumber, setQuickTestNumber] = useState('');
  const [quickTestLoading, setQuickTestLoading] = useState(false);
  const [quickTestResult, setQuickTestResult] = useState<{
    success: boolean;
    data?: any;
    error?: string;
    timestamp: string;
  } | null>(null);
  
  const [testResults, setTestResults] = useState<{
    rtaData: RTAData | null;
    vehicleMatches: VehicleMatch[];
    rtaMatched: boolean;
  } | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    mode: 'mock' | 'backend' | 'direct';
    apiUrl: string;
    hasCredentials: boolean;
    timestamp: string;
  } | null>(null);

  const { state, fetchRTAData, clearState } = useRTAIntegration();

  // Check environment configuration
  const apiUrl = import.meta.env.VITE_RTA_API_URL || 'Not configured';
  const vendorCode = import.meta.env.VITE_RTA_VENDOR_CODE || 'Not configured';
  const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'Not configured';
  const hasCredentials = !!(import.meta.env.VITE_RTA_VENDOR_CODE && import.meta.env.VITE_RTA_VENDOR_KEY);
  const hasBackendUrl = !!import.meta.env.VITE_BACKEND_API_URL;

  // Determine API mode
  const getApiMode = (): 'mock' | 'backend' | 'direct' => {
    if (hasBackendUrl) return 'backend';
    if (hasCredentials) return 'direct';
    return 'mock';
  };

  const apiMode = getApiMode();

  // Quick API test function - direct API call without AI comparison
  const handleQuickTest = async () => {
    if (!quickTestNumber.trim()) {
      alert('Please enter a vehicle number');
      return;
    }

    setQuickTestLoading(true);
    setQuickTestResult(null);

    try {
      // Import the service directly for raw API testing
      const { RTAService } = await import('../services/rtaService');
      
      console.log('🚀 Quick API Test - Vehicle lookup for:', quickTestNumber);
      const response = await RTAService.fetchVehicleDetails(quickTestNumber);
      
      setQuickTestResult({
        success: response.success,
        data: response.data,
        error: response.error,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setQuickTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setQuickTestLoading(false);
    }
  };

  // Test backend connectivity
  const handleBackendTest = async () => {
    if (apiMode !== 'backend') {
      alert('Backend API not configured. Set VITE_BACKEND_API_URL to test backend connectivity.');
      return;
    }

    setQuickTestLoading(true);
    setQuickTestResult(null);

    try {
      const { RTAService } = await import('../services/rtaService');
      
      console.log('🧪 Testing backend connectivity...');
      const result = await RTAService.testBackendConnection();
      
      setQuickTestResult({
        success: result.success,
        data: result.data,
        error: result.success ? undefined : result.message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setQuickTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Backend test failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setQuickTestLoading(false);
    }
  };

  const handleTestRTA = async () => {
    if (!plateNumber.trim()) {
      alert('Please enter a plate number');
      return;
    }

    // Set debug info
    setDebugInfo({
      mode: apiMode,
      apiUrl,
      hasCredentials,
      timestamp: new Date().toISOString()
    });

    // Simulate AI detection for the given plate number
    const aiDetected = simulateAIDetection(plateNumber);
    
    // Fetch RTA data and compare
    const result = await fetchRTAData(plateNumber, aiDetected);
    
    if (result) {
      setTestResults({
        rtaData: result.rtaData || null,
        vehicleMatches: result.vehicleMatches || [],
        rtaMatched: result.rtaMatched || false
      });
    }
  };

  const handleClear = () => {
    clearState();
    setTestResults(null);
    setPlateNumber('');
    setDebugInfo(null);
    setQuickTestResult(null);
    setQuickTestNumber('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Quick API Test Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
        <div className="flex items-center mb-4">
          <Zap className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-blue-900">Quick TSeChallan API Test</h2>
        </div>
        
        <p className="text-blue-700 mb-4">
          {apiMode === 'backend' 
            ? 'Test backend connectivity and TSeChallan integration via your whitelisted backend service.'
            : apiMode === 'direct'
            ? 'Direct TSeChallan API test - may fail due to IP whitelisting restrictions.'
            : 'Direct API test to verify your TSeChallan credentials and connection.'
          }
        </p>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={quickTestNumber}
              onChange={(e) => setQuickTestNumber(e.target.value.toUpperCase())}
              placeholder="Enter vehicle number (e.g., TS09AB1234)"
              className="flex-1 px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={quickTestLoading}
            />
            <button
              onClick={handleQuickTest}
              disabled={quickTestLoading}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
            >
              {quickTestLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Test Vehicle API
                </>
              )}
            </button>
          </div>
          
          {apiMode === 'backend' && (
            <button
              onClick={handleBackendTest}
              disabled={quickTestLoading}
              className="inline-flex items-center px-6 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {quickTestLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Test Backend Connectivity
                </>
              )}
            </button>
          )}
        </div>

        {/* Quick Test Results */}
        {quickTestResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            quickTestResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center mb-2">
              {quickTestResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              <h3 className={`font-medium ${
                quickTestResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {quickTestResult.success ? '✅ API Test Successful!' : '❌ API Test Failed'}
              </h3>
            </div>
            
            <div className={`text-sm ${
              quickTestResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              <p><strong>Timestamp:</strong> {new Date(quickTestResult.timestamp).toLocaleString()}</p>
              
              {quickTestResult.success && quickTestResult.data ? (
                <div className="mt-2">
                  <p><strong>Vehicle Found:</strong> {quickTestResult.data.registrationNumber}</p>
                  <p><strong>Owner:</strong> {quickTestResult.data.ownerName}</p>
                  <p><strong>Make/Model:</strong> {quickTestResult.data.make} {quickTestResult.data.model}</p>
                  <p><strong>Status:</strong> {quickTestResult.data.rcStatus}</p>
                </div>
              ) : (
                <p><strong>Error:</strong> {quickTestResult.error}</p>
              )}
            </div>

            {quickTestResult.success && (
              <div className="mt-3 text-xs text-green-600">
                🎉 TSeChallan credentials are working correctly! Check browser console for detailed API logs.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Configuration Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">TSeChallan API Integration Test</h2>
        
        <div className="mb-6">
          <div className={`p-4 rounded-lg border ${hasCredentials ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center mb-2">
              <Info className={`h-5 w-5 mr-2 ${hasCredentials ? 'text-green-600' : 'text-yellow-600'}`} />
              <h3 className={`font-medium ${hasCredentials ? 'text-green-800' : 'text-yellow-800'}`}>
                API Configuration Status
              </h3>
            </div>
            <div className="text-sm space-y-1">
              <div className={hasCredentials ? 'text-green-700' : 'text-yellow-700'}>
                <strong>Mode:</strong> {
                  apiMode === 'backend' ? '🟢 Backend API' :
                  apiMode === 'direct' ? '🟡 Direct TSeChallan API' : 
                  '🟡 Mock Data (Development)'
                }
              </div>
              <div className={hasCredentials ? 'text-green-700' : 'text-yellow-700'}>
                <strong>Endpoint:</strong> {apiMode === 'backend' ? backendUrl : apiUrl}
              </div>
              <div className={hasCredentials ? 'text-green-700' : 'text-yellow-700'}>
                <strong>Vendor Code:</strong> {vendorCode}
              </div>
              <div className={hasCredentials ? 'text-green-700' : 'text-yellow-700'}>
                <strong>Credentials:</strong> {hasCredentials ? '✅ Configured' : '❌ Missing'}
              </div>
              {apiMode === 'backend' && (
                <div className={hasBackendUrl ? 'text-green-700' : 'text-yellow-700'}>
                  <strong>Backend URL:</strong> {backendUrl}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          {apiMode === 'backend' 
            ? 'Using backend API proxy for TSeChallan integration. Backend handles authentication and IP whitelisting.'
            : apiMode === 'direct'
            ? 'Using direct TSeChallan API. Note: This may fail due to IP whitelisting restrictions.'
            : 'Testing with mock data. Configure VITE_BACKEND_API_URL or credentials for real API testing.'
          }
        </p>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Registration Number (Full Integration Test)
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                id="plateNumber"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder={hasCredentials ? "e.g., TS09AB1234" : "e.g., TS09AB1234 (mock data)"}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={state.isLoading}
              />
              <button
                onClick={handleTestRTA}
                disabled={state.isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {state.isLoading ? 'Testing...' : 'Full Integration Test'}
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Debug Information */}
          {debugInfo && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Request Debug Info</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Mode:</strong> {debugInfo.mode}</div>
                <div><strong>API URL:</strong> {debugInfo.apiUrl}</div>
                <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
                <div><strong>Has Credentials:</strong> {debugInfo.hasCredentials ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">TSeChallan API Error</h3>
                  <p className="mt-1 text-sm text-red-700">{state.error}</p>
                  {hasCredentials && (
                    <div className="mt-2 text-xs text-red-600">
                      <p>If you're seeing authentication errors, please verify:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Your IP is whitelisted with TSeChallan</li>
                        <li>Vendor credentials are correct</li>
                        <li>Network access to TSeChallan endpoints</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Integration Results */}
      {testResults && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">TSeChallan Integration Results</h3>

          {/* Overall Status */}
          <div className="mb-6">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              testResults.rtaMatched 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {testResults.rtaMatched ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <AlertTriangle className="mr-2 h-4 w-4" />
              )}
              {testResults.rtaMatched ? 'RTA Data Matched' : 'RTA Data Mismatch'}
            </div>
            {debugInfo && (
              <span className={`ml-3 text-xs px-2 py-1 rounded ${
                debugInfo.mode === 'backend' ? 'bg-green-100 text-green-800' : 
                debugInfo.mode === 'direct' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {debugInfo.mode === 'backend' ? 'Backend API Data' : 
                 debugInfo.mode === 'direct' ? 'Direct API Data' : 
                 'Mock Data'}
              </span>
            )}
          </div>

          {/* RTA Data */}
          {testResults.rtaData && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">
                {debugInfo?.mode === 'backend' ? 'TSeChallan Database Information (via Backend)' : 
                 debugInfo?.mode === 'direct' ? 'TSeChallan Database Information (Direct)' : 
                 'Mock RTA Database Information'}
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Registration Number:</span>
                    <p className="text-gray-900">{testResults.rtaData.registrationNumber}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Owner Name:</span>
                    <p className="text-gray-900">{testResults.rtaData.ownerName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Vehicle Class:</span>
                    <p className="text-gray-900">{testResults.rtaData.vehicleClass}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Make:</span>
                    <p className="text-gray-900">{testResults.rtaData.make}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Model:</span>
                    <p className="text-gray-900">{testResults.rtaData.model}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Color:</span>
                    <p className="text-gray-900">{testResults.rtaData.color}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Fuel Type:</span>
                    <p className="text-gray-900">{testResults.rtaData.fuelType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">RC Status:</span>
                    <p className={`font-medium ${
                      testResults.rtaData.rcStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {testResults.rtaData.rcStatus}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">RTO:</span>
                    <p className="text-gray-900">{testResults.rtaData.rto}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="font-medium text-gray-600">Owner Address:</span>
                  <p className="text-gray-900 mt-1">{testResults.rtaData.ownerAddress}</p>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Matching Results */}
          {testResults.vehicleMatches.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Vehicle Details Comparison</h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Field
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {debugInfo?.mode === 'backend' ? 'TSeChallan Data' : 
                         debugInfo?.mode === 'direct' ? 'TSeChallan Data' : 
                         'RTA Data'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Detected
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Match Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testResults.vehicleMatches.map((match, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {match.field}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {match.rtaData}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {match.aiDetected}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {match.match ? (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600 font-medium">Match</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600 font-medium">Mismatch</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {match.confidence ? `${(match.confidence * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TSeChallan API Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">TSeChallan Integration Architecture</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Current Mode:</strong> {
            apiMode === 'backend' ? '🟢 Backend API (Recommended for Production)' :
            apiMode === 'direct' ? '🟡 Direct API (May fail due to IP restrictions)' :
            '🟡 Mock Data (Development/Testing)'
          }</li>
          {apiMode === 'backend' && (
            <>
              <li>• Backend Proxy: {backendUrl}</li>
              <li>• Backend handles TSeChallan authentication and IP whitelisting</li>
              <li>• Secure architecture - credentials stored on backend only</li>
            </>
          )}
          {apiMode === 'direct' && (
            <>
              <li>• ⚠️ Direct calls may fail - your IP needs TSeChallan whitelisting</li>
              <li>• Consider using backend API for production deployment</li>
            </>
          )}
          <li>• Staging: https://echallan.tspolice.gov.in/TSeChallanRST</li>
          <li>• Production: https://echallan.tspolice.gov.in/TSeChallanRS</li>
          <li>• Token-based authentication (60-minute expiry with auto-refresh)</li>
          <li>• Fuzzy matching algorithm compares TSeChallan vs AI-detected vehicle details</li>
          {apiMode === 'mock' && (
            <li>• Configure VITE_BACKEND_API_URL for backend proxy or credentials for direct API</li>
          )}
        </ul>
        
        {apiMode === 'direct' && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>IP Whitelisting Issue:</strong> Your Render backend IPs are whitelisted, but direct frontend calls 
              from localhost will fail. Deploy the backend service to Render and configure VITE_BACKEND_API_URL 
              to use the backend proxy approach.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RTATestComponent; 