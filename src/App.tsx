import React, { useState } from 'react';
import { BarChart3, Upload, FileText, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ImageIntake from './components/ImageIntake';
import ReviewChallans from './components/ReviewChallans';
import LoginScreen from './components/LoginScreen';
import { ChallanProvider, useChallanContext } from './context/ChallanContext';
import { AuthProvider, useAuth } from './context/AuthContext';

type Screen = 'dashboard' | 'upload' | 'review';

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const { getChallansByStatus } = useChallanContext();
  const { isAuthenticated, currentOfficer, logout } = useAuth();

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Get live counts for badges
  const processingCount = getChallansByStatus('processing').length;
  const pendingReviewCount = getChallansByStatus('pending-review').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Traffic Violation Detection</h1>
                <p className="text-sm text-blue-600">AI-Powered Enforcement System</p>
              </div>
            </div>

            {/* Right side - Officer info and Logout */}
            <div className="flex items-center space-x-6">
              {currentOfficer && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Officer ID: {currentOfficer.id}</p>
                  <p className="text-sm text-gray-500">Location: Sector 1</p>
                </div>
              )}
              
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200 ${
                currentScreen === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              Dashboard
              <span className="ml-2 text-xs text-blue-600">Operations Overview</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('upload')}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200 ${
                currentScreen === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="mr-2 h-5 w-5" />
              Image Upload
              <span className="ml-2 text-xs text-gray-600">Process Traffic Images</span>
              {processingCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {processingCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setCurrentScreen('review')}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200 ${
                currentScreen === 'review'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="mr-2 h-5 w-5" />
              Review Challans
              <span className="ml-2 text-xs text-gray-600">Approve AI Detections</span>
              {pendingReviewCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-600 rounded-full">
                  {pendingReviewCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {currentScreen === 'dashboard' && <Dashboard />}
        {currentScreen === 'upload' && <ImageIntake />}
        {currentScreen === 'review' && <ReviewChallans />}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ChallanProvider>
        <AppContent />
      </ChallanProvider>
    </AuthProvider>
  );
}

export default App;