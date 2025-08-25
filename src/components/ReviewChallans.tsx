import React, { useState } from 'react';
import { TabType, RejectedSubTab } from '../types';
import ProcessingTab from './ProcessingTab';
import PendingReviewTab from './PendingReviewTab';
import ApprovedTab from './ApprovedTab';
import RejectedTab from './RejectedTab';
import ViolationNotTaggedTab from './ViolationNotTaggedTab';

const ReviewChallans: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pending-review');
  const [rejectedSubTab, setRejectedSubTab] = useState<RejectedSubTab>('system-rejected');

  const tabs = [
    { id: 'pending-review' as TabType, label: 'Pending Review' },
    { id: 'violation-not-tagged' as TabType, label: 'Violation Not Tagged' },
    { id: 'approved' as TabType, label: 'Approved' },
    { id: 'rejected' as TabType, label: 'Rejected' },
    { id: 'processing' as TabType, label: 'Processing' }
  ];

  const rejectedSubTabs = [
    { id: 'system-rejected' as RejectedSubTab, label: 'System Rejected' },
    { id: 'operator-rejected' as RejectedSubTab, label: 'Operator Rejected' },
    { id: 'rta-mismatch' as RejectedSubTab, label: 'RTA Mismatch' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Traffic Challan Review System</h1>
          </div>
          
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'rejected' && (
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-6 py-3">
              {rejectedSubTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setRejectedSubTab(subTab.id)}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                    rejectedSubTab === subTab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'pending-review' && <PendingReviewTab />}
        {activeTab === 'violation-not-tagged' && <ViolationNotTaggedTab />}
        {activeTab === 'approved' && <ApprovedTab />}
        {activeTab === 'rejected' && <RejectedTab activeSubTab={rejectedSubTab} />}
        {activeTab === 'processing' && <ProcessingTab />}
      </div>
    </div>
  );
};

export default ReviewChallans;