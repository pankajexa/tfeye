import React, { useState } from 'react';
import { sampleChallans } from '../data/sampleData';
import ChallanCard from './ChallanCard';
import { Challan } from '../types';

const PendingReviewTab: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [challans, setChallans] = useState(sampleChallans.filter(c => c.status === 'pending-review'));

  const handleNext = () => {
    if (currentIndex < challans.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAction = (action: 'approve' | 'reject' | 'modify', reason?: string, updatedChallan?: Challan) => {
    const currentChallan = challans[currentIndex];
    
    if (action === 'modify' && updatedChallan) {
      // Update the challan with modified data
      const updatedChallans = [...challans];
      updatedChallans[currentIndex] = updatedChallan;
      setChallans(updatedChallans);
      console.log('Challan modified:', updatedChallan);
    } else {
      console.log(`Action: ${action}`, reason ? `Reason: ${reason}` : '');
      // In a real app, this would update the challan status
    }
  };

  if (challans.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No challans pending review</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Pending Review</h2>
        <div className="text-sm text-gray-500">
          {currentIndex + 1} of {challans.length}
        </div>
      </div>

      <ChallanCard
        challan={challans[currentIndex]}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onAction={handleAction}
        canGoNext={currentIndex < challans.length - 1}
        canGoPrevious={currentIndex > 0}
      />
    </div>
  );
};

export default PendingReviewTab;