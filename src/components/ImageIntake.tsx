import React, { useState, useCallback } from 'react';
import { Upload, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'processing' | 'accepted' | 'rejected';
  plateDetected?: string;
}

const ImageIntake: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = (file: File): UploadedFile => {
    const id = Math.random().toString(36).substr(2, 9);
    const preview = URL.createObjectURL(file);
    
    // Simulate AI processing
    const hasPlate = Math.random() > 0.3; // 70% chance of plate detection
    const plateNumber = hasPlate ? `TS${String(Math.floor(Math.random() * 100)).padStart(2, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` : undefined;
    
    return {
      id,
      file,
      preview,
      status: 'processing',
      plateDetected: plateNumber
    };
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'image/jpeg' || file.type === 'image/png'
    );
    
    const newFiles = files.map(processFile);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Simulate processing delay
    newFiles.forEach(uploadedFile => {
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: uploadedFile.plateDetected ? 'accepted' : 'rejected' }
            : f
        ));
      }, 2000 + Math.random() * 3000);
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    const newFiles = files.map(processFile);
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Simulate processing delay
    newFiles.forEach(uploadedFile => {
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: uploadedFile.plateDetected ? 'accepted' : 'rejected' }
            : f
        ));
      }, 2000 + Math.random() * 3000);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Traffic Violation Image Upload</h1>
            <p className="text-gray-600">Upload traffic violation images for AI-powered challan processing</p>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop images here or click to browse
            </h3>
            <p className="text-gray-500 mb-4">
              Supports JPG, PNG files. Bulk upload supported.
            </p>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors duration-200"
            >
              <ImageIcon className="mr-2 h-5 w-5" />
              Select Images
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Uploaded Images ({uploadedFiles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="aspect-w-16 aspect-h-9 mb-3">
                      <img
                        src={uploadedFile.preview}
                        alt="Uploaded"
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {uploadedFile.file.name}
                        </p>
                        {uploadedFile.plateDetected && (
                          <p className="text-sm text-blue-600 font-mono">
                            {uploadedFile.plateDetected}
                          </p>
                        )}
                      </div>
                      <div className="ml-3">
                        {uploadedFile.status === 'processing' && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        )}
                        {uploadedFile.status === 'accepted' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {uploadedFile.status === 'rejected' && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      {uploadedFile.status === 'processing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Processing...
                        </span>
                      )}
                      {uploadedFile.status === 'accepted' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Plate Detected
                        </span>
                      )}
                      {uploadedFile.status === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          System Rejected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageIntake;