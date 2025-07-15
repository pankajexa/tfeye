import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Calendar, 
  Car, 
  CheckCircle, 
  XCircle, 
  Edit3,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
  Eye,
  Edit,
  Save,
  X,
  RotateCcw,
  Camera
} from 'lucide-react';
import { Challan, useChallanContext } from '../context/ChallanContext';
import ImageZoom from './ImageZoom';
import { apiService } from '../services/api';

interface ChallanCardProps {
  challan: Challan;
  onNext: () => void;
  onPrevious: () => void;
  onAction: (action: 'approve' | 'reject' | 'modify', reason?: string, updatedChallan?: Challan) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isParentReAnalyzing?: boolean;
}

const ChallanCard: React.FC<ChallanCardProps> = ({
  challan,
  onNext,
  onPrevious,
  onAction,
  canGoNext,
  canGoPrevious,
  isParentReAnalyzing = false
}) => {
  const [showRejectOptions, setShowRejectOptions] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Edit functionality state
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState({
    plateNumber: challan.plateNumber || '',
    make: '',
    model: '',
    color: '',
    vehicleType: ''
  });
  const [isReAnalyzing, setIsReAnalyzing] = useState(false);
  
  // Access challan context for direct updates
  const { updateChallanWithStepAnalysis } = useChallanContext();

  const rejectionReasons = [
    'Poor image quality',
    'Number plate not visible',
    'False positive violation',
    'Vehicle not clearly visible',
    'Uncertain violation',
    'AI analysis error',
    'RTA data mismatch',
    'Other'
  ];

  const handleReject = () => {
    if (rejectionReason) {
      onAction('reject', rejectionReason);
      setShowRejectOptions(false);
      setRejectionReason('');
    }
  };

  // Edit functionality handlers
  const startEditing = (field: string, currentValue: string) => {
    console.log('✏️ startEditing called!');
    console.log('  📋 Field:', field);
    console.log('  📋 Current value:', currentValue);
    
    setEditingField(field);
    const fieldKey = field.toLowerCase().replace(' ', '').replace('type', 'Type');
    setEditedValues(prev => ({
      ...prev,
      [fieldKey]: currentValue
    }));
    setIsEditing(true);
    
    console.log('  ✅ Editing state set, fieldKey:', fieldKey);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setIsEditing(false);
    setEditedValues({
      plateNumber: challan.plateNumber || '',
      make: '',
      model: '',
      color: '',
      vehicleType: ''
    });
  };

  const saveEdit = async (field: string) => {
    console.log('🚨 saveEdit function called!');
    console.log('  📋 Field:', field);
    console.log('  📋 isReAnalyzing:', isReAnalyzing);
    console.log('  📋 isParentReAnalyzing:', isParentReAnalyzing);
    console.log('  📋 editedValues:', editedValues);
    
    const fieldKey = field.toLowerCase().replace(' ', '').replace('type', 'Type');
    const newValue = editedValues[fieldKey as keyof typeof editedValues];
    
    console.log('  📋 fieldKey:', fieldKey);
    console.log('  📋 newValue:', newValue);
    
    if (!newValue || newValue.trim() === '') {
      console.log('  ❌ Empty value detected, showing alert');
      alert('Please enter a valid value');
      return;
    }
    
    console.log('  ✅ Value validation passed, proceeding...');

    setIsReAnalyzing(true);
    
    try {
      // If editing license plate, re-run the entire analysis
      if (field === 'License Plate') {
        console.log('🔧 ChallanCard: License plate edit triggered');
        console.log('  📋 Original plate:', challan.plateNumber);
        console.log('  📋 New plate:', newValue);
        console.log('  📋 Cleaned new plate:', newValue.trim().toUpperCase());
        
        // Create updated challan with new plate number
        const updatedChallan = {
          ...challan,
          plateNumber: newValue.trim().toUpperCase()
        };
        
        console.log('  📋 Updated challan plate number:', updatedChallan.plateNumber);
        console.log('  📋 Calling onAction with modify...');
        
        // Reset editing state first (before triggering re-analysis)
        setEditingField(null);
        setIsEditing(false);
        
        // Call onAction to trigger full re-analysis
        onAction('modify', 'License plate corrected - re-analyzing', updatedChallan);
        
        console.log('  ✅ onAction called successfully');
        
        // Return early - don't execute the vehicle details logic below
        return;
        
      } else {
        // For vehicle details, run comparison API with updated data
        console.log(`Re-comparing ${field} with new value:`, newValue);
        
        if (!challan.rtaData) {
          alert('Cannot re-analyze: No RTA data available for comparison');
          return;
        }

        // Create updated AI analysis data with the corrected value
        const currentVehicleAnalysis = challan.vehicleAnalysisData || challan.stepAnalysisResponse?.results?.step4?.data?.vehicle_analysis;
        
        if (!currentVehicleAnalysis) {
          alert('Cannot re-analyze: No vehicle analysis data available');
          return;
        }

        const updatedAiAnalysis = {
          ...currentVehicleAnalysis,
          [field.toLowerCase().replace(' ', '_')]: newValue.trim()
        };

        console.log('Calling comparison API with:', {
          aiAnalysis: updatedAiAnalysis,
          rtaData: challan.rtaData
        });

        // Call the comparison API
        const comparisonResult = await apiService.compareVehicleDetails(updatedAiAnalysis, challan.rtaData);
        
        if (comparisonResult.success && comparisonResult.data) {
          console.log('✅ Comparison completed:', comparisonResult.data);
          
          // Update the challan with new comparison results
          const updatedStepAnalysisResponse = {
            ...challan.stepAnalysisResponse!,
            results: {
              ...challan.stepAnalysisResponse?.results,
              step4: {
                success: true,
                step: 4,
                step_name: 'AI Vehicle Analysis',
                ...challan.stepAnalysisResponse?.results?.step4,
                data: {
                  ...challan.stepAnalysisResponse?.results?.step4?.data,
                  vehicle_analysis: updatedAiAnalysis
                }
              },
              step5: {
                success: true,
                step: 5,
                step_name: 'Vehicle Details Comparison',
                data: comparisonResult.data
              }
            }
          };

          // Update the challan context with new analysis
          updateChallanWithStepAnalysis(challan.id, updatedStepAnalysisResponse);
          
          // Show success message
          alert(`${field} updated successfully! Comparison results refreshed.`);
          
        } else {
          throw new Error(comparisonResult.error || 'Comparison failed');
        }
        
        // Reset editing state for vehicle details
        setEditingField(null);
        setIsEditing(false);
      }
      
    } catch (error) {
      console.error('Failed to re-analyze:', error);
      alert(`Failed to re-analyze: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsReAnalyzing(false);
    }
  };

  // Helper function to create vehicle matches display from Step 5 comparison data
  const createVehicleMatches = () => {
    // Debug logging to understand data structure
    console.log('🔍 ChallanCard DEBUG - Vehicle Matches Data:');
    console.log('  vehicleComparison:', challan.vehicleComparison);
    console.log('  stepAnalysisResponse?.results?.step3:', challan.stepAnalysisResponse?.results?.step3);
    console.log('  stepAnalysisResponse?.results?.step4:', challan.stepAnalysisResponse?.results?.step4);
    console.log('  stepAnalysisResponse?.results?.step5:', challan.stepAnalysisResponse?.results?.step5);
    console.log('  vehicleMatches:', challan.vehicleMatches);
    console.log('  rtaData:', challan.rtaData);

    // Use Step 5 comparison results if available - UPDATED FOR BACKEND STRUCTURE
    if (challan.vehicleComparison?.parameter_analysis) {
      console.log('✅ Using Step 5 comparison data');
      const analysis = challan.vehicleComparison.parameter_analysis as any; // Type assertion for dynamic structure
      
      // Handle backend's actual structure: {ai, rta, match} instead of {ai_value, rta_value, match_status}
      return [
        {
          field: 'Make',
          rtaData: analysis.make_brand?.rta || analysis.make?.rta_value || analysis.make?.rta || 'Not Available',
          aiDetected: analysis.make_brand?.ai || analysis.make?.ai_value || analysis.make?.ai || 'Not Detected', 
          match: analysis.make_brand?.match || (analysis.make?.match_status === 'MATCH') || analysis.make?.match || false
        },
        {
          field: 'Model', 
          rtaData: analysis.model?.rta_value || analysis.model?.rta || 'Not Available',
          aiDetected: analysis.model?.ai_value || analysis.model?.ai || 'Not Detected',
          match: (analysis.model?.match_status === 'MATCH') || analysis.model?.match || false
        },
        {
          field: 'Color',
          rtaData: analysis.color?.rta_value || analysis.color?.rta || 'Not Available',
          aiDetected: analysis.color?.ai_value || analysis.color?.ai || 'Not Detected',
          match: (analysis.color?.match_status === 'MATCH') || analysis.color?.match || false
        },
        {
          field: 'Vehicle Type',
          rtaData: analysis.vehicle_type?.rta_value || analysis.vehicle_type?.rta || 'Not Available',
          aiDetected: analysis.vehicle_type?.ai_value || analysis.vehicle_type?.ai || 'Not Detected',
          match: (analysis.vehicle_type?.match_status === 'MATCH') || analysis.vehicle_type?.match || false
        }
      ];
    }

    // ALSO check Step 5 data directly from stepAnalysisResponse
    const step5Data = challan.stepAnalysisResponse?.results?.step5?.data;
    if (step5Data?.comparison_result?.parameter_analysis) {
      console.log('✅ Using Step 5 data from stepAnalysisResponse');
      const analysis = step5Data.comparison_result.parameter_analysis as any; // Type assertion for dynamic structure
      
      return [
        {
          field: 'Make',
          rtaData: analysis.make_brand?.rta || analysis.make?.rta || 'Not Available',
          aiDetected: analysis.make_brand?.ai || analysis.make?.ai || 'Not Detected',
          match: analysis.make_brand?.match || analysis.make?.match || false
        },
        {
          field: 'Model',
          rtaData: analysis.model?.rta || 'Not Available', 
          aiDetected: analysis.model?.ai || 'Not Detected',
          match: analysis.model?.match || false
        },
        {
          field: 'Color',
          rtaData: analysis.color?.rta || 'Not Available',
          aiDetected: analysis.color?.ai || 'Not Detected',
          match: analysis.color?.match || false
        },
        {
          field: 'Vehicle Type',
          rtaData: analysis.vehicle_type?.rta || 'Not Available',
          aiDetected: analysis.vehicle_type?.ai || 'Not Detected',
          match: analysis.vehicle_type?.match || false
        }
      ];
    }

    // Fallback to Step 3 RTA data + Step 4 AI analysis if Step 5 comparison isn't available
    const step3Data = challan.stepAnalysisResponse?.results?.step3?.data;
    const step4Data = challan.stepAnalysisResponse?.results?.step4?.data;
    
    if (step3Data?.rta_data && step4Data?.rta_data) {
      console.log('✅ Using Step 3 RTA + Step 4 RTA data');
      const rtaData = step4Data.rta_data; // Step 4 contains the RTA lookup result
      const step5Visual = step5Data?.visual_analysis; // Step 5 contains AI analysis
      
      return [
        {
          field: 'Make',
          rtaData: rtaData.make || 'Not Available',
          aiDetected: step5Visual?.make_brand || 'Not Detected',
          match: false // No comparison done yet
        },
        {
          field: 'Model', 
          rtaData: rtaData.model || 'Not Available',
          aiDetected: step5Visual?.model || 'Not Detected',
          match: false
        },
        {
          field: 'Color',
          rtaData: rtaData.color || 'Not Available',
          aiDetected: step5Visual?.color || 'Not Detected',
          match: false
        },
        {
          field: 'Vehicle Type',
          rtaData: rtaData.vehicleClass || 'Not Available',
          aiDetected: step5Visual?.vehicle_type || 'Not Detected',
          match: false
        }
      ];
    }

    // Fallback to legacy vehicle matches
    if (challan.vehicleMatches && challan.vehicleMatches.length > 0) {
      console.log('✅ Using legacy vehicle matches');
      return challan.vehicleMatches;
    }

    // Final fallback: Show RTA data status
    console.log('⚠️ Using final fallback - no data available');
    const hasRTAData = challan.rtaData || (challan.stepAnalysisResponse?.results?.step3?.success);
    const rtaDataStatus = hasRTAData ? 'Analysis Pending' : 'RTA Data Not Found';
    
    return [
      {
        field: 'Make',
        rtaData: rtaDataStatus,
        aiDetected: challan.vehicleDetails?.make || 'Not Analyzed',
        match: false
      },
      {
        field: 'Model', 
        rtaData: rtaDataStatus,
        aiDetected: challan.vehicleDetails?.model || 'Not Analyzed',
        match: false
      },
      {
        field: 'Color',
        rtaData: rtaDataStatus,
        aiDetected: challan.vehicleDetails?.color || 'Not Analyzed',
        match: false
      }
    ];
  };

  const vehicleMatches = createVehicleMatches();

  // Get violation badge color
  const getViolationBadge = (violationType: string) => {
    const colors = {
      'No Helmet': 'bg-red-100 text-red-800 border-red-200',
      'Cell Phone Driving': 'bg-orange-100 text-orange-800 border-orange-200',
      'Triple Riding': 'bg-purple-100 text-purple-800 border-purple-200',
      'Wrong Side Driving': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return colors[violationType as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Challan {challan.id}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Image Preview with Zoom */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Violation Image
          </h4>
          <div className="h-96">
            <ImageZoom
              src={challan.preview || challan.image}
              alt="Traffic violation"
              plateNumber={challan.plateNumber}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Officer Details */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Sector Officer Details
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">PS Name:</span>
                    <p className="text-gray-900">{challan.sectorOfficer?.psName || 'Punjagutta Tr PS'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Cadre:</span>
                    <p className="text-gray-900">{challan.sectorOfficer?.cadre || 'CI1'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900">{challan.sectorOfficer?.name || 'Ravinder Rao'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Image Captured By
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium text-gray-600">Cadre:</span>
                    <p className="text-gray-900">{challan.capturedBy?.cadre || 'Police Constable'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900">{challan.capturedBy?.name || 'Chaitanya'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                PS Jurisdiction
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium text-gray-600">PS Name:</span>
                    <p className="text-gray-900">{challan.jurisdiction?.psName || 'Punjagutta Traffic PS'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Point Name:</span>
                    <p className="text-gray-900">{challan.jurisdiction?.pointName || 'Vengal Rao Park junction'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Offence Date & Time
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Date:</span>
                    <p className="text-gray-900">{challan.offenceDateTime?.date || new Date(challan.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Time:</span>
                    <p className="text-gray-900">{challan.offenceDateTime?.time || new Date(challan.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                
                {/* Timestamp Source Indicator */}
                {challan.stepAnalysisResponse?.results?.step1?.data?.timestamp_extraction ? (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    {challan.stepAnalysisResponse.results.step1.data.timestamp_extraction.timestamp_found ? (
                      <div className="flex items-center text-xs text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>Extracted from image timestamp</span>
                        <span className="ml-2 text-gray-500">
                          ({challan.stepAnalysisResponse.results.step1.data.timestamp_extraction.timestamp_location})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Using upload time (no embedded timestamp found)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Using upload time</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Editable License Plate Display */}
            {(() => {
              if (challan.plateNumber) {
                console.log('🏷️ License plate section rendered:', challan.plateNumber);
                console.log('  📋 editingField:', editingField);
                console.log('  📋 isEditing:', isEditing);
              }
              return null;
            })()}
            {challan.plateNumber && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  License Plate
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {(() => {
                    console.log('🔍 Render check: editingField === "License Plate"?', editingField === 'License Plate');
                    console.log('  📋 editingField value:', editingField);
                    return null;
                  })()}
                  {editingField === 'License Plate' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editedValues.plateNumber}
                        onChange={(e) => setEditedValues(prev => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter license plate"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          console.log('🖱️ Save button clicked!');
                          console.log('  📋 Button disabled?', isReAnalyzing || isParentReAnalyzing);
                          console.log('  📋 isReAnalyzing:', isReAnalyzing);
                          console.log('  📋 isParentReAnalyzing:', isParentReAnalyzing);
                          saveEdit('License Plate');
                        }}
                        disabled={isReAnalyzing || isParentReAnalyzing}
                        className="inline-flex items-center p-2 border border-green-300 rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                        title={isReAnalyzing || isParentReAnalyzing ? 'Re-analysis in progress...' : 'Save license plate changes'}
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 font-mono font-medium text-lg">{challan.plateNumber}</span>
                      <button
                        onClick={() => {
                          console.log('✏️ Edit button clicked!');
                          console.log('  📋 Current plate:', challan.plateNumber);
                          console.log('  📋 Button disabled?', isReAnalyzing || isParentReAnalyzing);
                          startEditing('License Plate', challan.plateNumber || '');
                        }}
                        disabled={isReAnalyzing || isParentReAnalyzing}
                        className="inline-flex items-center p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                        title="Edit license plate"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {(isReAnalyzing || isParentReAnalyzing) && (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <RotateCcw className="h-4 w-4 mr-1 animate-spin" />
                      {isParentReAnalyzing ? 'Re-analyzing with corrected license plate...' : 'Re-analyzing with updated data...'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editable Vehicle & RTA Matching */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <Car className="h-4 w-4 mr-2" />
              Vehicle & RTA Data
              <span className="ml-2 text-xs text-gray-500">(Click <Edit className="inline h-3 w-3" /> to edit detected values)</span>
            </h4>
            {challan.vehicleComparison && (
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  challan.vehicleComparison.overall_verdict === 'MATCH' ? 'bg-green-100 text-green-800' :
                  challan.vehicleComparison.overall_verdict === 'PARTIAL_MATCH' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {challan.vehicleComparison.overall_verdict === 'MATCH' ? 'Verified' :
                   challan.vehicleComparison.overall_verdict === 'PARTIAL_MATCH' ? 'Partial Match' : 'Mismatch'}
                </span>
              </div>
            )}
          </div>
          
          {/* Edit functionality info */}
          {!isEditing && !isReAnalyzing && !isParentReAnalyzing && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <Edit className="h-4 w-4 text-blue-500 mr-2" />
                <p className="text-sm text-blue-700">
                  You can edit license plate and vehicle details to correct AI detection mistakes. 
                  Changes will trigger re-analysis for accurate results.
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RTA Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicleMatches.map((match, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {match.field}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {match.rtaData}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {editingField === match.field ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editedValues[match.field.toLowerCase().replace(' ', '').replace('type', 'Type') as keyof typeof editedValues]}
                            onChange={(e) => setEditedValues(prev => ({ 
                              ...prev, 
                              [match.field.toLowerCase().replace(' ', '').replace('type', 'Type')]: e.target.value 
                            }))}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Enter ${match.field.toLowerCase()}`}
                            autoFocus
                          />
                        </div>
                      ) : (
                        match.aiDetected
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {match.match ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingField === match.field ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => saveEdit(match.field)}
                            disabled={isReAnalyzing || isParentReAnalyzing}
                            className="inline-flex items-center p-1 border border-green-300 rounded text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
                            title="Save changes"
                          >
                            <Save className="h-3 w-3" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="inline-flex items-center p-1 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                            title="Cancel"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(match.field, match.aiDetected)}
                          disabled={isReAnalyzing || isParentReAnalyzing || match.aiDetected === 'Not Detected' || match.aiDetected === 'Not Analyzed' || match.rtaData === 'RTA Data Not Found'}
                          className="inline-flex items-center p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={match.aiDetected === 'Not Detected' ? 'No data to edit' : 'Edit detected value'}
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simplified Status */}
          {challan.vehicleComparison ? (
            <div className="text-center">
              <span className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                challan.vehicleComparison.overall_verdict === 'MATCH' ? 'bg-green-100 text-green-800' :
                challan.vehicleComparison.overall_verdict === 'PARTIAL_MATCH' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {challan.vehicleComparison.overall_verdict === 'MATCH' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Data Verified
                  </>
                ) : challan.vehicleComparison.overall_verdict === 'PARTIAL_MATCH' ? (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Partial Match
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Data Mismatch
                  </>
                )}
              </span>
            </div>
          ) : challan.rtaVerification ? (
            <div className="text-center">
              <span className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                RTA Verified
              </span>
            </div>
          ) : (
            <div className="text-center">
              <span className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-600">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {challan.rtaData || (challan.stepAnalysisResponse?.results?.step3?.success) ? 'Verification Pending' : 'RTA Data Not Found'}
              </span>
            </div>
          )}
        </div>

        {/* Simplified Violation Analysis - Moved to Bottom */}
        {(challan.violationAnalysis || challan.violations.length > 0) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Violation Analysis
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              {/* Violation Status */}
              <div>
                <span className="text-sm font-medium text-gray-600">Violation Status:</span>
                <div className="mt-1">
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    (challan.violationAnalysis?.overall_assessment?.total_violations || challan.violations.length) > 0 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {challan.violationAnalysis?.overall_assessment?.total_violations 
                      ? `${challan.violationAnalysis.overall_assessment.total_violations} Violation(s) Detected`
                      : challan.violations.length > 0 
                        ? `${challan.violations.length} Violation(s) Detected`
                        : 'No Violations Detected'
                    }
                  </span>
                </div>
              </div>

              {/* Violations Found */}
              {challan.violationAnalysis?.violations_detected?.some(v => v.detected) ? (
                <div>
                  <span className="text-sm font-medium text-gray-600">Violations Found:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {challan.violationAnalysis.violations_detected
                      .filter(violation => violation.detected)
                      .map((violation, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getViolationBadge(violation.violation_type)}`}
                        >
                          <ShieldAlert className="w-4 h-4 mr-1" />
                          {violation.violation_type}
                        </span>
                      ))}
                  </div>
                </div>
              ) : challan.violations.length > 0 ? (
                <div>
                  <span className="text-sm font-medium text-gray-600">Violations Found:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {challan.violations.map((violation, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getViolationBadge(violation)}`}
                      >
                        <ShieldAlert className="w-4 h-4 mr-1" />
                        {violation}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Analysis Timestamp */}
              <div>
                <span className="text-sm font-medium text-gray-600">Analysis Timestamp:</span>
                <p className="text-sm text-gray-900 mt-1">{new Date(challan.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-gray-200 pt-6">
          {!showRejectOptions ? (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onAction('approve')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </button>

              <button
                onClick={() => setShowRejectOptions(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </button>

              <button
                disabled
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Modify (Coming Soon)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select rejection reason:
                </label>
                <div className="space-y-2">
                  {rejectionReasons.map((reason) => (
                    <label key={reason} className="flex items-center">
                      <input
                        type="radio"
                        name="rejectionReason"
                        value={reason}
                        checked={rejectionReason === reason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Reject
                </button>
                <button
                  onClick={() => setShowRejectOptions(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallanCard;