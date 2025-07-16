import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, CheckCircle, XCircle, Image as ImageIcon, AlertCircle, Eye, ArrowRight, ShieldAlert, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { apiService, StepAnalysisResponse } from '../services/api';
import { useChallanContext } from '../context/ChallanContext';

interface AnalyzedImage {
  id: string;
  challanId: string;
  file: File;
  preview: string;
  status: 'queued' | 'analyzing' | 'completed' | 'error' | 'retrying';
  stepAnalysisResponse?: StepAnalysisResponse;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  queuePosition?: number;
  // Simplified status tracking
  detectedPlateNumber?: string;
  violationCount?: number;
  violationTypes?: string[];
  vehicleMatch?: boolean;
}

interface QueueStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  currentImage?: string;
  isProcessing: boolean;
  isPaused: boolean;
}

const ImageIntake: React.FC = () => {
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [queueStats, setQueueStats] = useState<QueueStats>({
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    isProcessing: false,
    isPaused: false
  });
  
  const { addChallan, updateChallanWithStepAnalysis, updateChallanStatus, getChallansByStatus } = useChallanContext();

  // Check backend status on component mount
  React.useEffect(() => {
    console.log('🔧 FRONTEND ENVIRONMENT CHECK:');
    console.log('  📡 VITE_BACKEND_API_URL:', import.meta.env.VITE_BACKEND_API_URL);
    console.log('  🌍 Environment mode:', import.meta.env.MODE);
    console.log('  🔍 All env vars:', import.meta.env);
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

  const processingRef = useRef(false);
  const pausedRef = useRef(false);

  // Update pause ref when state changes
  useEffect(() => {
    pausedRef.current = queueStats.isPaused;
  }, [queueStats.isPaused]);

  // Simple queue processing function
  const processQueue = useCallback(() => {
    if (processingRef.current) return;
    
    const processNextImage = async () => {
      if (pausedRef.current || processingRef.current) return;
      
      processingRef.current = true;
      setQueueStats(prev => ({ ...prev, isProcessing: true }));

      // Get current images
      setAnalyzedImages(currentImages => {
        // Find next image to process
        const nextImage = currentImages.find(img => 
          img.status === 'queued' || 
          (img.status === 'error' && (img.retryCount || 0) < (img.maxRetries || 3))
        );
        
        if (!nextImage) {
          // No more images to process
          processingRef.current = false;
          setQueueStats(prev => ({ ...prev, isProcessing: false, currentImage: undefined }));
          return currentImages;
        }
        
        // Update current image in stats
        setQueueStats(prev => ({ ...prev, currentImage: nextImage.file.name }));
        
        // Process the image
        analyzeImageWithRetry(nextImage)
          .then(() => {
            // Schedule next image processing
            setTimeout(() => {
              processingRef.current = false;
              processNextImage();
            }, 2000);
          })
          .catch(error => {
            console.error('Queue processing error:', error);
            processingRef.current = false;
            processNextImage();
          });
        
        return currentImages;
      });
    };

    processNextImage();
  }, []);

  const analyzeImageWithRetry = async (imageFile: AnalyzedImage) => {
    const currentRetryCount = imageFile.retryCount || 0;
    const maxRetries = imageFile.maxRetries || 3;
    
    try {
      // Update status to analyzing or retrying
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { ...img, status: currentRetryCount > 0 ? 'retrying' : 'analyzing' }
          : img
      ));

      // Execute analysis
      await analyzeImage(imageFile);
      
    } catch (error) {
      console.error(`Analysis failed for ${imageFile.file.name}:`, error);
      
      if (currentRetryCount < maxRetries) {
        // Retry with exponential backoff
        const retryDelay = Math.pow(2, currentRetryCount) * 1000; // 1s, 2s, 4s, 8s...
        
        console.log(`Retrying ${imageFile.file.name} in ${retryDelay}ms (attempt ${currentRetryCount + 1}/${maxRetries})`);
        
        setAnalyzedImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { ...img, retryCount: currentRetryCount + 1, status: 'queued' }
            : img
        ));
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
      } else {
        // Max retries reached
        setAnalyzedImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { 
                ...img, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Analysis failed after retries'
              }
            : img
        ));
        
        // Update stats
        setQueueStats(prev => ({ 
          ...prev, 
          failed: prev.failed + 1,
          pending: prev.pending - 1
        }));
        
        // Update challan status to rejected
        updateChallanStatus(imageFile.challanId, 'rejected');
      }
    }
  };

  const pauseQueue = () => {
    setQueueStats(prev => ({ ...prev, isPaused: true }));
  };

  const resumeQueue = () => {
    setQueueStats(prev => ({ ...prev, isPaused: false }));
    processQueue();
  };

  const retryFailedImages = () => {
    setAnalyzedImages(prev => prev.map(img => 
      img.status === 'error' 
        ? { ...img, status: 'queued', retryCount: 0, error: undefined }
        : img
    ));
    
    const failedCount = analyzedImages.filter(img => img.status === 'error').length;
    setQueueStats(prev => ({ 
      ...prev, 
      failed: prev.failed - failedCount,
      pending: prev.pending + failedCount
    }));
    
    processQueue();
  };

  // Auto-process queue when new images are added or when processing is resumed
  useEffect(() => {
    const hasQueuedImages = analyzedImages.some(img => img.status === 'queued');
    if (hasQueuedImages && !queueStats.isProcessing && !queueStats.isPaused) {
      processQueue();
    }
  }, [analyzedImages, queueStats.isProcessing, queueStats.isPaused, processQueue]);

  // Update queue positions when images change
  useEffect(() => {
    const queuedImages = analyzedImages.filter(img => img.status === 'queued');
    setAnalyzedImages(prev => prev.map(img => 
      img.status === 'queued' 
        ? { ...img, queuePosition: queuedImages.findIndex(q => q.id === img.id) + 1 }
        : img
    ));
  }, [analyzedImages]);

  const analyzeImage = async (imageFile: AnalyzedImage) => {
    try {
      console.log('🚀 Starting analysis for:', imageFile.file.name);
      
      // Update status to analyzing
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { ...img, status: 'analyzing' }
          : img
      ));

      // Update challan status to processing
      updateChallanStatus(imageFile.challanId, 'processing');

      // Execute complete analysis workflow
      const stepAnalysisResponse = await apiService.analyzeImageStep6(imageFile.file);
      
      console.log('✅ Analysis completed:', stepAnalysisResponse);
      console.log('🔍 FRONTEND DEBUG: Full response structure:');
      console.log('  📋 Response success:', stepAnalysisResponse.success);
      console.log('  📋 Response keys:', Object.keys(stepAnalysisResponse));
      console.log('  📋 Results keys:', stepAnalysisResponse.results ? Object.keys(stepAnalysisResponse.results) : 'NO RESULTS');
      console.log('  📋 Step1 data:', stepAnalysisResponse.results?.step1?.data);
      console.log('  📋 Step2 data:', stepAnalysisResponse.results?.step2?.data);
      console.log('  📋 Step3 data:', stepAnalysisResponse.results?.step3?.data);
      console.log('  📋 Step4 data:', stepAnalysisResponse.results?.step4?.data);
      console.log('  📋 Step5 data:', stepAnalysisResponse.results?.step5?.data);
      console.log('  📋 Step6 data:', stepAnalysisResponse.results?.step6?.data);

      // Check Step 1 for various rejection conditions
      const step1Data = stepAnalysisResponse.results.step1?.data;
      
      // Handle enhanced quality assessment rejections
      if (step1Data?.status === 'REJECTED') {
        const rejectionReason = step1Data.primary_rejection_reason || 'Image quality insufficient for analysis';
        const detailedAnalysis = step1Data.detailed_analysis;
        
        console.log('🚫 ENHANCED: Image rejected due to quality issues');
        console.log('  📋 Rejection reason:', rejectionReason);
        console.log('  📋 Quality score:', step1Data.overall_quality_score);
        
        // Create detailed error message based on analysis
        let detailedError = rejectionReason;
        
        if (detailedAnalysis) {
          // Add specific obstruction details
          if (detailedAnalysis.license_plate_visibility?.obstructions_detected?.length > 0) {
            detailedError += ` (Obstructions: ${detailedAnalysis.license_plate_visibility.obstructions_detected.join(', ')})`;
          }
          
          // Add lighting issues
          if (detailedAnalysis.lighting_quality?.glare_affecting_plates) {
            detailedError += ' (Glare affecting license plates)';
          }
          
          // Add sharpness issues
          if (detailedAnalysis.image_sharpness?.blur_detected) {
            detailedError += ' (Image blur detected)';
          }
        }
        
        setAnalyzedImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { 
                ...img, 
                status: 'completed' as const,
                stepAnalysisResponse,
                error: detailedError
              } as AnalyzedImage
            : img
        ));

        updateChallanStatus(imageFile.challanId, 'rejected');
        
        setTimeout(() => {
          setAnalyzedImages(prev => prev.filter(img => img.id !== imageFile.id));
        }, 8000); // Longer display time for detailed messages
        
        return;
      }

      // Legacy rejection handling for backward compatibility
      if (step1Data?.response_type === 'bad_quality') {
        console.log('🚫 Image rejected due to poor quality (legacy)');
        
        setAnalyzedImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { 
                ...img, 
                status: 'completed' as const,
                stepAnalysisResponse,
                error: 'Image quality too poor for analysis'
              } as AnalyzedImage
            : img
        ));

        updateChallanStatus(imageFile.challanId, 'rejected');
        
        setTimeout(() => {
          setAnalyzedImages(prev => prev.filter(img => img.id !== imageFile.id));
        }, 5000);
        
        return;
      }

      if (step1Data?.response_type === 'not_traffic_related') {
        console.log('🚫 Image rejected - not traffic related');
        
        setAnalyzedImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { 
                ...img, 
                status: 'completed' as const,
                stepAnalysisResponse,
                error: 'Image is not traffic-related'
              } as AnalyzedImage
            : img
        ));

        updateChallanStatus(imageFile.challanId, 'rejected');
        
        setTimeout(() => {
          setAnalyzedImages(prev => prev.filter(img => img.id !== imageFile.id));
        }, 5000);
        
        return;
      }

      // Check for vehicle analysis failures - FIXED: Check step6 instead of step4
      const step6DataForVehicleCheck = stepAnalysisResponse.results.step6?.data;
      console.log('🔍 DEBUGGING STEP6 VEHICLE CHECK (FIXED):');
      console.log('  📋 step6DataForVehicleCheck exists:', !!step6DataForVehicleCheck);
      console.log('  📋 step6DataForVehicleCheck.vehicles_present:', step6DataForVehicleCheck?.vehicles_present);
      console.log('  📋 Condition (!step6DataForVehicleCheck.vehicles_present):', !step6DataForVehicleCheck?.vehicles_present);
      
      if (step6DataForVehicleCheck && !step6DataForVehicleCheck.vehicles_present) {
        console.log('🚫 CRITICAL: Image rejected - no vehicles detected in step6');
        console.log('🚫 CRITICAL: step6DataForVehicleCheck.vehicles_present =', step6DataForVehicleCheck.vehicles_present);
        
        setAnalyzedImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { 
                ...img, 
                status: 'completed' as const,
                stepAnalysisResponse,
                error: 'No vehicles detected in image'
              } as AnalyzedImage
            : img
        ));

        updateChallanStatus(imageFile.challanId, 'rejected');
        
        setTimeout(() => {
          setAnalyzedImages(prev => prev.filter(img => img.id !== imageFile.id));
        }, 5000);
        
        return;
      }

      // Check for license plate extraction failures
      const step2Data = stepAnalysisResponse.results.step2?.data;
      const step3Data = stepAnalysisResponse.results.step3?.data;
      const step6Data = stepAnalysisResponse.results.step6?.data;
      
      // Extract violation data early for use in manual review logic
      const violationAnalysis = step6Data?.violation_analysis;
      const violationTypes = violationAnalysis?.violation_types_found || [];
      const violationCount = violationAnalysis?.detected_violation_count || 0;
      
      // Check multiple sources for license plate
      const licensePlateDetected = step1Data?.extracted_license_plate || 
                                   step2Data?.license_plate || 
                                   step3Data?.license_plate ||
                                   step6Data?.license_plate;
      
      // Check if this is a manual review case (OCR failed but violations detected)
      const requiresManualCorrection = step1Data?.requires_manual_correction || 
                                      step2Data?.requires_manual_correction ||
                                      step3Data?.requires_manual_correction;
      
      console.log('🔍 DEBUGGING LICENSE PLATE DETECTION:');
      console.log('  📋 licensePlateDetected:', licensePlateDetected);
      console.log('  📋 step1Data?.extracted_license_plate:', step1Data?.extracted_license_plate);
      console.log('  📋 step2Data?.license_plate:', step2Data?.license_plate);
      console.log('  📋 step3Data?.license_plate:', step3Data?.license_plate);
      console.log('  📋 step6Data?.license_plate:', step6Data?.license_plate);
      console.log('  🔧 requiresManualCorrection:', requiresManualCorrection);
      console.log('  🔧 step1Data?.requires_manual_correction:', step1Data?.requires_manual_correction);
      console.log('  🔧 step2Data?.requires_manual_correction:', step2Data?.requires_manual_correction);
      console.log('  🔧 step3Data?.requires_manual_correction:', step3Data?.requires_manual_correction);
      console.log('  📊 violationCount:', violationCount);
      console.log('  🚨 violationTypes:', violationTypes);
      console.log('  🔍 step1Data:', step1Data);
      console.log('  🔍 step2Data:', step2Data);
      console.log('  🔍 step3Data:', step3Data);
      console.log('  🔍 step6Data:', step6Data);
      
      if (!licensePlateDetected && !requiresManualCorrection) {
        console.log('🚫 CRITICAL: Image being rejected - no license plate detected and no manual review flag');
        console.log('🚫 CRITICAL: This should NOT happen if backend returned success with license plates!');
        console.log('🚫 CRITICAL: licensePlateDetected =', licensePlateDetected);
        console.log('🚫 CRITICAL: requiresManualCorrection =', requiresManualCorrection);
        
        setAnalyzedImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { 
                ...img, 
                status: 'completed' as const,
                stepAnalysisResponse,
                error: 'No license plate detected'
              } as AnalyzedImage
            : img
        ));

        updateChallanStatus(imageFile.challanId, 'rejected');
        
        setTimeout(() => {
          setAnalyzedImages(prev => prev.filter(img => img.id !== imageFile.id));
        }, 5000);
        
        return;
      }
      
      // Handle manual review case
      if (!licensePlateDetected && requiresManualCorrection) {
        console.log('⚠️ License plate not detected but violations found - proceeding to manual review');
        
        setAnalyzedImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { 
                ...img, 
                status: 'completed' as const,
                stepAnalysisResponse,
                detectedPlateNumber: 'Manual correction required',
                violationCount,
                violationTypes,
                vehicleMatch: false
              } as AnalyzedImage
            : img
        ));

        // Still update challan but as pending review for manual correction
        updateChallanWithStepAnalysis(imageFile.challanId, stepAnalysisResponse);

        // Update queue stats
        setQueueStats(prev => ({ 
          ...prev, 
          completed: prev.completed + 1,
          pending: prev.pending - 1
        }));

        // Auto-remove from local state after 8 seconds
        setTimeout(() => {
          setAnalyzedImages(prev => prev.filter(img => img.id !== imageFile.id));
        }, 8000);
        
        return;
      }

      // Extract simplified results for successfully analyzed images
      const results = stepAnalysisResponse.results;
      const step5Data = results.step5?.data;

      // Extract simplified data
      const detectedPlateNumber = licensePlateDetected;
      const vehicleComparison = step5Data?.comparison_result;
      const vehicleMatch = vehicleComparison?.overall_verdict === 'MATCH';
      
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { 
              ...img, 
              status: 'completed' as const,
              stepAnalysisResponse,
              detectedPlateNumber,
              violationCount,
              violationTypes,
              vehicleMatch
            } as AnalyzedImage
          : img
      ));

      // Update the challan in context with complete analysis results
      updateChallanWithStepAnalysis(imageFile.challanId, stepAnalysisResponse);

      // Update queue stats
      setQueueStats(prev => ({ 
        ...prev, 
        completed: prev.completed + 1,
        pending: prev.pending - 1
      }));

      // Auto-remove from local state after 8 seconds (moved to review queue)
      setTimeout(() => {
        setAnalyzedImages(prev => prev.filter(img => img.id !== imageFile.id));
      }, 8000);

    } catch (error) {
      console.error('💥 Analysis failed:', error);
      
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { 
              ...img, 
              status: 'error',
              error: error instanceof Error ? error.message : 'Analysis failed'
            }
          : img
      ));

      // Throw error to be handled by retry logic
      throw error;
    }
  };

  const processFiles = (files: File[]) => {
    const newImages: AnalyzedImage[] = files.map((file, index) => {
      const challanId = addChallan(file); // Add to global context
    
    return {
        id: Math.random().toString(36).substr(2, 9),
        challanId,
      file,
        preview: URL.createObjectURL(file),
        status: 'queued',
        retryCount: 0,
        maxRetries: 3,
        queuePosition: index + 1
      };
    });

    setAnalyzedImages(prev => [...prev, ...newImages]);

    // Update queue stats
    setQueueStats(prev => ({
      ...prev,
      total: prev.total + newImages.length,
      pending: prev.pending + newImages.length
    }));

    // Start queue processing
    processQueue();
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
      case 'queued':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'analyzing':
        return <div className="animate-pulse"><Eye className="h-5 w-5 text-blue-500" /></div>;
      case 'retrying':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>;
      case 'completed':
        // Check for rejection cases
        if (image.error) {
          return <XCircle className="h-5 w-5 text-red-500" />;
        }
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (image: AnalyzedImage) => {
    if (image.status === 'queued') return `Queued (Position ${image.queuePosition || 1})`;
    if (image.status === 'analyzing') return 'Analyzing image...';
    if (image.status === 'retrying') return `Retrying... (Attempt ${(image.retryCount || 0) + 1}/${image.maxRetries || 3})`;
    if (image.status === 'error') return 'Analysis failed';
    
    if (image.status === 'completed') {
      // Check for different rejection reasons with enhanced categorization
      if (image.error) {
        // Enhanced quality assessment rejections
        if (image.error.includes('Obstructions:')) {
          return 'Rejected → License plate obstructed';
        }
        if (image.error.includes('Glare affecting')) {
          return 'Rejected → Poor lighting/glare on plates';
        }
        if (image.error.includes('Image blur detected')) {
          return 'Rejected → Image too blurry/out of focus';
        }
        if (image.error.includes('too dark') || image.error.includes('too bright')) {
          return 'Rejected → Poor lighting conditions';
        }
        if (image.error.includes('resolution') || image.error.includes('pixelated')) {
          return 'Rejected → Image resolution too low';
        }
        if (image.error.includes('garland') || image.error.includes('decoration') || image.error.includes('sticker')) {
          return 'Rejected → Decorative items blocking plates';
        }
        
        // Legacy rejection reasons
        if (image.error.includes('Image quality too poor')) {
          return 'Rejected → Image quality insufficient';
        }
        if (image.error.includes('not traffic-related')) {
          return 'Rejected → Not a traffic scene';
        }
        if (image.error.includes('No vehicles detected')) {
          return 'Rejected → No vehicles visible';
        }
        if (image.error.includes('No license plate detected')) {
          return 'Rejected → No readable license plates';
        }
        
        // Truncate very long error messages for UI display
        const maxLength = 60;
        const shortError = image.error.length > maxLength 
          ? image.error.substring(0, maxLength) + '...' 
          : image.error;
        
        return 'Rejected → ' + shortError;
      }
      
      const violationCount = image.violationCount || 0;
      
      if (violationCount > 0) {
        const violationText = violationCount === 1 ? 'violation' : 'violations';
        return `${violationCount} ${violationText} detected → Moving to review queue`;
      } else {
        return `Analysis complete → Moving to review queue`;
      }
    }
    
    return 'Unknown';
  };

  const getStatusColor = (image: AnalyzedImage) => {
    switch (image.status) {
      case 'queued':
        return 'bg-gray-100 text-gray-800';
      case 'analyzing':
        return 'bg-yellow-100 text-yellow-800';
      case 'retrying':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        // Check for rejection cases
        if (image.error) {
          return 'bg-red-100 text-red-800';
        }
        
        // All successful analyses go to review queue
        const violationCount = image.violationCount || 0;
        return violationCount > 0 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
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
      'Triple Riding': 'bg-purple-100 text-purple-800',
      'Wrong Side Driving': 'bg-yellow-100 text-yellow-800'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Traffic Violation Detection System</h1>
            <p className="text-gray-600">Upload traffic images for automated AI analysis and violation detection</p>
            
            {/* Backend Status Indicator */}
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                backendStatus === 'online' ? 'bg-green-500' : 
                backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-500">
                AI System: {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking...'}
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

          {/* Queue Status Display */}
          {queueStats.total > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {queueStats.isProcessing ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    ) : queueStats.isPaused ? (
                      <Pause className="h-6 w-6 text-orange-500" />
                    ) : (
                      <Play className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Processing Queue ({queueStats.completed}/{queueStats.total})
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      {queueStats.currentImage ? `Currently processing: ${queueStats.currentImage}` : 
                       queueStats.isPaused ? 'Queue paused' : 
                       queueStats.isProcessing ? 'Processing...' : 'Queue ready'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {queueStats.isProcessing && !queueStats.isPaused ? (
                    <button
                      onClick={pauseQueue}
                      className="inline-flex items-center px-3 py-1 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={resumeQueue}
                      className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </button>
                  )}
                  
                  {queueStats.failed > 0 && (
                    <button
                      onClick={retryFailedImages}
                      className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Retry Failed ({queueStats.failed})
                    </button>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm text-blue-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round((queueStats.completed / queueStats.total) * 100)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((queueStats.completed / queueStats.total) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Backend Offline Warning */}
          {backendStatus === 'offline' && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">AI System Unavailable</h3>
                  <p className="mt-1 text-sm text-red-700">
                    Cannot connect to the AI analysis system. Please check your internet connection or try again later.
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
              Supports JPG, PNG files. Each image will be analyzed for traffic violations using our AI detection system.
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
                      
                      {/* Simplified Analysis Display */}
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

                        {/* Results Summary */}
                        {image.status === 'completed' && (
                          <div className="space-y-3">
                            {/* License Plate */}
                            {image.detectedPlateNumber && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">License Plate:</span>
                                <span className="text-blue-600 font-mono font-medium">{image.detectedPlateNumber}</span>
                              </div>
                            )}

                            {/* Vehicle Match Status */}
                            {image.vehicleMatch !== undefined && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Vehicle Data:</span>
                                <span className={`text-sm font-medium ${
                                  image.vehicleMatch ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {image.vehicleMatch ? 'Verified' : 'Mismatch'}
                                </span>
                              </div>
                            )}

                            {/* Detected Violations */}
                            {image.violationTypes && image.violationTypes.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-gray-600">Violations:</span>
                                {image.violationTypes.map((violation, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getViolationBadge(violation)}`}
                                  >
                                    <ShieldAlert className="w-3 h-3 mr-1" />
                                    {violation}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

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
                    <strong>AI Detection System:</strong> Automated analysis for license plate recognition, vehicle verification, and violation detection including helmet violations, phone usage, and overcrowding.
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