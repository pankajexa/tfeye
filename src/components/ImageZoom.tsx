import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt: string;
  plateNumber?: string;
}

const ImageZoom: React.FC<ImageZoomProps> = ({ src, alt, plateNumber }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const openFullscreen = () => {
    setIsZoomed(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const closeFullscreen = () => {
    setIsZoomed(false);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      }
    };

    if (isZoomed) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isZoomed]);

  return (
    <>
      {/* Regular Image View */}
      <div className="relative group h-full">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-zoom-in"
          onClick={openFullscreen}
        />
        {plateNumber && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-mono">
            {plateNumber}
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={openFullscreen}
            className="p-2 bg-black bg-opacity-50 text-white rounded-md hover:bg-opacity-75 transition-all duration-200"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="relative w-full h-full flex flex-col">
            {/* Controls */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-all duration-200"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-all duration-200"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-all duration-200"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={closeFullscreen}
                className="p-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <img
                ref={imageRef}
                src={src}
                alt={alt}
                className={`max-w-none transition-transform duration-200 ${
                  scale > 1 ? 'cursor-grab' : 'cursor-default'
                } ${isDragging ? 'cursor-grabbing' : ''}`}
                style={{
                  transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                  maxHeight: '90vh',
                  maxWidth: '90vw'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                draggable={false}
              />
            </div>

            {/* Scale Indicator */}
            <div className="absolute bottom-4 left-4 bg-white bg-opacity-20 text-white px-3 py-1 rounded-md text-sm">
              {Math.round(scale * 100)}%
            </div>

            {/* Plate Number Overlay */}
            {plateNumber && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-md text-sm font-mono">
                {plateNumber}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageZoom;