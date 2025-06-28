import React, { useState } from 'react';
import { X, XCircle } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  challanId: string;
}

const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, onReject, challanId }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const rejectionReasons = [
    'Number Plate Not Visible',
    'Wrong Violation',
    'Irrelevant Image',
    'Blurred Image',
    'Other'
  ];

  const handleReject = () => {
    if (selectedReason === 'Other' && customReason.trim()) {
      onReject(customReason);
    } else if (selectedReason && selectedReason !== 'Other') {
      onReject(selectedReason);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <XCircle className="h-6 w-6 text-red-600 mr-2" />
            Reject Challan {challanId}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select rejection reason:
            </label>
            <div className="space-y-2">
              {rejectionReasons.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-900">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === 'Other' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter custom reason:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please specify the reason for rejection..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim())}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject Challan
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;