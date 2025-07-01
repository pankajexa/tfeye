import React, { useState } from 'react';
import { Camera, FileText, Database } from 'lucide-react';
import ImageIntake from './components/ImageIntake';
import ReviewChallans from './components/ReviewChallans';
import RTATestComponent from './components/RTATestComponent';
import { ChallanProvider, useChallanContext } from './context/ChallanContext';

type Screen = 'intake' | 'review' | 'rta-test';

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('intake');
  const { getChallansByStatus } = useChallanContext();

  // Get live counts
  const processingCount = getChallansByStatus('processing').length;
  const pendingReviewCount = getChallansByStatus('pending-review').length;
  const approvedCount = getChallansByStatus('approved').length;
  const rejectedCount = getChallansByStatus('rejected').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Traffic Challan AI</h1>
                  <p className="text-xs text-gray-500">Telangana Traffic Police</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentScreen('intake')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentScreen === 'intake'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Camera className="mr-2 h-4 w-4" />
                Image Intake
                {processingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                    {processingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentScreen('review')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentScreen === 'review'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <FileText className="mr-2 h-4 w-4" />
                Review Challans
                {pendingReviewCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-600 rounded-full">
                    {pendingReviewCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentScreen('rta-test')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  currentScreen === 'rta-test'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Database className="mr-2 h-4 w-4" />
                RTA Test
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Status Bar */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Processing: {processingCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Pending Review: {pendingReviewCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Approved: {approvedCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Rejected: {rejectedCount}</span>
            </div>
          </div>
          
          <div className="text-gray-500">
            Total: {processingCount + pendingReviewCount + approvedCount + rejectedCount} challans
          </div>
        </div>
      </div>

      {/* Main Content */}
      {currentScreen === 'intake' && <ImageIntake />}
      {currentScreen === 'review' && <ReviewChallans />}
      {currentScreen === 'rta-test' && <RTATestComponent />}
    </div>
  );
};

function App() {
  return (
    <ChallanProvider>
      <AppContent />
    </ChallanProvider>
  );
}

export default App;