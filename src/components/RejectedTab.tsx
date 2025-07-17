import React, { useState } from 'react';
import { XCircle, AlertTriangle, Database, Car, Eye, X, RotateCcw, CheckCircle } from 'lucide-react';
import { RejectedSubTab } from '../types';
import { useChallanContext } from '../context/ChallanContext';
import ImageZoom from './ImageZoom';

interface RejectedTabProps {
  activeSubTab: RejectedSubTab;
}

const RejectedTab: React.FC<RejectedTabProps> = ({ activeSubTab }) => {
  const { getChallansByStatus, updateChallanStatus } = useChallanContext();
  const allRejectedChallans = getChallansByStatus('rejected');
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; plateNumber?: string } | null>(null);
  const [manualReviewModal, setManualReviewModal] = useState<{ isOpen: boolean; challan: any } | null>(null);

  // Filter rejected challans based on sub-tab
  const getFilteredChallans = () => {
    switch (activeSubTab) {
      case 'system-rejected':
        return allRejectedChallans.filter(challan => 
          !challan.reviewedBy || challan.reviewedBy === 'System' ||
          challan.rejectionReason?.includes('System') ||
          challan.rejectionReason?.includes('error') ||
          challan.rejectionReason?.includes('quality')
        );
      case 'operator-rejected':
        return allRejectedChallans.filter(challan => 
          challan.reviewedBy && challan.reviewedBy !== 'System'
        );
      case 'rta-mismatch':
        return allRejectedChallans.filter(challan => 
          challan.rtaVerification && !challan.rtaVerification.matches
        );
      default:
        return allRejectedChallans;
    }
  };

  const filteredChallans = getFilteredChallans();

  // Handle manual override for system-rejected images
  const handleManualOverride = (challan: any) => {
    setManualReviewModal({ isOpen: true, challan });
  };

  const confirmManualOverride = () => {
    if (manualReviewModal?.challan) {
      // Move the challan to pending-review status for manual analysis
      updateChallanStatus(manualReviewModal.challan.id, 'pending-review');
      setManualReviewModal(null);
      
      console.log('Manual override confirmed for challan:', manualReviewModal.challan.id);
      console.log('Challan moved to pending-review for manual analysis');
    }
  };

  // Check if a challan is system-rejected (can be manually overridden)
  const isSystemRejected = (challan: any) => {
    return !challan.reviewedBy || challan.reviewedBy === 'System';
  };

  const getEmptyStateContent = () => {
    switch (activeSubTab) {
      case 'system-rejected':
        return {
          icon: XCircle,
          title: 'No System Rejected Items',
          description: 'Images automatically rejected by AI due to poor quality, unclear plates, or technical issues will appear here.',
          subtext: 'The system maintains high quality standards for accurate violation detection.'
        };
      case 'operator-rejected':
        return {
          icon: AlertTriangle,
          title: 'No Operator Rejected Items',
          description: 'Images manually rejected by operators during the review process will appear here.',
          subtext: 'Manual rejections help maintain accuracy and handle edge cases.'
        };
      case 'rta-mismatch':
        return {
          icon: Database,
          title: 'No RTA Mismatch Items',
          description: 'Images where vehicle details detected by AI don\'t match RTA database records will appear here.',
          subtext: 'These cases require additional verification before proceeding.'
        };
      default:
        return {
          icon: XCircle,
          title: 'No Rejected Items',
          description: 'Rejected items will appear here.',
          subtext: ''
        };
    }
  };

  const emptyState = getEmptyStateContent();
  const IconComponent = emptyState.icon;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          {activeSubTab === 'system-rejected' && 'System Rejected'}
          {activeSubTab === 'operator-rejected' && 'Operator Rejected'}
          {activeSubTab === 'rta-mismatch' && 'RTA Mismatch'}
        </h2>
        <span className="text-sm text-gray-500">{filteredChallans.length} items</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredChallans.length === 0 ? (
          <div className="p-8 text-center">
            <IconComponent className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
            <p className="text-gray-500 mb-4">{emptyState.description}</p>
            {emptyState.subtext && (
              <p className="text-sm text-gray-400">{emptyState.subtext}</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredChallans.map((challan) => (
              <div key={challan.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 relative group">
                    <img
                      src={challan.preview}
                      alt="Rejected traffic image"
                      className="h-16 w-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage({
                        src: challan.preview || challan.image,
                        alt: `Rejected traffic image - Challan ${challan.id}`,
                        plateNumber: challan.plateNumber
                      })}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-lg">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          Challan {challan.id}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </span>
                        {isSystemRejected(challan) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Manual Review Available
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {challan.reviewTimestamp ? new Date(challan.reviewTimestamp).toLocaleString() : new Date(challan.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Vehicle:</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <Car className="w-3 h-3 text-gray-400" />
                          <span className="font-mono text-blue-600">{challan.plateNumber || 'No plate detected'}</span>
                        </div>
                        {challan.vehicleDetails && (
                          <p className="text-xs text-gray-500">{challan.vehicleDetails.vehicleType} - {challan.vehicleDetails.make}</p>
                        )}
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-600">Rejection Reason:</span>
                        <p className="text-red-600 mt-1 font-medium">{challan.rejectionReason || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-600">Rejected By:</span>
                        <p className="text-gray-900 mt-1">{challan.reviewedBy || 'System'}</p>
                        {/* Show RTA status without percentage */}
                        {(challan.vehicleComparison || challan.rtaVerification) && (
                          <p className="text-xs text-gray-500">
                            RTA Status: {
                              challan.vehicleComparison ? (
                                challan.vehicleComparison.overall_verdict === 'MATCH' ? 'Verified' :
                                challan.vehicleComparison.overall_verdict === 'PARTIAL_MATCH' ? 'Partial Match' :
                                'Mismatch'
                              ) : challan.rtaVerification ? (
                                challan.rtaVerification.matches ? 'Verified' :
                                challan.rtaVerification.overallScore > 0.5 ? 'Partial Match' :
                                'Mismatch'
                              ) : 'Not Available'
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Show detected violations if any */}
                    {challan.violations.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm font-medium text-gray-600">Detected Violations:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {challan.violations.map((violation, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                            >
                              {violation}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Analysis:</span> {new Date(challan.timestamp).toLocaleString()}
                      </div>
                      
                      {/* Manual Override Button for System-Rejected Images */}
                      {isSystemRejected(challan) && (
                        <button
                          onClick={() => handleManualOverride(challan)}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Manual Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full">
            <ImageZoom
              src={selectedImage.src}
              alt={selectedImage.alt}
              plateNumber={selectedImage.plateNumber}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Review Modal */}
      {manualReviewModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <RotateCcw className="h-6 w-6 text-blue-600 mr-2" />
                Manual Review Override
              </h2>
              <button
                onClick={() => setManualReviewModal(null)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">System Rejection Override</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      This image was automatically rejected by the AI system. You can manually override this decision if you believe the image can be analyzed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Rejected Image</h4>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <img
                    src={manualReviewModal.challan.preview || manualReviewModal.challan.image}
                    alt="Rejected traffic image"
                    className="w-full max-w-md mx-auto rounded-lg object-cover"
                  />
                </div>
              </div>

              {/* Rejection Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Rejection Details</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Challan ID:</span>
                    <span className="text-sm text-gray-900 ml-2">{manualReviewModal.challan.id}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Rejection Reason:</span>
                    <span className="text-sm text-red-600 ml-2 font-medium">{manualReviewModal.challan.rejectionReason || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Rejected At:</span>
                    <span className="text-sm text-gray-900 ml-2">{new Date(manualReviewModal.challan.reviewTimestamp || manualReviewModal.challan.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Override Confirmation */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Manual Override Action</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                                             <p className="text-sm text-blue-800">
                         <strong>Confirm Manual Override:</strong> This will move the image to the pending review queue where it can be manually analyzed and reviewed by an operator.
                       </p>
                       <p className="text-xs text-blue-600 mt-1">
                         Note: The image will bypass automatic quality checks and go directly to the manual review queue.
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setManualReviewModal(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmManualOverride}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Confirm Manual Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RejectedTab;