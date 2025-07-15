const vision = require('@google-cloud/vision');

// Initialize Vision API client with the same credentials as Gemini
// This will use the GEMINI_API_KEY environment variable
const visionClient = new vision.ImageAnnotatorClient({
  apiKey: process.env.GEMINI_API_KEY
});

// Helper functions for plate validation and cleaning
function cleanRegistrationNumber(text) {
  // Remove unwanted characters and normalize
  return text.replace(/[^A-Z0-9]/g, '').toUpperCase();
}

function isValidIndianPlate(plateText) {
  // Indian license plate patterns
  const patterns = [
    /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/,  // Standard format: XX##XX#### or XX##X####
    /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/, // Flexible format for older vehicles
    /^[A-Z]{3}\d{4}$/,  // Some older formats
    /^[A-Z]{2}\d{4}$/   // Simplified formats
  ];
  
  const cleaned = cleanRegistrationNumber(plateText);
  return patterns.some(pattern => pattern.test(cleaned)) && cleaned.length >= 6;
}

function filterTelanganaCandidates(candidates) {
  // Telangana state codes: TS (newer format), AP31-AP39 (before bifurcation)
  const telanganaPatterns = [
    /^TS/,     // New Telangana format
    /^AP3[1-9]/, // Old AP codes assigned to Telangana regions
    /^AP[0-4][0-9]/ // Other AP codes that might be Telangana
  ];
  
  return candidates.filter(candidate => {
    const cleaned = cleanRegistrationNumber(candidate.text);
    return telanganaPatterns.some(pattern => pattern.test(cleaned));
  });
}

function scoreCandidate(candidate, boundingBox) {
  let score = 0;
  
  // Text quality score based on confidence
  if (candidate.confidence) {
    score += candidate.confidence * 40; // Up to 40 points
  }
  
  // Length score - Indian plates are typically 8-10 characters
  const cleanText = cleanRegistrationNumber(candidate.text);
  const idealLength = 10;
  const lengthScore = Math.max(0, 20 - Math.abs(cleanText.length - idealLength) * 2);
  score += lengthScore;
  
  // Position score - plates are usually in lower part of vehicle
  if (boundingBox && boundingBox.vertices) {
    const avgY = boundingBox.vertices.reduce((sum, vertex) => sum + (vertex.y || 0), 0) / 4;
    if (avgY > 0.5) { // Normalized coordinates - lower half gets higher score
      score += 20;
    }
  }
  
  // Format validation score
  if (isValidIndianPlate(candidate.text)) {
    score += 30;
  }
  
  // Character quality score
  const hasNoSpecialChars = /^[A-Z0-9\s]*$/.test(candidate.text);
  if (hasNoSpecialChars) {
    score += 10;
  }
  
  return Math.min(100, score);
}

async function detectLicensePlate(imageBuffer) {
  try {
    console.log('🔍 Starting Google Cloud Vision API plate detection...');
    
    // Perform text detection
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer }
    });
    
    if (!result.textAnnotations || result.textAnnotations.length === 0) {
      console.log('⚠️ No text detected in image');
      return {
        success: false,
        error: 'No text detected in image',
        confidence: 0
      };
    }
    
    console.log(`📝 Detected ${result.textAnnotations.length} text regions`);
    
    // Extract all text candidates
    const candidates = [];
    
    // Process individual text annotations (skip the first one which is full text)
    for (let i = 1; i < result.textAnnotations.length; i++) {
      const annotation = result.textAnnotations[i];
      const text = annotation.description.trim();
      
      // Filter potential license plate candidates
      if (text.length >= 4 && text.length <= 15) {
        candidates.push({
          text: text,
          confidence: annotation.confidence || 0.8,
          boundingBox: annotation.boundingPoly
        });
      }
    }
    
    console.log(`🎯 Found ${candidates.length} potential plate candidates`);
    
    if (candidates.length === 0) {
      return {
        success: false,
        error: 'No license plate candidates found',
        confidence: 0
      };
    }
    
    // Score all candidates
    const scoredCandidates = candidates.map(candidate => ({
      ...candidate,
      score: scoreCandidate(candidate, candidate.boundingBox),
      cleanText: cleanRegistrationNumber(candidate.text)
    }));
    
    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    console.log('🏆 Top candidates:');
    scoredCandidates.slice(0, 3).forEach((candidate, index) => {
      console.log(`  ${index + 1}. "${candidate.text}" -> "${candidate.cleanText}" (score: ${candidate.score.toFixed(1)})`);
    });
    
    // Try to find Telangana-specific plates first
    const telanganaCandidates = filterTelanganaCandidates(scoredCandidates);
    if (telanganaCandidates.length > 0) {
      console.log(`🎯 Found ${telanganaCandidates.length} Telangana plate candidates`);
      const bestTelangana = telanganaCandidates[0];
      
      return {
        success: true,
        plateNumber: bestTelangana.cleanText,
        originalText: bestTelangana.text,
        confidence: Math.min(95, bestTelangana.score), // Cap at 95% for Vision API
        method: 'Google Cloud Vision API',
        region: 'Telangana',
        allCandidates: scoredCandidates.slice(0, 5).map(c => ({
          text: c.cleanText,
          original: c.text,
          score: c.score
        }))
      };
    }
    
    // Fallback to best overall candidate if no Telangana plates found
    const bestCandidate = scoredCandidates[0];
    
    // Only return if confidence is reasonable
    if (bestCandidate.score >= 30) {
      return {
        success: true,
        plateNumber: bestCandidate.cleanText,
        originalText: bestCandidate.text,
        confidence: Math.min(85, bestCandidate.score), // Slightly lower cap for non-Telangana
        method: 'Google Cloud Vision API',
        region: 'Other',
        allCandidates: scoredCandidates.slice(0, 5).map(c => ({
          text: c.cleanText,
          original: c.text,
          score: c.score
        }))
      };
    }
    
    return {
      success: false,
      error: 'No reliable license plate detected',
      confidence: bestCandidate.score,
      bestGuess: bestCandidate.cleanText
    };
    
  } catch (error) {
    console.error('💥 Google Cloud Vision API error:', error);
    return {
      success: false,
      error: error.message,
      confidence: 0
    };
  }
}

// Test function to validate Vision API configuration
async function testVisionAPI() {
  try {
    console.log('🧪 Testing Google Cloud Vision API configuration...');
    
    // Create a simple test image buffer (1x1 white pixel)
    const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
    const testBuffer = Buffer.from(testImageBase64, 'base64');
    
    const [result] = await visionClient.textDetection({
      image: { content: testBuffer }
    });
    
    console.log('✅ Google Cloud Vision API test successful');
    return {
      success: true,
      message: 'Vision API is properly configured',
      detected: result.textAnnotations ? result.textAnnotations.length : 0
    };
    
  } catch (error) {
    console.error('💥 Vision API test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  detectLicensePlate,
  testVisionAPI,
  cleanRegistrationNumber,
  isValidIndianPlate
}; 