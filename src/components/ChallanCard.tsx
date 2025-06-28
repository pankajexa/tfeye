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
  AlertTriangle
} from 'lucide-react';
import { Challan } from '../types';
import ImageZoom from './ImageZoom';
import ModifyModal from './ModifyModal';
import RejectModal from './RejectModal';

interface ChallanCardProps {
  challan: Challan;
  onNext: () => void;
  onPrevious: () => void;
  onAction: (action: 'approve' | 'reject' | 'modify', reason?: string, updatedChallan?: Challan) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

const ChallanCard: React.FC<ChallanCardProps> = ({
  challan,
  onNext,
  onPrevious,
  onAction,
  canGoNext,
  canGoPrevious
}) => {
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleReject = (reason: string) => {
    onAction('reject', reason);
  };

  const handleModifySave = (updatedChallan: Challan) => {
    onAction('modify', undefined, updatedChallan);
    setShowModifyModal(false);
  };

  return (
    <>
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
                src={challan.image}
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
                      <p className="text-gray-900">{challan.sectorOfficer.psName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Cadre:</span>
                      <p className="text-gray-900">{challan.sectorOfficer.cadre}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{challan.sectorOfficer.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Image Captured By
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Cadre:</span>
                      <p className="text-gray-900">{challan.capturedBy.cadre}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{challan.capturedBy.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Jurisdiction and Time */}
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
                      <p className="text-gray-900">{challan.jurisdiction.psName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Point Name:</span>
                      <p className="text-gray-900">{challan.jurisdiction.pointName}</p>
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
                      <p className="text-gray-900">{challan.offenceDateTime.date}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Time:</span>
                      <p className="text-gray-900">{challan.offenceDateTime.time}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle & RTA Matching */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <Car className="h-4 w-4 mr-2" />
              Vehicle & RTA Matching Section
            </h4>
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
                      AI Detected
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {challan.vehicleMatches.map((match, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {match.field}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {match.rtaData}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {match.aiDetected}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {match.match ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Mismatch
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {challan.rtaMatched ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">RTA Matched</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">RTA Mismatch Detected</span>
              </div>
            )}
          </div>

          {/* Violation Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Violation Details</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Violations:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {challan.violations.map((violation, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      {violation}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Driver Gender:</span>
                  <p className="text-gray-900">{challan.driverGender}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Fake/No Plate:</span>
                  <p className="text-gray-900">{challan.fakePlate ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Owner Address:</span>
                <p className="text-sm text-gray-900 mt-1">{challan.ownerAddress}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onAction('approve')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </button>

              <button
                onClick={() => setShowModifyModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Modify
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModifyModal
        challan={challan}
        isOpen={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        onSave={handleModifySave}
      />

      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onReject={handleReject}
        challanId={challan.id}
      />
    </>
  );
};

export default ChallanCard;