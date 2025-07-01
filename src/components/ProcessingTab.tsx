import React from 'react';
import { Clock, Car, Eye } from 'lucide-react';
import { useChallanContext } from '../context/ChallanContext';

const ProcessingTab: React.FC = () => {
  const { getChallansByStatus } = useChallanContext();
  const processingChallans = getChallansByStatus('processing');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Processing Queue</h2>
        <span className="text-sm text-gray-500">{processingChallans.length} items</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {processingChallans.length === 0 ? (
          <div className="p-8 text-center">
            <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Images Currently Processing</h3>
            <p className="text-gray-500 mb-4">
              Images uploaded in the Image Intake tab will appear here while being analyzed by Gemini AI.
            </p>
            <p className="text-sm text-gray-400">
              Processing typically takes 5-15 seconds per image depending on complexity.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {processingChallans.map((challan) => (
              <div key={challan.id} className="p-6 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={challan.preview}
                    alt="Traffic violation"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Challan {challan.id}
                    </h3>
                    {challan.plateNumber && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Car className="w-3 h-3 mr-1" />
                        {challan.plateNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Started: {new Date(challan.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {challan.originalFile.name} • {Math.round(challan.originalFile.size / 1024)}KB
                  </p>
                </div>
                
                <div className="flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium text-blue-600">Analyzing...</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingTab;