const express = require('express');
const { TSECHALLAN_CONFIG, SAMPLE_RTA_DATA } = require('../config');

const router = express.Router();

// Root endpoint for deployment platform detection
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Traffic Challan Backend API is running',
    status: 'OK',
    port: process.env.PORT || 3001,
    timestamp: new Date().toISOString()
  });
});

// Health check - Simple and fast response for deployment platforms
router.get('/health', (req, res) => {
  // Send immediate response for Render port detection
  res.status(200).json({ 
    status: 'OK', 
    port: process.env.PORT || 3001,
    timestamp: new Date().toISOString(),
    service: 'Traffic Challan Backend (Hybrid AI)',
    tsechallan_configured: !!(TSECHALLAN_CONFIG.vendorCode && TSECHALLAN_CONFIG.vendorKey),
    gemini_configured: !!process.env.GEMINI_API_KEY,
    rta_data_loaded: SAMPLE_RTA_DATA.length,
    ai_capabilities: {
      license_plate_detection: 'Gemini AI OCR',
      vehicle_analysis: 'Gemini AI',
      violation_detection: 'Gemini AI',
      rta_verification: 'Hybrid Algorithm',
      step_by_step_analysis: 'Step-by-step workflow implementation',
      rta_lookup: 'TSeChallan API with sample data fallback',
      ai_vehicle_analysis: 'Gemini AI detailed vehicle analysis'
    },
    endpoints: {
      // TSeChallan Integration
      tsechallan_vehicle_lookup: '/api/vehicle-details',
      tsechallan_test_credentials: '/api/test-credentials',
      rta_data: '/api/rta-data',
      
      // Step-by-step Analysis (ENHANCED with Step 6)
      step6_complete_workflow: '/api/step6-analysis',
      step5_complete_workflow: '/api/step5-analysis',
      step4_complete_workflow: '/api/step4-analysis',
      step3_complete_workflow: '/api/step3-analysis',
      step2_workflow: '/api/step2-analysis',
      violation_detection: '/api/detect-violations',
      vehicle_comparison: '/api/compare-vehicle-details',
      vehicle_analysis: '/api/analyze-vehicle-details',
      rta_details_lookup: '/api/fetch-rta-details',
      image_quality_assessment: '/api/assess-image-quality', 
      license_plate_ocr: '/api/extract-license-plate',
      
      // Original Full Analysis
      hybrid_image_analysis: '/api/analyze-image',
      
      // Testing Endpoints
      test_gemini: '/api/test-gemini',
      test_vision: '/api/test-vision',
      test_plate_detection: '/api/test-plate-detection'
    },
    workflow_steps: {
      step_1: 'Enhanced Image Quality Assessment (strict multi-layer validation with obstruction detection)',
      step_2: 'License Plate OCR (Telangana-specific)',
      step_3: 'RTA Details Lookup (TSeChallan API + sample fallback)',
      step_4: 'AI Vehicle Analysis (detailed vehicle characteristics)',
      step_5: 'Vehicle Details Comparison (AI vs RTA intelligent matching)',
      step_6: 'AI Violation Detection (No Helmet, Cell Phone Driving, Triple Riding, Wrong Side Driving)'
    },
          implementation_status: {
        step_1_enhanced_quality_assessment: '✅ IMPLEMENTED',
        step_2_license_plate_ocr: '✅ IMPLEMENTED', 
        step_3_rta_lookup: '✅ IMPLEMENTED',
        step_4_vehicle_analysis: '✅ IMPLEMENTED',
        step_5_details_comparison: '✅ IMPLEMENTED',
        step_6_violation_detection: '✅ IMPLEMENTED'
      },
      enhanced_quality_assessment: {
        detection_method: 'Multi-layer AI analysis with strict validation',
        obstruction_detection: [
          'Flower garlands and marigold decorations',
          'Religious symbols and decorative stickers', 
          'Mud, dirt, and grime covering plates',
          'Damaged or bent license plates',
          'Aftermarket plate covers and frames',
          'Dark tinting or spray paint',
          'Partial covering by vehicle parts'
        ],
        quality_criteria: [
          'License plate visibility and readability',
          'Image sharpness and clarity assessment',
          'Lighting condition evaluation',
          'Technical quality validation',
          'Traffic context verification'
        ],
        strict_rejection_rules: [
          'Any obstruction visible on license plates',
          'Plates not clearly readable due to lighting',
          'Image lacks crystal clear sharpness',
          'Extreme lighting conditions (too dark/bright)',
          'Motion blur or camera shake',
          'Low resolution or heavy compression',
          'Not a proper traffic scene',
          'Vehicles too distant for analysis'
        ],
        acceptance_criteria: [
          'License plates completely clear and unobstructed',
          'Image sharp with excellent clarity',
          'Good lighting with no extreme conditions',
          'Clear traffic scene with analyzable vehicles',
          'High resolution with no technical issues'
        ]
      },
    data_sources: {
      tsechallan_api: {
        configured: !!(TSECHALLAN_CONFIG.vendorCode && TSECHALLAN_CONFIG.vendorKey),
        endpoint: TSECHALLAN_CONFIG.baseUrl,
        fallback_available: true
      },
      sample_rta_data: {
        records_available: SAMPLE_RTA_DATA.length,
        sample_plates: SAMPLE_RTA_DATA.map(r => r["Registration Number"])
      }
    },
    ai_analysis_capabilities: {
      image_quality_assessment: {
        categories: ['GOOD', 'NEEDS_BETTER_REVIEW', 'BLURRY_NOT_FIT'],
        confidence_scoring: true,
        readability_assessment: true
      },
      license_plate_ocr: {
        supported_formats: ['Telangana (TS)', 'Legacy AP', 'Standard Indian'],
        detection_method: 'Gemini AI OCR',
        validation: true,
        multiple_candidates: true,
        confidence_scoring: true
      },
      vehicle_analysis: {
        parameters: [
          'Vehicle Type (car, motorcycle, auto-rickshaw, etc.)',
          'Color (specific color identification)',
          'Make/Brand (if visible)',
          'Model (if identifiable)',
          'Occupant Count',
          'Vehicle Condition',
          'Distinctive Features'
        ],
        visibility_assessment: true,
        confidence_scoring: true
      },
      vehicle_details_comparison: {
        comparison_method: 'Gemini AI Intelligent Comparison',
        parameters_compared: [
          'Color (with lighting variations)',
          'Make/Brand (with abbreviations)',
          'Model (with variants)',
          'Vehicle Type (critical validation)'
        ],
        match_verdicts: ['MATCH', 'PARTIAL_MATCH', 'MISMATCH'],
        features: [
          'Intelligent variation handling',
          'Parameter-by-parameter analysis',
          'Confidence scoring',
          'Discrepancy identification',
          'Verification recommendations'
        ],
        recommendations: ['APPROVE', 'REVIEW', 'REJECT']
      },
      violation_detection: {
        detection_method: 'Gemini AI Violation Analysis (gemini-2.5-flash)',
        supported_violations: [
          'No Helmet (motorcycle/scooter riders without helmets)',
          'Cell Phone Driving (driver using phone while driving)',
          'Triple Riding (more than 2 people on motorcycle/scooter)',
          'Wrong Side Driving (vehicle-to-vehicle comparison methodology)'
        ],
        features: [
          'Exact violation name matching',
          'Conservative detection (only clear violations)',
          'Confidence scoring per violation',
          'Detailed reasoning and descriptions',
          'Severity assessment (High/Medium/Low)',
          'Vehicle context integration',
          'Image quality awareness',
          'Sophisticated wrong-side detection using 80% dominant flow rule'
        ],
        enforcement_actions: ['ISSUE_CHALLAN', 'REVIEW_REQUIRED', 'NO_ACTION'],
        priority_levels: ['High', 'Medium', 'Low'],
        strict_categories: 'Only detects the 4 specified violations, nothing else',
        wrong_side_detection_rules: [
          'Never use camera angle for determination',
          'Use vehicle-to-vehicle comparison only',
          'Establish 80% dominant traffic flow',
          'Compare headlights vs taillights',
          'Priority to moving vehicles over stationary'
        ]
      }
    }
  });
});

module.exports = router; 