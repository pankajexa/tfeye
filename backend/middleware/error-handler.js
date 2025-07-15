const multer = require('multer');

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  
  // Handle multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.',
        errorCode: 'FILE_TOO_LARGE'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    errorCode: 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler; 