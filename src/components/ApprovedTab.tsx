import React from 'react';
import { CheckCircle, Car, Calendar } from 'lucide-react';
import { sampleChallans } from '../data/sampleData';

const ApprovedTab: React.FC = () => {
  const approvedChallans = sampleChallans.filter(c => c.status === 'approved');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Approved Challans</h2>
        <span className="text-sm text-gray-500">{approvedChallans.length} items</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {approvedChallans.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No approved challans</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {approvedChallans.map((challan) => (
              <div key={challan.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={challan.image}
                      alt="Traffic violation"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
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
                        {challan.timestamp}
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Vehicle:</span>
                        <div className="flex items-center space-x-1 mt-1">
                          <Car className="w-3 h-3 text-gray-400" />
                          <span className="font-mono text-blue-600">{challan.plateNumber}</span>
                        </div>
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
                        <span className="font-medium text-gray-600">Location:</span>
                        <p className="text-gray-900 mt-1">
                          {challan.jurisdiction.psName}<br />
                          <span className="text-xs text-gray-500">{challan.jurisdiction.pointName}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Officer:</span> {challan.sectorOfficer.name} ({challan.sectorOfficer.cadre})
                    </div>
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

export default ApprovedTab;