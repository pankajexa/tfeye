const express = require('express');
const multer = require('multer');
const { MULTER_CONFIG, SAMPLE_RTA_DATA } = require('../config');
const { analyzeTrafficImage } = require('../gemini-service');
const visionService = require('../vision-service');
const stepAnalysisService = require('../services/step-analysis-service');
const databaseService = require('../services/database-service');
const s3Service = require('../services/s3-service');
const queueManagementService = require('../services/queue-management-service');
const s3MonitorService = require('../services/s3-monitor-service');
const violationsData = require('../traffic_violations');

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

    // Create database record for this analysis
    let analysisRecord = null;
    let s3UploadResult = null;
    
    try {
      // First create the database record to get UUID
      const fileData = {
        filename: req.file.originalname,
        fileSize: req.file.size,
        contentType: req.file.mimetype
      };
      
      // Extract officer data from request body if provided
      const officerData = {
        sectorOfficerPsName: req.body.sectorOfficerPsName,
        sectorOfficerCadre: req.body.sectorOfficerCadre,
        sectorOfficerName: req.body.sectorOfficerName,
        capturedByName: req.body.capturedByName,
        capturedByOfficerId: req.body.capturedByOfficerId,
        capturedByCadre: req.body.capturedByCadre,
        psJurisdictionPsName: req.body.psJurisdictionPsName,
        pointName: req.body.pointName
      };
      
      analysisRecord = await databaseService.createAnalysisRecord(fileData, officerData);
      console.log(`💾 Created database record with UUID: ${analysisRecord.uuid}`);
      
      // Upload to S3 if configured
      if (s3Service.isConfigured()) {
        try {
          s3UploadResult = await s3Service.uploadImage(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            analysisRecord.uuid
          );
          
          // Update database with S3 information
          await databaseService.updateS3Information(analysisRecord.uuid, {
            s3Url: s3UploadResult.s3Url,
            s3Key: s3UploadResult.s3Key,
            s3Bucket: s3UploadResult.bucket
          });
          
          console.log(`📤 Image uploaded to S3: ${s3UploadResult.s3Url}`);
        } catch (s3Error) {
          console.warn('⚠️ S3 upload failed, continuing with analysis:', s3Error.message);
        }
      } else {
        console.warn('⚠️ S3 not configured, skipping image upload');
      }
      
    } catch (dbError) {
      console.warn('⚠️ Database record creation failed, continuing with analysis:', dbError.message);
    }

    // Execute NEW SIMPLIFIED complete workflow
    console.log('🔍 Starting NEW SIMPLIFIED 5-Step Analysis...');
    console.log('📋 Step 1: Image Quality Check');
    console.log('📋 Step 2: Violation Detection & Vehicle Identification');
    console.log('📋 Step 3: Targeted License Plate OCR');
    console.log('📋 Step 4: RTA Vehicle Details Lookup');
    console.log('📋 Step 5: AI Vehicle Analysis & Comparison');
    
    // Add manual upload to the unified queue instead of direct processing
    const queueItem = queueManagementService.addManualUpload(req.file, analysisRecord);
    
    // For backward compatibility, we'll still process immediately for now
    // But the queue system is ready for batch processing if needed
    const workflowResult = await stepAnalysisService.runCompleteAnalysis(req.file.buffer);
    
    // Update database with analysis results
    if (analysisRecord && workflowResult.success) {
      try {
        await databaseService.updateAnalysisResults(analysisRecord.uuid, workflowResult);
        console.log(`💾 Updated database record ${analysisRecord.uuid} with analysis results`);
        
        // Add database info to response
        workflowResult.databaseInfo = {
          uuid: analysisRecord.uuid,
          recordId: analysisRecord.id,
          stored: true,
          s3Upload: s3UploadResult ? {
            url: s3UploadResult.s3Url,
            key: s3UploadResult.s3Key,
            bucket: s3UploadResult.bucket,
            uploaded: true
          } : {
            uploaded: false,
            reason: s3Service.isConfigured() ? 'Upload failed' : 'S3 not configured'
          }
        };
      } catch (dbError) {
        console.warn('⚠️ Database update failed:', dbError.message);
        if (analysisRecord) {
          await databaseService.updateAnalysisStatus(analysisRecord.uuid, 'failed', dbError.message);
        }
        workflowResult.databaseInfo = {
          uuid: analysisRecord?.uuid,
          stored: false,
          error: dbError.message,
          s3Upload: s3UploadResult ? {
            url: s3UploadResult.s3Url,
            key: s3UploadResult.s3Key,
            bucket: s3UploadResult.bucket,
            uploaded: true
          } : {
            uploaded: false,
            reason: 'Database update failed'
          }
        };
      }
    } else if (analysisRecord && !workflowResult.success) {
      // Analysis failed, update database status
      try {
        await databaseService.updateAnalysisStatus(analysisRecord.uuid, 'failed', workflowResult.error);
      } catch (dbError) {
        console.warn('⚠️ Failed to update database status:', dbError.message);
      }
    }
    
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

// ========== DATABASE OPERATION ENDPOINTS ==========

// Record officer review/action
router.post('/api/officer-review', async (req, res) => {
  try {
    const { uuid, officerId, action, reason, modifications } = req.body;
    
    if (!uuid || !officerId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: uuid, officerId, action',
        errorCode: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    console.log(`📝 Recording officer review: ${action} by ${officerId} for ${uuid}`);
    
    const result = await databaseService.recordOfficerReview(uuid, officerId, action, reason, modifications);
    
    res.json({
      success: true,
      message: 'Officer review recorded successfully',
      data: result
    });
    
  } catch (error) {
    console.error('💥 Officer review recording error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record officer review',
      errorCode: 'OFFICER_REVIEW_FAILED'
    });
  }
});

// Get analysis by UUID
router.get('/api/analysis/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    
    console.log(`🔍 Getting analysis for UUID: ${uuid}`);
    
    const analysis = await databaseService.getAnalysisByUuid(uuid);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found',
        errorCode: 'ANALYSIS_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('💥 Get analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analysis',
      errorCode: 'GET_ANALYSIS_FAILED'
    });
  }
});

// Get recent analyses
router.get('/api/analyses', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    console.log(`📋 Getting recent analyses (limit: ${limit}, offset: ${offset})`);
    
    const analyses = await databaseService.getRecentAnalyses(limit, offset);
    
    res.json({
      success: true,
      data: analyses,
      pagination: {
        limit,
        offset,
        count: analyses.length
      }
    });
    
  } catch (error) {
    console.error('💥 Get analyses error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analyses',
      errorCode: 'GET_ANALYSES_FAILED'
    });
  }
});

// Get statistics
router.get('/api/statistics', async (req, res) => {
  try {
    console.log('📊 Getting statistics...');
    
    const stats = await databaseService.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('💥 Get statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get statistics',
      errorCode: 'GET_STATISTICS_FAILED'
    });
  }
});

// ========== S3 STORAGE ENDPOINTS ==========

// Get presigned URL for secure image access
router.get('/api/image/:uuid/presigned-url', async (req, res) => {
  try {
    const { uuid } = req.params;
    const expiresIn = parseInt(req.query.expires) || 3600; // 1 hour default
    
    console.log(`🔗 Generating presigned URL for analysis: ${uuid}`);
    
    // Get S3 key from database
    const analysis = await databaseService.getAnalysisByUuid(uuid);
    
    if (!analysis || !analysis.s3_key) {
      return res.status(404).json({
        success: false,
        error: 'Image not found or not stored in S3',
        errorCode: 'IMAGE_NOT_FOUND'
      });
    }
    
    const presignedUrl = await s3Service.getPresignedUrl(analysis.s3_key, expiresIn);
    
    res.json({
      success: true,
      data: {
        presignedUrl,
        expiresIn,
        s3Key: analysis.s3_key
      }
    });
    
  } catch (error) {
    console.error('💥 Presigned URL generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate presigned URL',
      errorCode: 'PRESIGNED_URL_FAILED'
    });
  }
});

// List recent S3 images
router.get('/api/s3/images', async (req, res) => {
  try {
    const maxKeys = parseInt(req.query.limit) || 100;
    
    console.log(`📋 Listing recent S3 images (limit: ${maxKeys})`);
    
    if (!s3Service.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'S3 service not configured',
        errorCode: 'S3_NOT_CONFIGURED'
      });
    }
    
    const images = await s3Service.listRecentImages(maxKeys);
    
    res.json({
      success: true,
      data: images
    });
    
  } catch (error) {
    console.error('💥 S3 list images error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list S3 images',
      errorCode: 'S3_LIST_FAILED'
    });
  }
});

// S3 service status
router.get('/api/s3/status', (req, res) => {
  const isConfigured = s3Service.isConfigured();
  
  res.json({
    success: true,
    data: {
      configured: isConfigured,
      bucket: process.env.S3_BUCKET_NAME || 'not-set',
      region: process.env.AWS_REGION || 'not-set',
      hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    }
  });
});

// ========== VIOLATIONS DATA ENDPOINTS ==========

// Get all violations
router.get('/api/violations', (req, res) => {
  try {
    res.json({
      success: true,
      data: violationsData.trafficViolations,
      total: violationsData.trafficViolations.length
    });
  } catch (error) {
    console.error('💥 Get violations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get violations',
      errorCode: 'GET_VIOLATIONS_FAILED'
    });
  }
});

// Get violations by vehicle type
router.get('/api/violations/vehicle/:vehicleType', (req, res) => {
  try {
    const { vehicleType } = req.params;
    const violations = violationsData.getViolationsByVehicleType(vehicleType);
    
    res.json({
      success: true,
      data: violations,
      vehicleType,
      total: violations.length
    });
  } catch (error) {
    console.error('💥 Get violations by vehicle type error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get violations by vehicle type',
      errorCode: 'GET_VIOLATIONS_BY_TYPE_FAILED'
    });
  }
});

// Calculate fine for violations
router.post('/api/violations/calculate-fine', (req, res) => {
  try {
    const { violationNames, vehicleType } = req.body;
    
    if (!violationNames || !Array.isArray(violationNames)) {
      return res.status(400).json({
        success: false,
        error: 'violationNames must be an array',
        errorCode: 'INVALID_VIOLATIONS'
      });
    }
    
    const totalFine = violationsData.calculateTotalFine(violationNames, vehicleType);
    const violationDetails = violationNames.map(name => violationsData.getViolationByName(name)).filter(Boolean);
    
    res.json({
      success: true,
      data: {
        totalFine,
        vehicleType,
        violationCount: violationNames.length,
        violations: violationDetails
      }
    });
  } catch (error) {
    console.error('💥 Calculate fine error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate fine',
      errorCode: 'CALCULATE_FINE_FAILED'
    });
  }
});

// =============================================================================
// QUEUE MANAGEMENT & S3 MONITORING ENDPOINTS
// =============================================================================

// Get queue status and system information
router.get('/api/queue/status', async (req, res) => {
  try {
    const systemStatus = queueManagementService.getSystemStatus();
    
    res.json({
      success: true,
      data: systemStatus
    });
  } catch (error) {
    console.error('💥 Queue status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get queue status',
      errorCode: 'QUEUE_STATUS_FAILED'
    });
  }
});

// Start S3 monitoring
router.post('/api/s3/monitoring/start', async (req, res) => {
  try {
    const started = await queueManagementService.startS3Monitoring();
    
    if (started) {
      res.json({
        success: true,
        message: 'S3 monitoring started successfully',
        data: queueManagementService.getS3MonitoringStatus()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to start S3 monitoring (may already be running or not configured)',
        errorCode: 'S3_MONITORING_START_FAILED'
      });
    }
  } catch (error) {
    console.error('💥 Start S3 monitoring error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start S3 monitoring',
      errorCode: 'S3_MONITORING_START_ERROR'
    });
  }
});

// Stop S3 monitoring
router.post('/api/s3/monitoring/stop', async (req, res) => {
  try {
    const stopped = queueManagementService.stopS3Monitoring();
    
    res.json({
      success: true,
      message: stopped ? 'S3 monitoring stopped successfully' : 'S3 monitoring was not running',
      data: queueManagementService.getS3MonitoringStatus()
    });
  } catch (error) {
    console.error('💥 Stop S3 monitoring error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop S3 monitoring',
      errorCode: 'S3_MONITORING_STOP_ERROR'
    });
  }
});

// Get S3 monitoring status
router.get('/api/s3/monitoring/status', async (req, res) => {
  try {
    const status = queueManagementService.getS3MonitoringStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('💥 S3 monitoring status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get S3 monitoring status',
      errorCode: 'S3_MONITORING_STATUS_ERROR'
    });
  }
});

// Get recent S3 images
router.get('/api/s3/recent-images', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const recentImages = await queueManagementService.getRecentS3Images(limit);
    
    res.json({
      success: true,
      data: {
        images: recentImages,
        count: recentImages.length
      }
    });
  } catch (error) {
    console.error('💥 Recent S3 images error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recent S3 images',
      errorCode: 'S3_RECENT_IMAGES_ERROR'
    });
  }
});

// Manually trigger S3 check (for testing/immediate processing)
router.post('/api/s3/check-now', async (req, res) => {
  try {
    const newImages = await s3MonitorService.checkForNewImages();
    
    res.json({
      success: true,
      message: `Found and queued ${newImages.length} new images`,
      data: {
        newImages: newImages,
        count: newImages.length
      }
    });
  } catch (error) {
    console.error('💥 Manual S3 check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check S3 for new images',
      errorCode: 'S3_CHECK_NOW_ERROR'
    });
  }
});

// Queue management endpoints
router.post('/api/queue/pause', (req, res) => {
  try {
    const paused = queueManagementService.pauseProcessing();
    
    res.json({
      success: true,
      message: paused ? 'Queue processing paused' : 'Queue was not running',
      data: queueManagementService.getQueueStatus()
    });
  } catch (error) {
    console.error('💥 Pause queue error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pause queue',
      errorCode: 'QUEUE_PAUSE_ERROR'
    });
  }
});

router.post('/api/queue/resume', (req, res) => {
  try {
    const resumed = queueManagementService.resumeProcessing();
    
    res.json({
      success: true,
      message: resumed ? 'Queue processing resumed' : 'Queue was already running or empty',
      data: queueManagementService.getQueueStatus()
    });
  } catch (error) {
    console.error('💥 Resume queue error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resume queue',
      errorCode: 'QUEUE_RESUME_ERROR'
    });
  }
});

router.delete('/api/queue/clear', (req, res) => {
  try {
    const clearedCount = queueManagementService.clearQueue();
    
    res.json({
      success: true,
      message: `Cleared ${clearedCount} items from queue`,
      data: {
        clearedCount,
        currentStatus: queueManagementService.getQueueStatus()
      }
    });
  } catch (error) {
    console.error('💥 Clear queue error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear queue',
      errorCode: 'QUEUE_CLEAR_ERROR'
    });
  }
});

module.exports = router; 