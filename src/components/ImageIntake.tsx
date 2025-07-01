import React, { useState, useCallback } from 'react';
import { Upload, CheckCircle, XCircle, Image as ImageIcon, AlertCircle, Car, Eye, Clock, ArrowRight } from 'lucide-react';
import { apiService, GeminiAnalysisResponse } from '../services/api';
import { useChallanContext } from '../context/ChallanContext';

interface AnalyzedImage {
  id: string;
  challanId: string;
  file: File;
  preview: string;
  status: 'uploading' | 'analyzing' | 'completed' | 'error';
  analysis?: GeminiAnalysisResponse;
  error?: string;
  uploadProgress?: number;
  // Enhanced workflow states
  geminiStatus: 'pending' | 'analyzing' | 'completed' | 'error';
  rtaStatus: 'pending' | 'analyzing' | 'completed' | 'error' | 'skipped';
  comparisonStatus: 'pending' | 'analyzing' | 'completed' | 'skipped';
  detectedPlateNumber?: string;
  rtaData?: any;
  geminiData?: any;
  comparisonResult?: any;
}

const ImageIntake: React.FC = () => {
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const { addChallan, updateChallanWithAnalysis, updateChallanStatus, getChallansByStatus } = useChallanContext();

  // Check backend status on component mount
  React.useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      await apiService.testBackendHealth();
      setBackendStatus('online');
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('offline');
    }
  };

  const enhancedImageAnalysis = async (imageFile: AnalyzedImage) => {
    try {
      console.log('🔍 Starting enhanced parallel analysis for:', imageFile.file.name);
      
      // Update overall status to analyzing
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { ...img, status: 'analyzing', geminiStatus: 'analyzing' }
          : img
      ));

      // Update challan status to processing
      updateChallanStatus(imageFile.challanId, 'processing');

      // Step 1: Start Gemini analysis to get vehicle details and plate number
      console.log('📍 Step 1: Starting Gemini analysis...');
      const geminiAnalysis = await apiService.analyzeImage(imageFile.file);
      
      console.log('✅ Gemini analysis completed:', geminiAnalysis);

      // Extract plate number from Gemini results
      const detectedPlateNumber = geminiAnalysis.gemini_analysis?.vehicle_details?.number_plate?.text;
      
      // Update with Gemini results
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { 
              ...img, 
              geminiStatus: 'completed',
              geminiData: geminiAnalysis.gemini_analysis,
              detectedPlateNumber,
              rtaStatus: detectedPlateNumber ? 'analyzing' : 'skipped'
            }
          : img
      ));

      let rtaData: any = null;
      let comparisonResult: any = null;

      // Step 2: If plate number detected, start RTA lookup
      if (detectedPlateNumber) {
        console.log('📍 Step 2: Starting RTA lookup for plate:', detectedPlateNumber);
        
        try {
          const rtaResponse = await apiService.getVehicleDetails(detectedPlateNumber);
          rtaData = rtaResponse.data;
          
          console.log('✅ RTA lookup completed:', rtaData);
          
          // Update with RTA results
          setAnalyzedImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { 
                  ...img, 
                  rtaStatus: 'completed',
                  rtaData,
                  comparisonStatus: 'analyzing'
                }
              : img
          ));

          // Step 3: Compare RTA data with Gemini detected details
          console.log('📍 Step 3: Comparing RTA vs AI detected details...');
          comparisonResult = await performVehicleComparison(rtaData, geminiAnalysis.gemini_analysis?.vehicle_details);
          
          console.log('✅ Comparison completed:', comparisonResult);

        } catch (rtaError) {
          console.error('⚠️ RTA lookup failed:', rtaError);
          setAnalyzedImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, rtaStatus: 'error' }
              : img
          ));
        }
      } else {
        console.log('⚠️ No plate number detected, skipping RTA lookup');
      }

      // Final update with all results
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { 
              ...img, 
              status: 'completed',
              comparisonStatus: comparisonResult ? 'completed' : 'skipped',
              comparisonResult,
              analysis: {
                ...geminiAnalysis,
                rta_verification: comparisonResult
              }
            }
          : img
      ));

      // Update the challan in context with complete analysis results
      const completeAnalysis = {
        ...geminiAnalysis,
        rta_verification: comparisonResult
      };
      updateChallanWithAnalysis(imageFile.challanId, completeAnalysis);

      // Auto-remove from local state after 5 seconds (moved to review queue)
      setTimeout(() => {
        setAnalyzedImages(prev => prev.filter(img => img.id !== imageFile.id));
      }, 5000);

    } catch (error) {
      console.error('💥 Enhanced analysis failed:', error);
      
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { 
              ...img, 
              status: 'error', 
              geminiStatus: 'error',
              rtaStatus: 'error',
              comparisonStatus: 'skipped',
              error: error instanceof Error ? error.message : 'Analysis failed'
            }
          : img
      ));

      // Update challan status to rejected (system error)
      updateChallanStatus(imageFile.challanId, 'rejected');
    }
  };

  // Helper function to compare RTA data with AI detected vehicle details
  const performVehicleComparison = async (rtaData: any, aiDetected: any) => {
    if (!rtaData || !aiDetected) return null;

    // Simple comparison logic (can be enhanced)
    const makeMatch = rtaData.make && aiDetected.make ? 
      rtaData.make.toLowerCase().includes(aiDetected.make.toLowerCase()) ||
      aiDetected.make.toLowerCase().includes(rtaData.make.toLowerCase()) : false;
    
    const modelMatch = rtaData.model && aiDetected.model ? 
      rtaData.model.toLowerCase().includes(aiDetected.model.toLowerCase()) ||
      aiDetected.model.toLowerCase().includes(rtaData.model.toLowerCase()) : false;
    
    const colorMatch = rtaData.color && aiDetected.color ? 
      rtaData.color.toLowerCase().includes(aiDetected.color.toLowerCase()) ||
      aiDetected.color.toLowerCase().includes(rtaData.color.toLowerCase()) : false;

    const matchCount = [makeMatch, modelMatch, colorMatch].filter(Boolean).length;
    const overallMatch = matchCount >= 2; // At least 2 out of 3 should match

    return {
      registration_number: rtaData.registrationNumber || rtaData.regNo,
      status: 'verified',
      matches: overallMatch,
      confidence_scores: {
        make: makeMatch ? 0.9 : 0.1,
        model: modelMatch ? 0.9 : 0.1,
        color: colorMatch ? 0.9 : 0.1,
      },
      overall_score: matchCount / 3,
      comparison_details: {
        make: { rta: rtaData.make, ai: aiDetected.make, match: makeMatch },
        model: { rta: rtaData.model, ai: aiDetected.model, match: modelMatch },
        color: { rta: rtaData.color, ai: aiDetected.color, match: colorMatch }
      }
    };
  };

  const processFiles = (files: File[]) => {
    const newImages: AnalyzedImage[] = files.map(file => {
      const challanId = addChallan(file); // Add to global context
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        challanId,
        file,
        preview: URL.createObjectURL(file),
        status: 'uploading',
        // Initialize enhanced workflow states
        geminiStatus: 'pending',
        rtaStatus: 'pending',
        comparisonStatus: 'pending'
      };
    });

    setAnalyzedImages(prev => [...prev, ...newImages]);

    // Start analysis for each image
    newImages.forEach(imageFile => {
      setTimeout(() => enhancedImageAnalysis(imageFile), 500);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
    );
    
    if (files.length > 0) {
      processFiles(files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    processFiles(files);
    
    // Reset input
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const getStatusIcon = (image: AnalyzedImage) => {
    switch (image.status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
      case 'analyzing':
        return <div className="animate-pulse"><Eye className="h-5 w-5 text-blue-500" /></div>;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'analyzing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (image: AnalyzedImage) => {
    switch (image.status) {
      case 'uploading':
        return 'Uploading...';
      case 'analyzing':
        if (image.geminiStatus === 'analyzing') return 'AI Analysis in progress...';
        if (image.rtaStatus === 'analyzing') return 'RTA Verification in progress...';
        if (image.comparisonStatus === 'analyzing') return 'Comparing results...';
        return 'Processing...';
      case 'completed':
        const violationCount = image.analysis?.gemini_analysis?.violations?.length || 0;
        const isMatched = image.comparisonResult?.matches;
        if (violationCount > 0) {
          return `${violationCount} violation(s) detected ${isMatched !== undefined ? (isMatched ? '✓ Verified' : '⚠ Mismatch') : ''} → Moving to review`;
        } else {
          return `No violations ${isMatched !== undefined ? (isMatched ? '✓ Verified' : '⚠ Mismatch') : ''} → Auto-approved`;
        }
      case 'error':
        return `Analysis failed`;
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (image: AnalyzedImage) => {
    switch (image.status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-800';
      case 'analyzing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return image.analysis?.gemini_analysis.violations.length ? 
          'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get stats from context
  const processingCount = getChallansByStatus('processing').length;
  const pendingReviewCount = getChallansByStatus('pending-review').length;
  const approvedCount = getChallansByStatus('approved').length;
  const rejectedCount = getChallansByStatus('rejected').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Traffic Violation Analysis</h1>
            <p className="text-gray-600">Upload traffic images for AI-powered violation detection using Gemini Vision</p>
            
            {/* Backend Status Indicator */}
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                backendStatus === 'online' ? 'bg-green-500' : 
                backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-500">
                Backend: {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
              </span>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{processingCount}</div>
              <div className="text-sm text-blue-600">Processing</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingReviewCount}</div>
              <div className="text-sm text-orange-600">Pending Review</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-sm text-green-600">Approved</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <div className="text-sm text-red-600">Rejected</div>
            </div>
          </div>

          {/* Backend Offline Warning */}
          {backendStatus === 'offline' && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Backend Service Unavailable</h3>
                  <p className="mt-1 text-sm text-red-700">
                    Cannot connect to the analysis backend. Please check your internet connection or try again later.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : backendStatus === 'offline' 
                  ? 'border-gray-200 bg-gray-50 opacity-50'
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop traffic images here or click to browse
            </h3>
            <p className="text-gray-500 mb-4">
              Supports JPG, PNG files. Each image will be analyzed for traffic violations.
            </p>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileInput}
              disabled={backendStatus === 'offline'}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white transition-colors duration-200 ${
                backendStatus === 'offline' 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              }`}
            >
              <ImageIcon className="mr-2 h-5 w-5" />
              Select Images
            </label>
          </div>

          {analyzedImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Current Analysis ({analyzedImages.length})
              </h3>
              <div className="space-y-4">
                {analyzedImages.map((image) => (
                  <div
                    key={image.id}
                    className="border border-gray-200 rounded-lg p-6 bg-white"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        <img
                          src={image.preview}
                          alt="Traffic image"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                      
                      {/* Enhanced Analysis Workflow */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {image.file.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(image)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(image)}`}>
                              {getStatusText(image)}
                            </span>
                            {image.status === 'completed' && (
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Three-Step Workflow Display */}
                        <div className="space-y-3">
                          {/* Step 1: Gemini AI Analysis */}
                          <div className="flex items-center space-x-3">
                            {getStepIcon(image.geminiStatus)}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                1. AI Vehicle Analysis
                                {image.geminiStatus === 'completed' && image.detectedPlateNumber && (
                                  <span className="ml-2 text-blue-600">→ Plate: {image.detectedPlateNumber}</span>
                                )}
                              </div>
                              {image.geminiStatus === 'completed' && image.geminiData && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {image.geminiData.violations?.length || 0} violations detected, 
                                  Vehicle: {image.geminiData.vehicle_details?.make} {image.geminiData.vehicle_details?.model}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Step 2: RTA Database Lookup */}
                          <div className="flex items-center space-x-3">
                            {getStepIcon(image.rtaStatus)}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                2. RTA Database Verification
                                {image.rtaStatus === 'skipped' && (
                                  <span className="ml-2 text-yellow-600">→ No plate detected</span>
                                )}
                                {image.rtaStatus === 'completed' && image.rtaData && (
                                  <span className="ml-2 text-green-600">→ Vehicle found</span>
                                )}
                              </div>
                              {image.rtaStatus === 'completed' && image.rtaData && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Owner: {image.rtaData.ownerName}, Make: {image.rtaData.make} {image.rtaData.model}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Step 3: Comparison & Verification */}
                          <div className="flex items-center space-x-3">
                            {getStepIcon(image.comparisonStatus)}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                3. AI vs RTA Comparison
                                {image.comparisonStatus === 'completed' && image.comparisonResult && (
                                  <span className={`ml-2 ${image.comparisonResult.matches ? 'text-green-600' : 'text-red-600'}`}>
                                    → {image.comparisonResult.matches ? 'Verified' : 'Mismatch detected'}
                                  </span>
                                )}
                              </div>
                              {image.comparisonStatus === 'completed' && image.comparisonResult && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Match Score: {Math.round(image.comparisonResult.overall_score * 100)}%
                                  {image.comparisonResult.comparison_details && (
                                    <span className="ml-2">
                                      Make: {image.comparisonResult.comparison_details.make.match ? '✓' : '✗'},
                                      Model: {image.comparisonResult.comparison_details.model.match ? '✓' : '✗'},
                                      Color: {image.comparisonResult.comparison_details.color.match ? '✓' : '✗'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Error Message */}
                        {image.error && (
                          <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                            <strong>Error:</strong> {image.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-blue-700">
                    <strong>Enhanced Analysis Pipeline:</strong> Each image goes through AI analysis → RTA verification → comparison validation before moving to officer review.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageIntake;