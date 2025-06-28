import React, { useState } from 'react';
import { Camera, FileText } from 'lucide-react';
import ImageIntake from './components/ImageIntake';
import ReviewChallans from './components/ReviewChallans';

type Screen = 'intake' | 'review';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('intake');

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
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {currentScreen === 'intake' ? <ImageIntake /> : <ReviewChallans />}
    </div>
  );
}

export default App;