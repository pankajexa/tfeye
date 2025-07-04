import React, { useState } from 'react';
import { ClipboardList, Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useChallanContext } from '../context/ChallanContext';
import ChallanCard from './ChallanCard';

const PendingReviewTab: React.FC = () => {
  const { getChallansByStatus, approveChallan, rejectChallan, modifyChallan } = useChallanContext();
  const pendingChallans = getChallansByStatus('pending-review');
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < pendingChallans.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAction = (action: 'approve' | 'reject' | 'modify', reason?: string, updatedChallan?: any) => {
    const currentChallan = pendingChallans[currentIndex];
    
    if (action === 'approve') {
      approveChallan(currentChallan.id, 'System Operator'); // In real app, get from auth
      console.log('Challan approved:', currentChallan.id);
      
      // Move to next challan or stay if this was the last one
      if (currentIndex >= pendingChallans.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } else if (action === 'reject' && reason) {
      rejectChallan(currentChallan.id, reason, 'System Operator');
      console.log('Challan rejected:', currentChallan.id, 'Reason:', reason);
      
      // Move to next challan or stay if this was the last one  
      if (currentIndex >= pendingChallans.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    } else if (action === 'modify' && updatedChallan) {
      modifyChallan(currentChallan.id, updatedChallan);
      console.log('Challan modified:', currentChallan.id, updatedChallan);
    }
  };

  if (pendingChallans.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Pending Review</h2>
          <span className="text-sm text-gray-500">0 items</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Pending Review</h3>
            <p className="text-gray-500 mb-4">
              Images with detected violations will appear here for manual review and approval.
            </p>
            <p className="text-sm text-gray-400">
              Upload traffic images in the Image Intake tab to start the analysis process.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Pending Review</h2>
        <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500">
            {currentIndex + 1} of {pendingChallans.length}
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= pendingChallans.length - 1}
              className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <ChallanCard
        challan={pendingChallans[currentIndex]}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onAction={handleAction}
        canGoNext={currentIndex < pendingChallans.length - 1}
        canGoPrevious={currentIndex > 0}
      />
    </div>
  );
};

export default PendingReviewTab;