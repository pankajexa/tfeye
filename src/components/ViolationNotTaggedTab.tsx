import React from 'react';
import { useChallanContext } from '../context/ChallanContext';
import ChallanCard from './ChallanCard';
import { AlertTriangle, Camera, Search, FileX } from 'lucide-react';

const ViolationNotTaggedTab: React.FC = () => {
  const { challans, getChallansByStatus, updateChallanWithStepAnalysis } = useChallanContext();
  const violationNotTaggedChallans = getChallansByStatus('violation-not-tagged');

  const handleAction = (action: string, reason?: string, updatedChallan?: any) => {
    if (action === 'approve' && updatedChallan) {
      // Move to approved with manual review flag
      updateChallanWithStepAnalysis(updatedChallan.id, {
        ...updatedChallan,
        status: 'approved',
        reviewedBy: 'Manual Review - No AI Violations',
        reviewTimestamp: new Date().toLocaleString()
      });
    } else if (action === 'reject' && updatedChallan && reason) {
      // Move to rejected
      updateChallanWithStepAnalysis(updatedChallan.id, {
        ...updatedChallan,
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: 'Manual Review',
        reviewTimestamp: new Date().toLocaleString()
      });
    } else if (action === 'modify' && updatedChallan) {
      // Keep in violation-not-tagged but update data
      updateChallanWithStepAnalysis(updatedChallan.id, {
        ...updatedChallan,
        status: 'violation-not-tagged',
        reviewedBy: 'Manual Modification',
        reviewTimestamp: new Date().toLocaleString()
      });
    } else if (action === 'tag-violation' && updatedChallan) {
      // Move to pending-review after manual violation tagging
      updateChallanWithStepAnalysis(updatedChallan.id, {
        ...updatedChallan,
        status: 'pending-review',
        reviewedBy: 'Manual Violation Tagging',
        reviewTimestamp: new Date().toLocaleString()
      });
    }
  };

  const currentIndex = 0; // For single challan view
  const currentChallan = violationNotTaggedChallans[currentIndex];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Violation Not Tagged</h2>
            <p className="text-sm text-gray-600">Images where AI could not identify any traffic violations</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3">
              <Camera className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Images</p>
                <p className="text-2xl font-bold text-gray-900">{violationNotTaggedChallans.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3">
              <Search className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">AI Analysis</p>
                <p className="text-sm font-medium text-gray-900">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center space-x-3">
              <FileX className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Violations Found</p>
                <p className="text-sm font-medium text-orange-600">None Detected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Review Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Review Image:</strong> Manually examine the image for any missed violations</li>
          <li>• <strong>Use Modify:</strong> Add violations manually if AI missed them, then move to Pending Review</li>
          <li>• <strong>Approve:</strong> If no violations exist, approve the image as a clean traffic scene</li>
          <li>• <strong>Reject:</strong> If image quality is poor or unusable for analysis</li>
        </ul>
      </div>

      {/* Challans Display */}
      {violationNotTaggedChallans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-green-100 p-4 rounded-full">
              <Search className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">All Clear!</h3>
              <p className="text-gray-500 mt-1">No images with untagged violations at the moment.</p>
              <p className="text-sm text-gray-400 mt-2">
                All analyzed images either have violations detected or have been processed.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {violationNotTaggedChallans.map((challan, index) => (
            <div key={challan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Challan Counter */}
              <div className="bg-orange-50 px-6 py-3 border-b border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      #{index + 1} of {violationNotTaggedChallans.length}
                    </span>
                    <span className="text-sm text-gray-600">
                      Captured: {new Date(challan.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      No Violations Detected
                    </span>
                    {challan.qualityCategory && (
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        challan.qualityCategory === 'GOOD' 
                          ? 'bg-green-100 text-green-800'
                          : challan.qualityCategory === 'FAIR'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        Quality: {challan.qualityCategory}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Challan Card */}
              <div className="p-6">
                <ChallanCard
                  challan={challan}
                  onNext={() => {}}
                  onPrevious={() => {}}
                  hasNext={false}
                  hasPrevious={false}
                  onAction={handleAction}
                  showNavigation={false}
                />
              </div>

              {/* Additional AI Analysis Info */}
              {challan.stepAnalysisResponse && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">AI Analysis Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Steps Completed:</span>
                      <span className="ml-2 font-medium">
                        {Object.keys(challan.stepAnalysisResponse.results).length} / 6
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Final Status:</span>
                      <span className="ml-2 font-medium text-orange-600">No Violations Found</span>
                    </div>
                    {challan.stepAnalysisResponse.results.step2?.data && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600">Detection Result:</span>
                        <span className="ml-2 font-medium">
                          {challan.stepAnalysisResponse.results.step2.data.status === 'NO_VIOLATION' 
                            ? 'No violations detected by AI analysis' 
                            : 'Analysis completed without violations'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViolationNotTaggedTab;
