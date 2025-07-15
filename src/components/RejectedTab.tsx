import React, { useState } from 'react';
import { XCircle, AlertTriangle, Database, Car, Eye, X } from 'lucide-react';
import { RejectedSubTab } from '../types';
import { useChallanContext } from '../context/ChallanContext';
import ImageZoom from './ImageZoom';

interface RejectedTabProps {
  activeSubTab: RejectedSubTab;
}

const RejectedTab: React.FC<RejectedTabProps> = ({ activeSubTab }) => {
  const { getChallansByStatus } = useChallanContext();
  const allRejectedChallans = getChallansByStatus('rejected');
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; plateNumber?: string } | null>(null);

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
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Analysis:</span> {new Date(challan.timestamp).toLocaleString()}
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
    </div>
  );
};

export default RejectedTab;