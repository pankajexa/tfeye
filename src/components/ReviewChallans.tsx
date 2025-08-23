import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Edit3, Check, X } from 'lucide-react';
import { useChallanContext } from '../context/ChallanContext';
import { useAuth } from '../context/AuthContext';
import ModifyModal from './ModifyModal';
import RejectModal from './RejectModal';

const ReviewChallans: React.FC = () => {
  const { getChallansByStatus, approveChallan, rejectChallan } = useChallanContext();
  const { currentOfficer } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Violation data with section codes and fine amounts
  const violationData: { [key: string]: { sectionCode: string; fine: number } } = {
    'Triple Riding': { sectionCode: 'S 128/177, 184', fine: 1200 },
    'Cell Phone Driving': { sectionCode: 'S 184', fine: 1000 },
    'Mobile Phone Usage': { sectionCode: 'S 184', fine: 1000 }, // Alternative name
    'Not wearing helmet': { sectionCode: 'S 129/177', fine: 100 },
    'No Helmet': { sectionCode: 'S 129/177', fine: 100 } // Alternative name
  };

  // Function to calculate fine amount based on violations
  const calculateFineAmount = (violations: string[]): number => {
    if (violations.length === 0) {
      return 100; // Default fine for Not wearing helmet
    }

    return violations.reduce((total, violation) => {
      return total + (violationData[violation]?.fine || 100);
    }, 0);
  };

  // Function to get violation details
  const getViolationDetails = (violation: string) => {
    return violationData[violation] || { sectionCode: 'N/A', fine: 100 };
  };

  // Intelligent RTA matching functions
  const normalizeString = (str: string): string => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;
    
    const norm1 = normalizeString(str1);
    const norm2 = normalizeString(str2);
    
    if (norm1 === norm2) return 1;
    
    // Check if one string contains the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
    
    // Calculate Levenshtein distance for similarity
    const matrix = Array(norm2.length + 1).fill(null).map(() => Array(norm1.length + 1).fill(null));
    
    for (let i = 0; i <= norm1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= norm2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= norm2.length; j++) {
      for (let i = 1; i <= norm1.length; i++) {
        const cost = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }
    
    const maxLength = Math.max(norm1.length, norm2.length);
    return maxLength === 0 ? 1 : 1 - (matrix[norm2.length][norm1.length] / maxLength);
  };

  const isColorMatch = (color1: string, color2: string): boolean => {
    if (!color1 || !color2) return false;
    
    const colorMapping: { [key: string]: string[] } = {
      'black': ['black', 'dark', 'charcoal', 'ebony'],
      'white': ['white', 'pearl', 'ivory', 'cream'],
      'red': ['red', 'crimson', 'maroon', 'cherry'],
      'blue': ['blue', 'navy', 'azure', 'cobalt'],
      'green': ['green', 'emerald', 'olive', 'forest'],
      'yellow': ['yellow', 'golden', 'amber', 'lemon'],
      'orange': ['orange', 'tangerine', 'coral'],
      'silver': ['silver', 'grey', 'gray', 'metallic'],
      'brown': ['brown', 'bronze', 'copper', 'tan']
    };
    
    const norm1 = normalizeString(color1);
    const norm2 = normalizeString(color2);
    
    // Check exact match
    if (norm1 === norm2) return true;
    
    // Check color family mapping
    for (const [, variants] of Object.entries(colorMapping)) {
      const in1 = variants.some(variant => norm1.includes(variant));
      const in2 = variants.some(variant => norm2.includes(variant));
      if (in1 && in2) return true;
    }
    
    // Check string similarity
    const similarity = calculateSimilarity(color1, color2);
    return similarity > 0.6;
  };

  const isModelMatch = (model1: string, model2: string): boolean => {
    if (!model1 || !model2) return false;
    
    const norm1 = normalizeString(model1);
    const norm2 = normalizeString(model2);
    
    // Exact match
    if (norm1 === norm2) return true;
    
    // Check if one contains the other (for versions like "Activa 6G" vs "Activa")
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return true;
    }
    
    // Check for common model patterns
    const modelPatterns = [
      { pattern: /activa/g, matches: ['activa', 'active'] },
      { pattern: /swift/g, matches: ['swift', 'swft'] },
      { pattern: /city/g, matches: ['city', 'civic'] }
    ];
    
    for (const { matches } of modelPatterns) {
      const in1 = matches.some(match => norm1.includes(match));
      const in2 = matches.some(match => norm2.includes(match));
      if (in1 && in2) return true;
    }
    
    const similarity = calculateSimilarity(model1, model2);
    return similarity > 0.7;
  };

  const isMakeMatch = (make1: string, make2: string): boolean => {
    if (!make1 || !make2) return false;
    
    const norm1 = normalizeString(make1);
    const norm2 = normalizeString(make2);
    
    // Exact match
    if (norm1 === norm2) return true;
    
    // Common make variations
    const makeMapping: { [key: string]: string[] } = {
      'honda': ['honda', 'hnd'],
      'bajaj': ['bajaj', 'baj', 'bajj'],
      'hero': ['hero', 'her'],
      'tvs': ['tvs', 'tv'],
      'yamaha': ['yamaha', 'yam', 'ymh'],
      'suzuki': ['suzuki', 'suz'],
      'maruti': ['maruti', 'marutisuzuki', 'msil']
    };
    
    for (const [, variants] of Object.entries(makeMapping)) {
      const in1 = variants.some(variant => norm1.includes(variant));
      const in2 = variants.some(variant => norm2.includes(variant));
      if (in1 && in2) return true;
    }
    
    const similarity = calculateSimilarity(make1, make2);
    return similarity > 0.8;
  };

  // Generate intelligent vehicle matches using real backend data
  const generateVehicleMatches = () => {
    // First check Step 5 vehicleMatches (already processed comparison)
    if (currentChallan.vehicleMatches && currentChallan.vehicleMatches.length > 0) {
      return currentChallan.vehicleMatches.map(match => ({
        field: match.field,
        rtaData: match.rtaData,
        aiDetected: match.aiDetected,
        match: match.match
      }));
    }

    // Extract RTA data from Step 3/4/6 and AI data from Step 2/4/5/6
    const step2Data = currentChallan.stepAnalysisResponse?.results?.step2?.data;
    const step3Data = currentChallan.stepAnalysisResponse?.results?.step3?.data;
    const step4Data = currentChallan.stepAnalysisResponse?.results?.step4?.data;
    const step5Data = currentChallan.stepAnalysisResponse?.results?.step5?.data;
    const step6Data = currentChallan.stepAnalysisResponse?.results?.step6?.data;
    
    const rtaData = step4Data?.rta_data || step3Data?.rta_data || step6Data?.rta_data || currentChallan.rtaData;
    
    // Check multiple sources for AI vehicle analysis data
    // Priority: Legacy vehicleDetails (what was working before) > Step analysis data
    const aiData = currentChallan.vehicleDetails ||  // This was working perfectly before!
                   step5Data?.vehicle_analysis || 
                   step6Data?.vehicle_analysis || 
                   step2Data?.primary_violating_vehicle ||  // Step 2 has primary vehicle analysis
                   // Legacy Gemini analysis support (fallback)
                   (currentChallan.geminiAnalysis?.gemini_analysis?.vehicle_details ? {
                     make: currentChallan.geminiAnalysis.gemini_analysis.vehicle_details.make,
                     model: currentChallan.geminiAnalysis.gemini_analysis.vehicle_details.model,
                     color: currentChallan.geminiAnalysis.gemini_analysis.vehicle_details.color,
                     vehicle_type: currentChallan.geminiAnalysis.gemini_analysis.vehicle_details.vehicle_type
                   } : null);
    
    // If no RTA or AI data available, return empty
    if (!rtaData || !aiData) {
      return [];
    }
    
    // Create matches for available data fields
    const matches = [];
    
    // Make comparison
    if (rtaData?.make || rtaData?.makerName) {
      const rtaMake = rtaData?.make || rtaData?.makerName;
      const aiMake = aiData?.make;
      const makeMatch = isMakeMatch(rtaMake, aiMake);
      matches.push({
        field: 'Make',
        rtaData: rtaMake,
        aiDetected: aiMake || 'Not Detected',
        match: makeMatch
      });
    }
    
    // Model comparison
    if (rtaData?.model || rtaData?.makerModel) {
      const rtaModel = rtaData?.model || rtaData?.makerModel;
      const aiModel = aiData?.model;
      const modelMatch = isModelMatch(rtaModel, aiModel);
      matches.push({
        field: 'Model',
        rtaData: rtaModel,
        aiDetected: aiModel || 'Not Detected',
        match: modelMatch
      });
    }
    
    // Color comparison
    if (rtaData?.color) {
      const rtaColor = rtaData?.color;
      const aiColor = aiData?.color;
      const colorMatch = isColorMatch(rtaColor, aiColor);
      matches.push({
        field: 'Color',
        rtaData: rtaColor,
        aiDetected: aiColor || 'Not Detected',
        match: colorMatch
      });
    }
    
    return matches;
  };

  // Calculate overall RTA match status
  const calculateOverallMatch = (matches: any[]) => {
    if (matches.length === 0) return false;
    
    const matchCount = matches.filter(match => match.match).length;
    const matchPercentage = matchCount / matches.length;
    
    // Consider it a match if 2 out of 3 fields match
    return matchPercentage >= 0.67;
  };

  // Get only pending review challans
  const pendingChallans = getChallansByStatus('pending-review');
  const currentChallan = pendingChallans[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < pendingChallans.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleApprove = () => {
    if (currentChallan && currentOfficer) {
      approveChallan(currentChallan.id, currentOfficer.name);
      // Move to next challan or stay at current index if it was the last one
      if (currentIndex >= pendingChallans.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  const handleReject = (reason: string) => {
    if (currentChallan && currentOfficer) {
      rejectChallan(currentChallan.id, reason, currentOfficer.name);
      // Move to next challan or stay at current index if it was the last one
      if (currentIndex >= pendingChallans.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  if (pendingChallans.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg font-medium">No challans pending review</p>
            <p className="text-sm mt-2">All submitted challans have been processed</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentChallan) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Challan Review ({currentIndex + 1} of {pendingChallans.length})
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
              <button
              onClick={handleNext}
              disabled={currentIndex === pendingChallans.length - 1}
              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
              </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left side - Image */}
        <div className="lg:w-1/2 p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Traffic Violation Image</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowImageZoom(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={currentChallan.image}
                  alt="Traffic violation"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Details */}
        <div className="lg:w-1/2 p-6 space-y-6">
          {/* Section Officer Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Section Officer Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">PS Name</p>
                <p className="text-sm text-gray-900">{currentChallan.sectorOfficer.psName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Cadre</p>
                <p className="text-sm text-gray-900">{currentChallan.sectorOfficer.cadre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Officer Name</p>
                <p className="text-sm text-gray-900">{currentChallan.sectorOfficer.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Point Name</p>
                <p className="text-sm text-gray-900">{currentChallan.jurisdiction.pointName}</p>
              </div>
            </div>
          </div>

          {/* Image Captured By */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Image Captured By</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm text-gray-900">{currentChallan.capturedBy.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Cadre</p>
                <p className="text-sm text-gray-900">{currentChallan.capturedBy.cadre}</p>
              </div>
            </div>
          </div>

          {/* PS Jurisdiction */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">PS Jurisdiction</h3>
            <p className="text-sm text-gray-900">{currentChallan.jurisdiction.psName}</p>
          </div>

          {/* Offence Date & Time */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Offence Date & Time</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Date</p>
                <p className="text-sm text-gray-900">{currentChallan.offenceDateTime.date}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Time</p>
                <p className="text-sm text-gray-900">{currentChallan.offenceDateTime.time}</p>
              </div>
            </div>
          </div>

          {/* Number Plate Detection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Number Plate Detection</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Detected Number Plate</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{currentChallan.plateNumber || 'Not Detected'}</p>
              </div>
              
              {/* RTA vs AI Comparison */}
              <div className="border-t pt-4">
                                <h4 className="text-md font-medium text-gray-900 mb-3">RTA Data vs AI Detection Comparison</h4>
                {(() => {
                  // Extract data from backend steps
                  const step2Data = currentChallan.stepAnalysisResponse?.results?.step2?.data;
                  const step3Data = currentChallan.stepAnalysisResponse?.results?.step3?.data;
                  const step4Data = currentChallan.stepAnalysisResponse?.results?.step4?.data;
                  const step5Data = currentChallan.stepAnalysisResponse?.results?.step5?.data;
                  const step6Data = currentChallan.stepAnalysisResponse?.results?.step6?.data;
                  
                  // Get RTA data from Step 3/4/6
                  const rtaData = step4Data?.rta_data || step3Data?.rta_data || step6Data?.rta_data || currentChallan.rtaData;
                  
                  // Get AI vehicle analysis from legacy vehicleDetails (what was working before) or fallback
                  const aiData = currentChallan.vehicleDetails ||  // This was working perfectly before!
                                 step5Data?.vehicle_analysis || 
                                 step6Data?.vehicle_analysis || 
                                 step2Data?.primary_violating_vehicle ||  // Step 2 has primary vehicle analysis
                                 // Legacy Gemini analysis support (fallback)
                                 (currentChallan.geminiAnalysis?.gemini_analysis?.vehicle_details ? {
                                   make: currentChallan.geminiAnalysis.gemini_analysis.vehicle_details.make,
                                   model: currentChallan.geminiAnalysis.gemini_analysis.vehicle_details.model,
                                   color: currentChallan.geminiAnalysis.gemini_analysis.vehicle_details.color,
                                   vehicle_type: currentChallan.geminiAnalysis.gemini_analysis.vehicle_details.vehicle_type,
                                   analysis_confidence: currentChallan.geminiAnalysis.gemini_analysis.vehicle_details.confidence_scores?.make?.score
                                 } : null);
                  
                  if (!rtaData && !aiData) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No vehicle analysis data available</p>
                        <p className="text-xs text-gray-400 mt-1">Vehicle data will appear here after AI processing is complete</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">RTA Data:</p>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700">Maker Name: <span className="font-medium">{rtaData?.make || rtaData?.makerName || 'Not Available'}</span></p>
                          <p className="text-sm text-gray-700">Maker Model: <span className="font-medium">{rtaData?.model || rtaData?.makerModel || 'Not Available'}</span></p>
                          <p className="text-sm text-gray-700">Color: <span className="font-medium">{rtaData?.color || 'Not Available'}</span></p>
                          <p className="text-sm text-gray-700">Vehicle Class: <span className="font-medium">{rtaData?.vehicleClass || 'Not Available'}</span></p>
                          <p className="text-sm text-gray-700">Owner Name: <span className="font-medium">{rtaData?.ownerName || 'Not Available'}</span></p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">AI Detection:</p>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700">Maker Name: <span className="font-medium">{aiData?.make || 'Not Detected'}</span></p>
                          <p className="text-sm text-gray-700">Maker Model: <span className="font-medium">{aiData?.model || 'Not Detected'}</span></p>
                          <p className="text-sm text-gray-700">Color: <span className="font-medium">{aiData?.color || 'Not Detected'}</span></p>
                          <p className="text-sm text-gray-700">Vehicle Type: <span className="font-medium">{aiData?.vehicle_type || aiData?.vehicleType || 'Not Detected'}</span></p>
                          <p className="text-sm text-gray-700">Analysis Confidence: <span className="font-medium">{aiData?.analysis_confidence || (aiData?.confidence?.make ? `${aiData.confidence.make}%` : 'Not Available')}</span></p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Intelligent Vehicle Matches Table */}
                {(() => {
                  const intelligentMatches = generateVehicleMatches();
                  
                  if (intelligentMatches.length === 0) {
                    return (
                      <div className="mt-4 text-center py-4">
                        <p className="text-sm text-gray-500">No vehicle comparison data available</p>
                        <p className="text-xs text-gray-400 mt-1">Comparison results will appear here after backend analysis</p>
                      </div>
                    );
                  }
                  
                  const overallMatch = calculateOverallMatch(intelligentMatches);
                  
                  return (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Vehicle Matching Results: 
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          overallMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {overallMatch ? 'Overall Match' : 'Overall Mismatch'}
                        </span>
                      </h5>
                      <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RTA Data</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Detected</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {intelligentMatches.map((match, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{match.field}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{match.rtaData}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{match.aiDetected}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    match.match 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {match.match ? '✓ Match' : '✗ Mismatch'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4">
                  {(() => {
                    const intelligentMatches = generateVehicleMatches();
                    
                    if (intelligentMatches.length === 0) {
                      return (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          No Comparison Data
                        </span>
                      );
                    }
                    
                    const overallMatch = calculateOverallMatch(intelligentMatches);
                    const matchCount = intelligentMatches.filter(m => m.match).length;
                    
                    return (
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          overallMatch 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {overallMatch ? '✓ RTA Match' : '✗ RTA Mismatch'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {matchCount}/{intelligentMatches.length} fields matched
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Violations Identified */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Violations Identified</h3>
            <div className="space-y-3">
              {currentChallan.violations.length > 0 ? (
                currentChallan.violations.map((violation, index) => {
                  const details = getViolationDetails(violation);
                  return (
                    <div key={index} className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mb-2">
                            {violation}
                          </span>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p><span className="font-medium">Section Code:</span> {details.sectionCode}</p>
                            <p><span className="font-medium">Fine Amount:</span> ₹{details.fine.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mb-2">
                        Not wearing helmet
                      </span>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p><span className="font-medium">Section Code:</span> S 129/177</p>
                        <p><span className="font-medium">Fine Amount:</span> ₹100</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-lg font-semibold text-gray-900">
                Total Fine Amount: <span className="text-green-600">₹{calculateFineAmount(currentChallan.violations).toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowModifyModal(true)}
            className="flex items-center px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Modify
          </button>
          <button
            onClick={handleApprove}
            className="flex items-center px-6 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Check className="h-4 w-4 mr-2" />
            Approve
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center px-6 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </button>
        </div>
      </div>

      {/* Modals */}
      {showImageZoom && currentChallan && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowImageZoom(false)}>
          <div className="relative max-w-4xl max-h-screen p-4">
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={currentChallan.image}
              alt="Traffic violation"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {showModifyModal && currentChallan && (
        <ModifyModal
          isOpen={showModifyModal}
          challan={currentChallan}
          onClose={() => setShowModifyModal(false)}
          onSave={() => setShowModifyModal(false)}
        />
      )}

      {showRejectModal && (
        <RejectModal
          isOpen={showRejectModal}
          challanId={currentChallan?.id || ''}
          onReject={handleReject}
          onClose={() => setShowRejectModal(false)}
        />
      )}
    </div>
  );
};

export default ReviewChallans;