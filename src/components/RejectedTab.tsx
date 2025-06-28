import React, { useState } from 'react';
import { XCircle, AlertTriangle, FileX, Edit3, ArrowRight } from 'lucide-react';
import { RejectedSubTab } from '../types';
import { sampleChallans } from '../data/sampleData';
import ImageZoom from './ImageZoom';

interface RejectedTabProps {
  activeSubTab: RejectedSubTab;
}

const RejectedTab: React.FC<RejectedTabProps> = ({ activeSubTab }) => {
  const [editingPlate, setEditingPlate] = useState<string | null>(null);
  const [plateNumbers, setPlateNumbers] = useState<{ [key: string]: string }>({});

  const rejectedChallans = sampleChallans.filter(c => c.status === 'rejected');
  
  const systemRejectedChallans = rejectedChallans.filter(c => 
    c.rejectionReason === 'Number plate not visible' || 
    c.rejectionReason === 'System auto-reject'
  );
  
  const operatorRejectedChallans = rejectedChallans.filter(c => 
    c.rejectionReason && 
    !['Number plate not visible', 'System auto-reject'].includes(c.rejectionReason)
  );

  const rtaMismatchChallans = sampleChallans.filter(c => !c.rtaMatched && c.status !== 'rejected');

  const handlePlateUpdate = (challanId: string, plateNumber: string) => {
    if (plateNumber.trim()) {
      console.log(`Updating plate for ${challanId} to ${plateNumber} and sending to processing`);
      // In a real app, this would update the challan and move it to processing
      setEditingPlate(null);
      setPlateNumbers(prev => ({ ...prev, [challanId]: '' }));
    }
  };

  const renderSystemRejected = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">System Rejected</h3>
        <span className="text-sm text-gray-500">{systemRejectedChallans.length} items</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {systemRejectedChallans.length === 0 ? (
          <div className="p-8 text-center">
            <FileX className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No system rejected images</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {systemRejectedChallans.map((challan) => (
              <div key={challan.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-32">
                    <ImageZoom
                      src={challan.image}
                      alt="System rejected image"
                      plateNumber={challan.plateNumber}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Challan {challan.id}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          System Rejected
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {challan.timestamp}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      Reason: {challan.rejectionReason}
                    </p>

                    {/* Plate Number Update Section */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Update Plate Number:</span>
                        {editingPlate !== challan.id && (
                          <button
                            onClick={() => setEditingPlate(challan.id)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                        )}
                      </div>
                      
                      {editingPlate === challan.id ? (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={plateNumbers[challan.id] || ''}
                            onChange={(e) => setPlateNumbers(prev => ({ ...prev, [challan.id]: e.target.value }))}
                            placeholder="Enter plate number (e.g., TS09AB1234)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            onClick={() => handlePlateUpdate(challan.id, plateNumbers[challan.id] || '')}
                            disabled={!plateNumbers[challan.id]?.trim()}
                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Send to Processing
                          </button>
                          <button
                            onClick={() => setEditingPlate(null)}
                            className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Click edit to add plate number and send to processing
                        </div>
                      )}
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

  const renderOperatorRejected = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Operator Rejected</h3>
        <span className="text-sm text-gray-500">{operatorRejectedChallans.length} items</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {operatorRejectedChallans.length === 0 ? (
          <div className="p-8 text-center">
            <XCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No operator rejected challans</p>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {operatorRejectedChallans.map((challan) => (
              <div key={challan.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-32">
                    <ImageZoom
                      src={challan.image}
                      alt="Operator rejected challan"
                      plateNumber={challan.plateNumber}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">
                        Challan {challan.id}
                      </h4>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejected
                      </span>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Rejection Reason:</span>
                        <p className="text-red-600 mt-1">{challan.rejectionReason}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Rejected At:</span>
                        <p className="text-gray-900 mt-1">{challan.timestamp}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Officer:</span>
                        <p className="text-gray-900">{challan.sectorOfficer.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Location:</span>
                        <p className="text-gray-900">{challan.jurisdiction.pointName}</p>
                      </div>
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

  const renderRTAMismatch = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">RTA Mismatch</h3>
        <span className="text-sm text-gray-500">{rtaMismatchChallans.length} items</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {rtaMismatchChallans.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No RTA mismatches found</p>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {rtaMismatchChallans.map((challan) => (
              <div key={challan.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-32">
                    <ImageZoom
                      src={challan.image}
                      alt="RTA mismatch"
                      plateNumber={challan.plateNumber}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">
                        Challan {challan.id}
                      </h4>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        RTA Mismatch
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Data Comparison</h5>
                      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">RTA Data</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">AI Detected</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {challan.vehicleMatches.map((match, index) => (
                              <tr key={index} className={!match.match ? 'bg-red-50' : ''}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{match.field}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{match.rtaData}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{match.aiDetected}</td>
                                <td className="px-4 py-2 text-sm">
                                  {match.match ? (
                                    <span className="text-green-600">✓ Match</span>
                                  ) : (
                                    <span className="text-red-600 font-medium">✗ Mismatch</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-3">
                      <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200">
                        Approve (Fake No Plate)
                      </button>
                      <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors duration-200">
                        Back to Review
                      </button>
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

  switch (activeSubTab) {
    case 'system-rejected':
      return renderSystemRejected();
    case 'operator-rejected':
      return renderOperatorRejected();
    case 'rta-mismatch':
      return renderRTAMismatch();
    default:
      return renderSystemRejected();
  }
};

export default RejectedTab;