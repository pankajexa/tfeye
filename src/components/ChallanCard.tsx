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
import { Challan } from '../context/ChallanContext';
import ImageZoom from './ImageZoom';

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
  const [showRejectOptions, setShowRejectOptions] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const rejectionReasons = [
    'Poor image quality',
    'Number plate not visible',
    'False positive violation',
    'Vehicle not clearly visible',
    'Uncertain violation',
    'System error',
    'Other'
  ];

  const handleReject = () => {
    if (rejectionReason) {
      onAction('reject', rejectionReason);
      setShowRejectOptions(false);
      setRejectionReason('');
    }
  };

  // Helper function to create vehicle matches display from Gemini data and RTA verification
  const createVehicleMatches = () => {
    if (!challan.vehicleDetails) {
      return [];
    }

    // Use RTA verification comparison details from the full Gemini analysis if available
    if (challan.geminiAnalysis?.rta_verification && (challan.geminiAnalysis.rta_verification as any).comparison_details) {
      const details = (challan.geminiAnalysis.rta_verification as any).comparison_details;
      return [
        {
          field: 'Make',
          rtaData: details.make?.rta || 'Not Available',
          aiDetected: details.make?.ai || challan.vehicleDetails.make,
          match: details.make?.match || false
        },
        {
          field: 'Model', 
          rtaData: details.model?.rta || 'Not Available',
          aiDetected: details.model?.ai || challan.vehicleDetails.model,
          match: details.model?.match || false
        },
        {
          field: 'Color',
          rtaData: details.color?.rta || 'Not Available',
          aiDetected: details.color?.ai || challan.vehicleDetails.color,
          match: details.color?.match || false
        }
      ];
    }

    // Fallback: Use basic RTA verification data if available
    if (challan.geminiAnalysis?.rta_verification) {
      const rtaData = challan.geminiAnalysis.rta_verification;
      return [
        {
          field: 'Make',
          rtaData: `RTA Verified (${rtaData.status})`,
          aiDetected: challan.vehicleDetails.make,
          match: rtaData.matches || false
        },
        {
          field: 'Model', 
          rtaData: `RTA Verified (${rtaData.status})`,
          aiDetected: challan.vehicleDetails.model,
          match: rtaData.matches || false
        },
        {
          field: 'Color',
          rtaData: `RTA Verified (${rtaData.status})`,
          aiDetected: challan.vehicleDetails.color,
          match: rtaData.matches || false
        }
      ];
    }

    // Final fallback: Show pending status
    return [
      {
        field: 'Make',
        rtaData: 'RTA Lookup Pending',
        aiDetected: challan.vehicleDetails.make,
        match: false
      },
      {
        field: 'Model', 
        rtaData: 'RTA Lookup Pending',
        aiDetected: challan.vehicleDetails.model,
        match: false
      },
      {
        field: 'Color',
        rtaData: 'RTA Lookup Pending',
        aiDetected: challan.vehicleDetails.color,
        match: false
      }
    ];
  };

  const vehicleMatches = createVehicleMatches();

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
              src={challan.preview}
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
                    <p className="text-gray-900">{challan.sectorOfficer?.psName || 'To be assigned'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Cadre:</span>
                    <p className="text-gray-900">{challan.sectorOfficer?.cadre || 'To be assigned'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900">{challan.sectorOfficer?.name || 'To be assigned'}</p>
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
                    <p className="text-gray-900">{challan.capturedBy?.cadre || 'System'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900">{challan.capturedBy?.name || 'AI System'}</p>
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
                    <p className="text-gray-900">{challan.jurisdiction?.psName || 'To be determined'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Point Name:</span>
                    <p className="text-gray-900">{challan.jurisdiction?.pointName || 'To be determined'}</p>
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
                {vehicleMatches.map((match, index) => (
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
          {challan.rtaVerification ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                RTA Status: {challan.rtaVerification.status} ({Math.round(challan.rtaVerification.overallScore)}% match)
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">RTA Verification Pending</span>
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
            
            {/* Additional Details from Gemini Analysis */}
            {challan.vehicleDetails && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Vehicle Type:</span>
                  <p className="text-gray-900">{challan.vehicleDetails.vehicleType}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Plate Number:</span>
                  <p className="text-gray-900 font-mono">{challan.plateNumber || 'Not detected'}</p>
                </div>
              </div>
            )}
            
            <div>
              <span className="text-sm font-medium text-gray-600">Analysis Timestamp:</span>
              <p className="text-sm text-gray-900 mt-1">{new Date(challan.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>

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