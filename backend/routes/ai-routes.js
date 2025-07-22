const express = require('express');
const multer = require('multer');
const { MULTER_CONFIG, SAMPLE_RTA_DATA } = require('../config');
const { analyzeTrafficImage } = require('../gemini-service');
const visionService = require('../vision-service');
const stepAnalysisService = require('../services/step-analysis-service');

const router = express.Router();

// Configure multer for file uploads with better error handling
const upload = multer({
  storage: multer.memoryStorage(),
  ...MULTER_CONFIG
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  console.error('💥 Multer upload error:', err.message);
  console.log('📋 Request headers:', req.headers);
  console.log('📋 Content-Type:', req.get('Content-Type'));
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.',
        errorCode: 'FILE_TOO_LARGE'
      });
    }
  } else if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Only image files are allowed. Please upload a valid image (JPEG, PNG, etc.)',
      errorCode: 'INVALID_FILE_TYPE',
      debug: {
        contentType: req.get('Content-Type'),
        fileDetected: req.file ? req.file.mimetype : 'No file detected'
      }
    });
  }
  
  // Pass other errors to the general error handler
  next(err);
};

// ========== STEP-BY-STEP ANALYSIS ENDPOINTS ==========

// NEW SIMPLIFIED COMPLETE ANALYSIS: All 5 steps in logical sequence
router.post('/api/complete-analysis', upload.single('image'), handleMulterError, async (req, res) => {
  try {
    console.log('🚀 NEW SIMPLIFIED Complete Analysis request received');
    
    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    console.log('📋 Image details:', {
      filename: req.file.originalname,
      size: `${Math.round(req.file.size / 1024)}KB`,
      mimetype: req.file.mimetype
    });

    // Execute NEW SIMPLIFIED complete workflow
    console.log('🔍 Starting NEW SIMPLIFIED 5-Step Analysis...');
    console.log('📋 Step 1: Image Quality Check');
    console.log('📋 Step 2: Violation Detection & Vehicle Identification');
    console.log('📋 Step 3: Targeted License Plate OCR');
    console.log('📋 Step 4: RTA Vehicle Details Lookup');
    console.log('📋 Step 5: AI Vehicle Analysis & Comparison');
    
    const workflowResult = await stepAnalysisService.runCompleteAnalysis(req.file.buffer);
    
    console.log('✅ NEW SIMPLIFIED Complete Analysis completed');
    res.json(workflowResult);

  } catch (error) {
    console.error('💥 NEW SIMPLIFIED Complete Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Complete analysis failed',
      errorCode: 'COMPLETE_ANALYSIS_FAILED'
    });
  }
});

// Step 5 Workflow: Complete Analysis (Quality + OCR + RTA + Vehicle Analysis + Comparison)
router.post('/api/step5-analysis', upload.single('image'), async (req, res) => {
  try {
    console.log('🚀 Step 5 Complete Workflow request received');
    
    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    console.log('📋 Image details:', {
      filename: req.file.originalname,
      size: `${Math.round(req.file.size / 1024)}KB`,
      mimetype: req.file.mimetype
    });

    // Execute Step 5 complete workflow
    console.log('🔍 Starting Step 5 complete workflow: Quality + OCR + RTA + Vehicle Analysis + Comparison...');
    const workflowResult = await stepAnalysisService.runStep5Analysis(req.file.buffer);
    
    console.log('✅ Step 5 complete workflow completed');
    res.json(workflowResult);

  } catch (error) {
    console.error('💥 Step 5 complete workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Step 5 complete workflow failed',
      errorCode: 'STEP5_COMPLETE_WORKFLOW_FAILED'
    });
  }
});

// Step 4 Workflow: Complete Analysis (Quality + OCR + RTA + Vehicle Analysis)
router.post('/api/step4-analysis', upload.single('image'), async (req, res) => {
  try {
    console.log('🚀 Step 4 Complete Workflow request received');
    
    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    console.log('📋 Image details:', {
      filename: req.file.originalname,
      size: `${Math.round(req.file.size / 1024)}KB`,
      mimetype: req.file.mimetype
    });

    // Execute Step 4 complete workflow
    console.log('🔍 Starting Step 4 complete workflow: Quality + OCR + RTA + Vehicle Analysis...');
    const workflowResult = await stepAnalysisService.runStep4Analysis(req.file.buffer);
    
    console.log('✅ Step 4 complete workflow completed');
    res.json(workflowResult);

  } catch (error) {
    console.error('💥 Step 4 complete workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Step 4 complete workflow failed',
      errorCode: 'STEP4_COMPLETE_WORKFLOW_FAILED'
    });
  }
});

// Step 3 Workflow: Complete Analysis (Quality + OCR + RTA)
router.post('/api/step3-analysis', upload.single('image'), async (req, res) => {
  try {
    console.log('🚀 Step 3 Complete Workflow request received');
    
    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    console.log('📋 Image details:', {
      filename: req.file.originalname,
      size: `${Math.round(req.file.size / 1024)}KB`,
      mimetype: req.file.mimetype
    });

    // Execute Step 3 complete workflow
    console.log('🔍 Starting Step 3 complete workflow: Quality + OCR + RTA...');
    const workflowResult = await stepAnalysisService.runStep3Analysis(req.file.buffer);
    
    console.log('✅ Step 3 complete workflow completed');
    res.json(workflowResult);

  } catch (error) {
    console.error('💥 Step 3 complete workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Step 3 complete workflow failed',
      errorCode: 'STEP3_COMPLETE_WORKFLOW_FAILED'
    });
  }
});

// Step 2 Workflow: Image Quality Assessment + OCR
router.post('/api/step2-analysis', upload.single('image'), async (req, res) => {
  try {
    console.log('🚀 Step 2 Workflow request received');
    
    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    console.log('📋 Image details:', {
      filename: req.file.originalname,
      size: `${Math.round(req.file.size / 1024)}KB`,
      mimetype: req.file.mimetype
    });

    // Execute Step 2 workflow
    console.log('🔍 Starting Step 2 workflow: Quality Assessment + OCR...');
    const workflowResult = await stepAnalysisService.runStep2Analysis(req.file.buffer);
    
    console.log('✅ Step 2 workflow completed');
    res.json(workflowResult);

  } catch (error) {
    console.error('💥 Step 2 workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Step 2 workflow failed',
      errorCode: 'STEP2_WORKFLOW_FAILED'
    });
  }
});

// Individual Step: AI Vehicle Analysis Only
router.post('/api/analyze-vehicle-details', upload.single('image'), async (req, res) => {
  try {
    console.log('🔍 AI vehicle analysis request received');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    // Optional quality category from request body (if pre-assessed)
    const qualityCategory = req.body?.quality_category || 'GOOD'; // Default to GOOD if not specified
    
    console.log('📋 Analyzing vehicle details for:', req.file.originalname);
    console.log('📋 Quality category:', qualityCategory);
    
    const vehicleResult = await stepAnalysisService.analyzeVehicleDetails(req.file.buffer, qualityCategory);
    
    console.log('✅ Vehicle analysis completed');
    res.json(vehicleResult);

  } catch (error) {
    console.error('💥 Vehicle analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Vehicle analysis failed',
      errorCode: 'VEHICLE_ANALYSIS_FAILED'
    });
  }
});

// Individual Step: Vehicle Details Comparison Only
router.post('/api/compare-vehicle-details', async (req, res) => {
  try {
    console.log('🔍 Vehicle details comparison request received');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    const { aiAnalysis, rtaData } = req.body;
    
    if (!aiAnalysis || !rtaData) {
      return res.status(400).json({
        success: false,
        error: 'Both aiAnalysis and rtaData are required for comparison',
        errorCode: 'MISSING_COMPARISON_DATA'
      });
    }

    console.log('📋 Comparing AI vehicle analysis with RTA data...');
    console.log('📋 AI Analysis:', aiAnalysis.vehicle_type, aiAnalysis.color, aiAnalysis.make, aiAnalysis.model);
    console.log('📋 RTA Data:', rtaData.make, rtaData.model, rtaData.color);
    
    const comparisonResult = await stepAnalysisService.compareVehicleDetails(aiAnalysis, rtaData);
    
    console.log('✅ Vehicle details comparison completed');
    res.json(comparisonResult);

  } catch (error) {
    console.error('💥 Vehicle details comparison error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Vehicle details comparison failed',
      errorCode: 'VEHICLE_COMPARISON_FAILED'
    });
  }
});

// Individual Step: RTA Details Lookup Only
router.post('/api/fetch-rta-details', async (req, res) => {
  try {
    console.log('🚗 RTA details lookup request received');
    
    const { license_plate } = req.body;
    
    if (!license_plate) {
      return res.status(400).json({
        success: false,
        error: 'License plate is required',
        errorCode: 'MISSING_LICENSE_PLATE'
      });
    }

    console.log('📋 Looking up RTA details for:', license_plate);
    const rtaResult = await stepAnalysisService.step4_fetchRTADetails(license_plate);
    
    console.log('✅ RTA details lookup completed');
    res.json(rtaResult);

  } catch (error) {
    console.error('💥 RTA details lookup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'RTA details lookup failed',
      errorCode: 'RTA_LOOKUP_FAILED'
    });
  }
});

// NEW: Re-analysis with Corrected License Plate
router.post('/api/reanalyze-with-corrected-plate', upload.single('image'), handleMulterError, async (req, res) => {
  try {
    console.log('🔄 Re-analysis with corrected license plate request received');
    
    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    // Validate corrected license plate
    const { corrected_license_plate } = req.body;
    if (!corrected_license_plate) {
      return res.status(400).json({
        success: false,
        error: 'Corrected license plate is required',
        errorCode: 'MISSING_CORRECTED_PLATE'
      });
    }

    console.log('📋 Image details:', {
      filename: req.file.originalname,
      size: `${Math.round(req.file.size / 1024)}KB`,
      mimetype: req.file.mimetype
    });
    console.log('📋 Corrected license plate:', corrected_license_plate);

    // Execute focused re-analysis workflow
    console.log('🔍 Starting Focused Re-analysis with Corrected License Plate...');
    console.log('📋 Skipping Steps 1-3 (quality, violation, OCR)');
    console.log('📋 Step 4: RTA Vehicle Details Lookup with corrected plate');
    console.log('📋 Step 5: AI Vehicle Analysis & Comparison with corrected plate');
    
    const reAnalysisResult = await stepAnalysisService.runFocusedReAnalysis(req.file.buffer, corrected_license_plate);
    
    console.log('✅ Focused Re-analysis completed');
    res.json(reAnalysisResult);

  } catch (error) {
    console.error('💥 Focused Re-analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Re-analysis with corrected plate failed',
      errorCode: 'CORRECTED_PLATE_REANALYSIS_FAILED'
    });
  }
});

// Individual Step: Image Quality Assessment Only
router.post('/api/assess-image-quality', upload.single('image'), async (req, res) => {
  try {
    console.log('🔍 Image quality assessment request received');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    console.log('📋 Assessing image quality for:', req.file.originalname);
    const qualityResult = await stepAnalysisService.categorizeImageQuality(req.file.buffer);
    
    console.log('✅ Image quality assessment completed');
    res.json(qualityResult);

  } catch (error) {
    console.error('💥 Image quality assessment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Image quality assessment failed',
      errorCode: 'QUALITY_ASSESSMENT_FAILED'
    });
  }
});

// Individual Step: License Plate OCR Only
router.post('/api/extract-license-plate', upload.single('image'), async (req, res) => {
  try {
    console.log('🎯 License plate extraction request received');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Google API key not configured',
        errorCode: 'MISSING_GOOGLE_KEY'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    // Optional quality category from request body (if pre-assessed)
    const qualityCategory = req.body?.quality_category || 'GOOD'; // Default to GOOD if not specified
    
    console.log('📋 Extracting license plate from:', req.file.originalname);
    console.log('📋 Quality category:', qualityCategory);
    
    const ocrResult = await stepAnalysisService.extractLicensePlate(req.file.buffer, qualityCategory);
    
    console.log('✅ License plate extraction completed');
    res.json(ocrResult);

  } catch (error) {
    console.error('💥 License plate extraction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'License plate extraction failed',
      errorCode: 'LICENSE_PLATE_EXTRACTION_FAILED'
    });
  }
});

// TEST ENDPOINT: Returns hardcoded successful response
router.post('/api/test-step6-analysis', upload.single('image'), handleMulterError, async (req, res) => {
  try {
    console.log('🧪 TEST ENDPOINT: Returning hardcoded successful response');
    
    // Validate uploaded file (just for consistency)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    console.log('📋 TEST: Processing image:', req.file.originalname);

    // Return EXACT structure that frontend expects with hardcoded license plate
    const testResponse = {
      workflow: 'Complete 5-Step Analysis',
      timestamp: new Date().toISOString(),
      results: {
        step1: {
          success: true,
          step: 1,
          step_name: 'Image Quality & Readiness Check',
          data: {
            status: 'QUALIFIED',
            quality_score: 0.95,
            reason: 'TEST: Image is clear and suitable for analysis',
            visible_vehicles: true,
            license_plates_visible: true,
            image_clarity: 'excellent',
            suitable_for_analysis: true,
            // CRITICAL: License plate in step1
            extracted_license_plate: 'TEST1234',
            license_plate_confidence: 0.99
          }
        },
        step2: {
          success: true,
          step: 2,
          step_name: 'Violation Detection & Vehicle Identification',
          data: {
            status: 'VIOLATION_FOUND',
            violations_detected: [
              {
                violation_type: 'No Helmet',
                detected: true,
                confidence: 0.99,
                violation_details: 'TEST: Rider not wearing helmet'
              }
            ],
            violation_count: 1,
            violation_types: ['No Helmet'],
            // CRITICAL: License plate in step2
            license_plate: 'TEST1234',
            license_plate_confidence: 0.99
          }
        },
        step3: {
          success: true,
          step: 3,
          step_name: 'Targeted License Plate OCR',
          data: {
            status: 'PLATE_EXTRACTED',
            // CRITICAL: License plate in step3
            license_plate: 'TEST1234',
            confidence: 0.99,
            extraction_details: {
              target_vehicle_found: true,
              plate_visibility: 'clear',
              extraction_method: 'test_ocr',
              plate_location: 'front'
            }
          }
        },
        step6: {
          success: true,
          step: 6,
          step_name: 'AI Violation Detection',
          data: {
            violation_analysis: {
              violations_detected: [
                {
                  violation_type: 'No Helmet',
                  detected: true,
                  confidence: 0.99
                }
              ],
              violation_types_found: ['No Helmet'],
              detected_violation_count: 1,
              overall_assessment: {
                total_violations: 1,
                violation_summary: 'TEST: No Helmet violation detected',
                image_clarity_for_detection: 'good',
                analysis_confidence: 0.9
              }
            },
            // CRITICAL: License plate in step6
            license_plate: 'TEST1234',
            license_plate_confidence: 0.99
          }
        }
      },
      success: true,
      step: 6,
      step_name: 'Complete 5-Step Analysis',
      status: 'SUCCESS',
      error: null,
      errorCode: null,
      recommendation: 'TEST: All analysis complete - ready to generate challan',
      next_steps: ['review_results', 'generate_challan'],
      final_result: {
        action: 'CHALLAN_READY',
        violation_types: ['No Helmet'],
        license_plate: 'TEST1234',
        vehicle_owner: 'TEST OWNER',
        recommendation: 'TEST: Ready for challan generation'
      }
    };

    console.log('✅ TEST: Returning hardcoded successful response with license plate:', testResponse.results.step3.data.license_plate);
    res.json(testResponse);

  } catch (error) {
    console.error('💥 TEST ENDPOINT ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Test endpoint failed',
      errorCode: 'TEST_ENDPOINT_FAILED'
    });
  }
});

// Step 6 Workflow: Complete Analysis (Quality + OCR + RTA + Vehicle Analysis + Comparison + Violation Detection)
router.post('/api/step6-analysis', upload.single('image'), handleMulterError, async (req, res) => {
  try {
    console.log('🚀 Step 6 Complete Workflow request received');
    
    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    console.log('📋 Image details:', {
      filename: req.file.originalname,
      size: `${Math.round(req.file.size / 1024)}KB`,
      mimetype: req.file.mimetype
    });

    // Execute Step 6 complete workflow
    console.log('🔍 Starting Step 6 complete workflow: Quality + OCR + RTA + Vehicle Analysis + Comparison + Violation Detection...');
    const workflowResult = await stepAnalysisService.runStep6Analysis(req.file.buffer);
    
    console.log('✅ Step 6 complete workflow completed');
    
    // 🚨 DEBUG: Log the exact response structure
    console.log('🔍 DEBUG: Response structure keys:', Object.keys(workflowResult));
    console.log('🔍 DEBUG: Results keys:', Object.keys(workflowResult.results || {}));
    
    if (workflowResult.results?.step1?.data) {
      console.log('🔍 DEBUG: step1.data keys:', Object.keys(workflowResult.results.step1.data));
      console.log('🔍 DEBUG: step1.extracted_license_plate:', workflowResult.results.step1.data.extracted_license_plate);
    }
    
    if (workflowResult.results?.step2?.data) {
      console.log('🔍 DEBUG: step2.data keys:', Object.keys(workflowResult.results.step2.data));
      console.log('🔍 DEBUG: step2.license_plate:', workflowResult.results.step2.data.license_plate);
    }
    
    if (workflowResult.results?.step3?.data) {
      console.log('🔍 DEBUG: step3.data keys:', Object.keys(workflowResult.results.step3.data));
      console.log('🔍 DEBUG: step3.license_plate:', workflowResult.results.step3.data.license_plate);
    }
    
    if (workflowResult.results?.step6?.data) {
      console.log('🔍 DEBUG: step6.data keys:', Object.keys(workflowResult.results.step6.data));
      console.log('🔍 DEBUG: step6.license_plate:', workflowResult.results.step6.data.license_plate);
    }
    
    console.log('🔍 DEBUG: Response success:', workflowResult.success);
    console.log('🔍 DEBUG: Response recommendation:', workflowResult.recommendation);
    console.log('🔍 DEBUG: Response next_steps:', workflowResult.next_steps);
    
    res.json(workflowResult);

  } catch (error) {
    console.error('💥 Step 6 complete workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Step 6 complete workflow failed',
      errorCode: 'STEP6_COMPLETE_WORKFLOW_FAILED'
    });
  }
});

// Individual Step: Violation Detection Only
router.post('/api/detect-violations', upload.single('image'), async (req, res) => {
  try {
    console.log('⚠️ AI violation detection request received');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    // Optional parameters from request body
    const qualityCategory = req.body?.quality_category || 'GOOD'; // Default to GOOD if not specified
    const vehicleAnalysis = req.body?.vehicle_analysis || null; // Optional vehicle context
    
    console.log('📋 Detecting violations in:', req.file.originalname);
    console.log('📋 Quality category:', qualityCategory);
    console.log('📋 Vehicle context provided:', !!vehicleAnalysis);
    
    const violationResult = await stepAnalysisService.detectViolations(
      req.file.buffer, 
      qualityCategory,
      vehicleAnalysis
    );
    
    console.log('✅ Violation detection completed');
    res.json(violationResult);

  } catch (error) {
    console.error('💥 Violation detection error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Violation detection failed',
      errorCode: 'VIOLATION_DETECTION_FAILED'
    });
  }
});

// ========== ORIGINAL GEMINI IMAGE ANALYSIS ENDPOINTS ==========

// Image analysis endpoint (original full analysis)
router.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    console.log('🖼️ Full image analysis request received');
    
    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    console.log('📋 Image details:', {
      filename: req.file.originalname,
      size: `${Math.round(req.file.size / 1024)}KB`,
      mimetype: req.file.mimetype
    });

    // Analyze the image with Gemini (original comprehensive analysis)
    console.log('🔍 Starting full Gemini analysis...');
    const analysisResult = await analyzeTrafficImage(req.file.buffer, SAMPLE_RTA_DATA);
    
    if (!analysisResult.success) {
      return res.status(500).json(analysisResult);
    }

    console.log('✅ Full image analysis completed successfully');
    res.json(analysisResult);

  } catch (error) {
    console.error('💥 Full image analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Image analysis failed',
      errorCode: 'ANALYSIS_FAILED'
    });
  }
});

// Test Gemini connection endpoint
router.post('/api/test-gemini', async (req, res) => {
  try {
    console.log('🧪 Testing Gemini API connection...');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured',
        errorCode: 'MISSING_GEMINI_KEY'
      });
    }

    // Basic test - you could add a simple image test here
    res.json({
      success: true,
      message: 'Gemini API key is configured',
      gemini_configured: true,
      rta_sample_data_loaded: SAMPLE_RTA_DATA.length > 0,
      sample_data_count: SAMPLE_RTA_DATA.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Gemini test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gemini test failed',
      errorCode: 'GEMINI_TEST_FAILED'
    });
  }
});

// Test Google Cloud Vision API endpoint
router.post('/api/test-vision', async (req, res) => {
  try {
    console.log('🧪 Testing Google Cloud Vision API connection...');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Google API key not configured',
        errorCode: 'MISSING_GOOGLE_KEY'
      });
    }

    // Test Vision API with a simple call
    const testResult = await visionService.testVisionAPI();
    
    if (testResult.success) {
      res.json({
        success: true,
        message: 'Google Cloud Vision API is working correctly',
        vision_configured: true,
        test_result: testResult,
        capabilities: [
          'License plate text detection',
          'Telangana format recognition',
          'Multi-candidate scoring',
          'Position-based filtering'
        ],
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: testResult.error,
        errorCode: 'VISION_TEST_FAILED'
      });
    }

  } catch (error) {
    console.error('💥 Vision API test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Vision API test failed',
      errorCode: 'VISION_TEST_FAILED'
    });
  }
});

// Test license plate detection endpoint (with image upload)
router.post('/api/test-plate-detection', upload.single('image'), async (req, res) => {
  try {
    console.log('🎯 Testing license plate detection...');
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Google API key not configured',
        errorCode: 'MISSING_GOOGLE_KEY'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
        errorCode: 'MISSING_IMAGE'
      });
    }

    console.log('📋 Testing plate detection on image:', {
      filename: req.file.originalname,
      size: `${Math.round(req.file.size / 1024)}KB`
    });

    // Test just the plate detection (original method)
    const plateResult = await visionService.detectLicensePlate(req.file.buffer);
    
    res.json({
      success: true,
      test_type: 'License Plate Detection Only',
      plate_detection_result: plateResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Plate detection test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Plate detection test failed',
      errorCode: 'PLATE_DETECTION_TEST_FAILED'
    });
  }
});

module.exports = router; 