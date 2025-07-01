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

  const analyzeImageWithGemini = async (imageFile: AnalyzedImage) => {
    try {
      console.log('🔍 Starting Gemini analysis for:', imageFile.file.name);
      
      // Update status to analyzing
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { ...img, status: 'analyzing' }
          : img
      ));

      // Update challan status to processing
      updateChallanStatus(imageFile.challanId, 'processing');

      // Call Gemini API
      const analysis = await apiService.analyzeImage(imageFile.file);
      
      console.log('✅ Gemini analysis completed:', analysis);

      // Update with results
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { 
              ...img, 
              status: 'completed', 
              analysis,
              error: undefined
            }
          : img
      ));

      // Update the challan in context with analysis results
      updateChallanWithAnalysis(imageFile.challanId, analysis);

      // Auto-remove from local state after 3 seconds (moved to review queue)
      setTimeout(() => {
        setAnalyzedImages(prev => prev.filter(img => img.id !== imageFile.id));
      }, 3000);

    } catch (error) {
      console.error('💥 Gemini analysis failed:', error);
      
      setAnalyzedImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { 
              ...img, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Analysis failed',
              analysis: undefined
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
        status: 'uploading'
      };
    });

    setAnalyzedImages(prev => [...prev, ...newImages]);

    // Start analysis for each image
    newImages.forEach(imageFile => {
      setTimeout(() => analyzeImageWithGemini(imageFile), 500);
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

  const getStatusText = (image: AnalyzedImage) => {
    switch (image.status) {
      case 'uploading':
        return 'Uploading...';
      case 'analyzing':
        return 'Analyzing with AI...';
      case 'completed':
        const violationCount = image.analysis?.gemini_analysis.violations.length || 0;
        return violationCount > 0 ? 
          `${violationCount} violation(s) detected → Moving to review` : 
          'No violations → Auto-approved';
      case 'error':
        return `Error: ${image.error}`;
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
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Image Preview */}
                      <div className="flex-shrink-0">
                        <img
                          src={image.preview}
                          alt="Traffic image"
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </div>
                      
                      {/* Analysis Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
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

                        {/* Error Message */}
                        {image.error && (
                          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                            {image.error}
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
                    Completed analyses automatically move to "Review Challans" tab for officer review.
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