import React, { useState, useCallback } from 'react';
import { Upload, CheckCircle, XCircle, Image as ImageIcon, AlertCircle, Car, Eye, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { apiService, StepAnalysisResponse } from '../services/api';
import { useChallanContext } from '../context/ChallanContext';

interface AnalyzedImage {
  id: string;
  challanId: string;
  file: File;
  preview: string;
  status: 'uploading' | 'analyzing' | 'completed' | 'error';
  stepAnalysisResponse?: StepAnalysisResponse;
  error?: string;
  uploadProgress?: number;
  // Enhanced 6-step workflow states
  step1Status: 'pending' | 'analyzing' | 'completed' | 'error';
  step2Status: 'pending' | 'analyzing' | 'completed' | 'error' | 'skipped';
  step3Status: 'pending' | 'analyzing' | 'completed' | 'error' | 'skipped';
  step4Status: 'pending' | 'analyzing' | 'completed' | 'error' | 'skipped';
  step5Status: 'pending' | 'analyzing' | 'completed' | 'error' | 'skipped';
  step6Status: 'pending' | 'analyzing' | 'completed' | 'error' | 'skipped';
  qualityCategory?: string;
  detectedPlateNumber?: string;
  rtaData?: any;
  vehicleAnalysis?: any;
  comparisonResult?: any;
  violationAnalysis?: any;
}

const ImageIntake: React.FC = () => {
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const { addChallan, updateChallanWithStepAnalysis, updateChallanStatus, getChallansByStatus } = useChallanContext();

  // Check backend status on component mount
  React.useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const health = await apiService.testBackendHealth();
      console.log('🏥 Backend health status:', health);
      setBackendStatus('online');
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('offline');
    }
  };

  const enhancedStep6Analysis = async (imageFile: AnalyzedImage) => {
    try {
      console.log('🚀 Starting Step 6 complete workflow for:', imageFile.file.name);
      
      // Update overall status to analyzing
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { ...img, status: 'analyzing', step1Status: 'analyzing' }
          : img
      ));

      // Update challan status to processing
      updateChallanStatus(imageFile.challanId, 'processing');

      // Execute complete Step 6 workflow
      console.log('📍 Starting Step 6 complete workflow...');
      const stepAnalysisResponse = await apiService.analyzeImageStep6(imageFile.file);
      
      console.log('✅ Step 6 workflow completed:', stepAnalysisResponse);

      // Extract data from the new structure
      const results = stepAnalysisResponse.results;
      const step1Data = results.step1?.data;
      const step2Data = results.step2?.data;
      const step3Data = results.step3?.data;
      const step4Data = results.step4?.data;
      const step5Data = results.step5?.data;
      const step6Data = results.step6?.data;

      // Track individual step statuses
      const stepStatuses = {
        step1Status: results.step1?.success ? 'completed' as const : 'error' as const,
        step2Status: results.step2?.success ? 'completed' as const : 
          results.step2?.errorCode === 'POOR_IMAGE_QUALITY' || results.step2?.errorCode === 'NO_PLATE_DETECTED' ? 'skipped' as const : 'error' as const,
        step3Status: results.step3?.success ? 'completed' as const : 
          results.step3?.errorCode === 'NO_LICENSE_PLATE' ? 'skipped' as const : 'error' as const,
        step4Status: results.step4?.success ? 'completed' as const : 
          results.step4?.errorCode === 'POOR_IMAGE_QUALITY' ? 'skipped' as const : 'error' as const,
        step5Status: results.step5?.success ? 'completed' as const : 
          results.step5?.errorCode === 'NO_RTA_DATA' || results.step5?.errorCode === 'NO_VEHICLE_ANALYSIS' ? 'skipped' as const : 'error' as const,
        step6Status: results.step6?.success ? 'completed' as const : 'error' as const
      };
      
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { 
              ...img, 
              status: 'completed' as const,
              stepAnalysisResponse,
              ...stepStatuses,
              qualityCategory: step1Data?.quality_category,
              detectedPlateNumber: step1Data?.extracted_license_plate || step2Data?.license_plate,
              rtaData: step3Data?.rta_data,
              vehicleAnalysis: step4Data?.vehicle_analysis,
              comparisonResult: step5Data?.comparison_result,
              violationAnalysis: step6Data?.violation_analysis
            } as AnalyzedImage
          : img
      ));

      // Update the challan in context with complete analysis results
      updateChallanWithStepAnalysis(imageFile.challanId, stepAnalysisResponse);

      // Auto-remove from local state after 8 seconds (moved to review queue)
      setTimeout(() => {
        setAnalyzedImages(prev => prev.filter(img => img.id !== imageFile.id));
      }, 8000);

    } catch (error) {
      console.error('💥 Step 6 workflow failed:', error);
      
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { 
              ...img, 
              status: 'error', 
              step1Status: 'error',
              step2Status: 'error',
              step3Status: 'error',
              step4Status: 'error',
              step5Status: 'error',
              step6Status: 'error',
              error: error instanceof Error ? error.message : 'Step 6 workflow failed'
            }
          : img
      ));

      // Update challan status to rejected (system error)
      updateChallanStatus(imageFile.challanId, 'rejected');
    }
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
        // Initialize 6-step workflow states
        step1Status: 'pending',
        step2Status: 'pending',
        step3Status: 'pending',
        step4Status: 'pending',
        step5Status: 'pending',
        step6Status: 'pending'
      };
    });

    setAnalyzedImages(prev => [...prev, ...newImages]);

    // Start analysis for each image
    newImages.forEach(imageFile => {
      setTimeout(() => enhancedStep6Analysis(imageFile), 500);
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
    if (image.status === 'uploading') return 'Uploading...';
    if (image.status === 'error') return 'Analysis failed';
    
    if (image.status === 'analyzing') {
      if (image.step1Status === 'analyzing') return 'Step 1: Quality assessment + license plate extraction...';
      if (image.step2Status === 'analyzing') return 'Step 2: Processing OCR results...';
      if (image.step3Status === 'analyzing') return 'Step 3: Looking up RTA data...';
      if (image.step4Status === 'analyzing') return 'Step 4: Analyzing vehicle details...';
      if (image.step5Status === 'analyzing') return 'Step 5: Comparing AI vs RTA data...';
      if (image.step6Status === 'analyzing') return 'Step 6: Detecting violations...';
      return 'Processing...';
    }
    
    if (image.status === 'completed') {
      const violationCount = image.violationAnalysis?.detected_violation_count || 0;
      const comparisonVerdict = image.comparisonResult?.overall_verdict;
      
      if (violationCount > 0) {
        const violationTypes = image.violationAnalysis?.violation_types_found?.join(', ') || 'violations';
        return `${violationCount} violation(s) detected: ${violationTypes} ${comparisonVerdict ? `(${comparisonVerdict})` : ''} → Moving to review`;
      } else {
        return `No violations detected ${comparisonVerdict ? `(${comparisonVerdict})` : ''} → Auto-approved`;
      }
    }
    
    return 'Unknown';
  };

  const getStatusColor = (image: AnalyzedImage) => {
    switch (image.status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-800';
      case 'analyzing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        const violationCount = image.violationAnalysis?.detected_violation_count || 0;
        return violationCount > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getViolationBadge = (violationType: string) => {
    const colors = {
      'No Helmet': 'bg-red-100 text-red-800',
      'Cell Phone Driving': 'bg-orange-100 text-orange-800',
      'Triple Riding': 'bg-purple-100 text-purple-800'
    };
    
    return colors[violationType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Traffic Violation Analysis - Enhanced AI</h1>
            <p className="text-gray-600">Upload traffic images for complete 6-step AI analysis with enhanced quality assessment and license plate extraction</p>
            
            {/* Backend Status Indicator */}
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                backendStatus === 'online' ? 'bg-green-500' : 
                backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-500">
                Backend: {backendStatus === 'online' ? 'Online (Enhanced AI Ready)' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
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
                    Cannot connect to the enhanced AI analysis backend. Please check your internet connection or try again later.
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
              Supports JPG, PNG files. Each image will be analyzed through our enhanced 6-step AI workflow with combined quality assessment and license plate extraction.
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
                      
                      {/* Enhanced 6-Step Workflow Display */}
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

                        {/* Six-Step Workflow Display */}
                        <div className="space-y-3">
                          {/* Step 1: Combined Quality Assessment + OCR */}
                          <div className="flex items-center space-x-3">
                            {getStepIcon(image.step1Status)}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                1. Quality Assessment + License Plate Extraction
                                {image.step1Status === 'completed' && image.qualityCategory && (
                                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                    image.qualityCategory === 'GOOD' ? 'bg-green-100 text-green-600' :
                                    image.qualityCategory === 'NEEDS_BETTER_REVIEW' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-red-100 text-red-600'
                                  }`}>
                                    {image.qualityCategory.replace('_', ' ')}
                                  </span>
                                )}
                                {image.step1Status === 'completed' && image.detectedPlateNumber && (
                                  <span className="ml-2 text-blue-600 font-mono">→ {image.detectedPlateNumber}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Step 2: OCR Data Processing */}
                          <div className="flex items-center space-x-3">
                            {getStepIcon(image.step2Status)}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                2. License Plate Data Processing
                                {image.step2Status === 'completed' && (
                                  <span className="ml-2 text-green-600">→ Format validated & processed</span>
                                )}
                                {image.step2Status === 'skipped' && (
                                  <span className="ml-2 text-yellow-600">→ Using Step 1 results</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Step 3: RTA Database Lookup */}
                          <div className="flex items-center space-x-3">
                            {getStepIcon(image.step3Status)}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                3. RTA Database Verification
                                {image.step3Status === 'completed' && image.rtaData && (
                                  <span className="ml-2 text-green-600">→ {image.rtaData.make} {image.rtaData.model}</span>
                                )}
                                {image.step3Status === 'skipped' && (
                                  <span className="ml-2 text-yellow-600">→ No plate detected</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Step 4: Vehicle Analysis */}
                          <div className="flex items-center space-x-3">
                            {getStepIcon(image.step4Status)}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                4. AI Vehicle Analysis
                                {image.step4Status === 'completed' && image.vehicleAnalysis && (
                                  <span className="ml-2 text-blue-600">
                                    → {image.vehicleAnalysis.vehicle_type} ({image.vehicleAnalysis.color})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Step 5: Vehicle Comparison */}
                          <div className="flex items-center space-x-3">
                            {getStepIcon(image.step5Status)}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                5. AI vs RTA Comparison
                                {image.step5Status === 'completed' && image.comparisonResult && (
                                  <span className={`ml-2 ${
                                    image.comparisonResult.overall_verdict === 'MATCH' ? 'text-green-600' :
                                    image.comparisonResult.overall_verdict === 'PARTIAL_MATCH' ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    → {image.comparisonResult.overall_verdict} ({Math.round(image.comparisonResult.confidence_score * 100)}%)
                                  </span>
                                )}
                                {image.step5Status === 'skipped' && (
                                  <span className="ml-2 text-yellow-600">→ Missing data</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Step 6: Violation Detection */}
                          <div className="flex items-center space-x-3">
                            {getStepIcon(image.step6Status)}
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                6. AI Violation Detection
                                {image.step6Status === 'completed' && image.violationAnalysis && (
                                  <span className="ml-2">
                                    {image.violationAnalysis.detected_violation_count > 0 ? (
                                      <span className="text-red-600">
                                        → {image.violationAnalysis.detected_violation_count} violation(s)
                                      </span>
                                    ) : (
                                      <span className="text-green-600">→ No violations</span>
                                    )}
                                  </span>
                                )}
                              </div>
                              {/* Violation Details */}
                              {image.step6Status === 'completed' && image.violationAnalysis?.violations_detected && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {image.violationAnalysis.violations_detected
                                    .filter((v: any) => v.detected)
                                    .map((violation: any, index: number) => (
                                      <span
                                        key={index}
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getViolationBadge(violation.violation_type)}`}
                                      >
                                        <ShieldAlert className="w-3 h-3 mr-1" />
                                        {violation.violation_type} ({Math.round(violation.confidence * 100)}%)
                                      </span>
                                    ))}
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
                    <strong>Enhanced Step 6 AI Pipeline:</strong> Each image goes through complete analysis: 
                    Enhanced Quality + License Plate Extraction → Data Processing → RTA Verification → Vehicle Analysis → AI Comparison → Violation Detection (No Helmet, Cell Phone Driving, Triple Riding)
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