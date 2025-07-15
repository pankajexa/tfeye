import React, { useState } from 'react';
import { CheckCircle, FileText, Download, Car, Calendar, Eye, X } from 'lucide-react';
import { useChallanContext } from '../context/ChallanContext';
import ImageZoom from './ImageZoom';

const ApprovedTab: React.FC = () => {
  const { getChallansByStatus } = useChallanContext();
  const approvedChallans = getChallansByStatus('approved');
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; plateNumber?: string } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Approved Challans</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">{approvedChallans.length} items</span>
          {approvedChallans.length > 0 && (
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {approvedChallans.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Challans</h3>
            <p className="text-gray-500 mb-4">
              Approved traffic violation challans will appear here, ready for final processing and issuance.
            </p>
            <p className="text-sm text-gray-400">
              Complete the review process for pending items to see approved challans here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {approvedChallans.map((challan) => (
              <div key={challan.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 relative group">
                    <img
                      src={challan.preview}
                      alt="Traffic violation"
                      className="h-16 w-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage({
                        src: challan.preview || challan.image,
                        alt: `Traffic violation - Challan ${challan.id}`,
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Approved: {challan.reviewTimestamp ? new Date(challan.reviewTimestamp).toLocaleString() : 'Recently'}
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
                        <span className="font-medium text-gray-600">Violations:</span>
                        <div className="mt-1">
                          {challan.violations.map((violation, index) => (
                            <span
                              key={index}
                              className="inline-block mr-1 mb-1 px-2 py-1 rounded text-xs bg-red-100 text-red-800"
                            >
                              {violation}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <p className="text-gray-900 mt-1">
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {/* Show RTA verification status based on vehicle comparison or fallback */}
                            {challan.vehicleComparison ? (
                              challan.vehicleComparison.overall_verdict === 'MATCH' ? 'RTA Verified' :
                              challan.vehicleComparison.overall_verdict === 'PARTIAL_MATCH' ? 'RTA Partial Match' :
                              'RTA Mismatch'
                            ) : challan.rtaVerification ? (
                              challan.rtaVerification.matches ? 'RTA Verified' :
                              challan.rtaVerification.overallScore > 0.5 ? 'RTA Partial Match' :
                              'RTA Mismatch'
                            ) : 'RTA Verified'}
                          </div>
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Reviewed by:</span> {challan.reviewedBy || 'System'}
                      <span className="ml-4 font-medium">Analysis:</span> {new Date(challan.timestamp).toLocaleString()}
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

export default ApprovedTab;