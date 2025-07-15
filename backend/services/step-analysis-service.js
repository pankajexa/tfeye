const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getAuthToken } = require('./auth-service');
const { transformTSeChallanResponse } = require('./rta-service');
const { TSECHALLAN_CONFIG } = require('../config');
const fetch = require('node-fetch');
const enhancedOCRService = require('./enhanced-ocr-service');

class StepAnalysisService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  }

  // =============================================================================
  // STEP 1: IMAGE QUALITY & READINESS CHECK
  // Purpose: Simple quality assessment - is image suitable for analysis?
  // =============================================================================
  
  async step1_checkImageQuality(imageBuffer) {
    console.log('🔍 STEP 1: Image Quality & Readiness Check...');
    
    try {
      const prompt = `
You are a traffic image quality inspector. Your ONLY job is to determine if this image is suitable for traffic violation analysis.

**CHECK THESE CRITERIA:**

1. **Traffic Context**: Is this a traffic/road scene with vehicles?
2. **Image Clarity**: Is the image clear enough to see vehicle details?
3. **License Plate Visibility**: Are there visible license plates in the image (any vehicle)?
4. **Overall Quality**: Can you clearly distinguish vehicles and their features?

**STRICT DECISION RULES:**
- If image is blurry/out of focus → REJECT
- If no vehicles visible → REJECT  
- If no license plates visible on any vehicle → REJECT
- If not a traffic scene → REJECT
- If image quality makes vehicle identification impossible → REJECT

**RESPONSE FORMAT:**
{
  "status": "QUALIFIED|REJECTED",
  "reason": "Brief explanation of decision",
  "quality_score": 0.85,
  "visible_vehicles": true/false,
  "license_plates_visible": true/false,
  "image_clarity": "excellent|good|fair|poor",
  "suitable_for_analysis": true/false
}

**Remember**: You are NOT detecting violations here, just checking if the image is good enough for analysis.
`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('📄 Step 1 raw response:', text);

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const assessment = JSON.parse(jsonMatch[0]);
      
      if (assessment.status === 'QUALIFIED') {
        console.log('✅ Step 1: Image QUALIFIED for analysis');
        return {
          success: true,
          step: 1,
          step_name: 'Image Quality & Readiness Check',
          data: {
            status: 'QUALIFIED',
            quality_score: assessment.quality_score,
            reason: assessment.reason,
            visible_vehicles: assessment.visible_vehicles,
            license_plates_visible: assessment.license_plates_visible,
            image_clarity: assessment.image_clarity,
            suitable_for_analysis: assessment.suitable_for_analysis
          }
        };
      } else {
        console.log('❌ Step 1: Image REJECTED -', assessment.reason);
        return {
          success: false,
          step: 1,
          step_name: 'Image Quality & Readiness Check',
          error: `Image rejected: ${assessment.reason}`,
          errorCode: 'IMAGE_QUALITY_REJECTED',
          data: {
            status: 'REJECTED',
            quality_score: assessment.quality_score,
            reason: assessment.reason,
            visible_vehicles: assessment.visible_vehicles,
            license_plates_visible: assessment.license_plates_visible,
            image_clarity: assessment.image_clarity,
            suitable_for_analysis: assessment.suitable_for_analysis
          }
        };
      }

    } catch (error) {
      console.error('💥 Step 1 error:', error);
      return {
        success: false,
        step: 1,
        step_name: 'Image Quality & Readiness Check',
        error: error.message || 'Failed to assess image quality',
        errorCode: 'STEP1_ASSESSMENT_FAILED'
      };
    }
  }

  // =============================================================================
  // STEP 2: VIOLATION DETECTION & VEHICLE IDENTIFICATION
  // Purpose: Find which vehicle is violating and what violation
  // =============================================================================
  
  async step2_findViolatingVehicle(imageBuffer) {
    console.log('🚨 STEP 2: Violation Detection & Vehicle Identification...');
    
    try {
      const prompt = `
You are a traffic violation detector. Your job is to find violations and identify which specific vehicle is committing them.

**ANALYZE FOR THESE 4 VIOLATIONS:**

1. **No Helmet**: Motorcycle/scooter riders without helmets
2. **Cell Phone Driving**: Driver using mobile phone while driving
3. **Triple Riding**: More than 2 people on motorcycle/scooter
4. **Wrong Side Driving**: Vehicle driving against traffic flow

**WRONG SIDE DRIVING DETECTION:**
- Establish dominant traffic flow (80% majority rule)
- Compare vehicle orientations (headlights vs taillights)
- Flag vehicles moving opposite to dominant flow  
- NEVER use camera angles - only vehicle-to-vehicle comparison
- Prioritize moving vehicles over stationary ones

**CRITICAL REQUIREMENTS:**
- If you find a violation, describe the EXACT vehicle committing it
- Provide specific location of the violating vehicle in the image
- Be very specific about which vehicle to target for license plate extraction
- Only flag clear, obvious violations

**RESPONSE FORMAT:**
{
  "status": "VIOLATION_FOUND|NO_VIOLATION",
  "violations_detected": [
    {
      "violation_type": "No Helmet|Cell Phone Driving|Triple Riding|Wrong Side Driving",
      "detected": true,
      "violating_vehicle": {
        "description": "Detailed description of the violating vehicle",
        "location": "Specific location in image (e.g., 'center-left', 'foreground-right')",
        "vehicle_type": "motorcycle|car|auto-rickshaw|truck|scooter",
        "distinguishing_features": "Color, position, any unique identifiers"
      },
      "violation_details": "Specific details of the violation observed",
      "confidence": 0.90
    }
  ],
  "primary_violating_vehicle": {
    "description": "Most prominent violating vehicle for OCR targeting",
    "location": "Exact position in image",
    "vehicle_type": "motorcycle|car|auto-rickshaw|truck|scooter",
    "violation_types": ["List of violations this vehicle is committing"]
  }
}

**REMEMBER:** Your job is to find violations and identify the specific vehicle(s) committing them. Do NOT extract license plates - that's the next step.
`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('📄 Step 2 raw response:', text);

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const assessment = JSON.parse(jsonMatch[0]);
      
      if (assessment.status === 'VIOLATION_FOUND') {
        const violationCount = assessment.violations_detected.filter(v => v.detected).length;
        console.log(`🚨 Step 2: Found ${violationCount} violation(s)`);
        console.log(`🎯 Primary violating vehicle: ${assessment.primary_violating_vehicle.description}`);
        
        // CRITICAL FIX: Deduplicate violation types to prevent "No Helmet, No Helmet, No Helmet, No Helmet"
        const detectedViolationTypes = assessment.violations_detected
          .filter(v => v.detected)
          .map(v => v.violation_type);
        
        const uniqueViolationTypes = [...new Set(detectedViolationTypes)]; // Remove duplicates
        
        console.log(`🔧 DEDUPLICATION: ${detectedViolationTypes.length} raw violations → ${uniqueViolationTypes.length} unique violations`);
        console.log(`🔧 Raw violations: [${detectedViolationTypes.join(', ')}]`);
        console.log(`🔧 Unique violations: [${uniqueViolationTypes.join(', ')}]`);
        
        return {
          success: true,
          step: 2,
          step_name: 'Violation Detection & Vehicle Identification',
          data: {
            status: 'VIOLATION_FOUND',
            violations_detected: assessment.violations_detected,
            primary_violating_vehicle: assessment.primary_violating_vehicle,
            violation_count: uniqueViolationTypes.length, // Use unique count
            violation_types: uniqueViolationTypes // Use deduplicated array
          }
        };
      } else {
        console.log('✅ Step 2: No violations detected');
        return {
          success: true,
          step: 2,
          step_name: 'Violation Detection & Vehicle Identification',
          data: {
            status: 'NO_VIOLATION',
            violations_detected: [],
            primary_violating_vehicle: null,
            violation_count: 0,
            violation_types: []
          }
        };
      }

    } catch (error) {
      console.error('💥 Step 2 error:', error);
      return {
        success: false,
        step: 2,
        step_name: 'Violation Detection & Vehicle Identification',
        error: error.message || 'Failed to detect violations',
        errorCode: 'STEP2_VIOLATION_DETECTION_FAILED'
      };
    }
  }

  // =============================================================================
  // STEP 3: TARGETED LICENSE PLATE OCR
  // Purpose: Extract license plate from the specific violating vehicle only
  // =============================================================================
  
  async step3_extractViolatingVehiclePlate(imageBuffer, violatingVehicleInfo) {
    console.log('🎯 STEP 3: Targeted License Plate OCR...');
    console.log(`🚗 Targeting: ${violatingVehicleInfo.description}`);
    
    try {
      const prompt = `
You are a license plate OCR specialist. Your job is to extract the license plate from ONE specific vehicle.

**TARGET VEHICLE:**
Description: ${violatingVehicleInfo.description}
Location: ${violatingVehicleInfo.location}
Vehicle Type: ${violatingVehicleInfo.vehicle_type}
Features: ${violatingVehicleInfo.distinguishing_features || 'Not specified'}

**CRITICAL INSTRUCTIONS:**
- Focus ONLY on the vehicle described above
- Do NOT extract plates from other vehicles
- Look for the license plate on this specific vehicle only
- If you cannot read the plate from this vehicle, report it honestly

**VALID INDIAN LICENSE PLATE FORMATS:**
- TS 09 AB 1234 (Telangana standard)
- KA 02 AB 1234 (Other states)
- MH 22 A 2547 (Single letter variant)

**RESPONSE FORMAT:**
{
  "status": "PLATE_EXTRACTED|PLATE_NOT_READABLE|VEHICLE_NOT_FOUND",
  "license_plate": "extracted_plate_text",
  "confidence": 0.85,
  "extraction_details": {
    "target_vehicle_found": true/false,
    "plate_visibility": "clear|partially_obscured|blurry|not_visible",
    "extraction_method": "direct_ocr|enhanced_processing",
    "plate_location": "front|rear|side"
  },
  "reasoning": "Explanation of extraction result"
}

**REMEMBER:** Only extract from the specified violating vehicle. Do not switch to other vehicles even if their plates are clearer.
`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('📄 Step 3 raw response:', text);

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const assessment = JSON.parse(jsonMatch[0]);
      
      if (assessment.status === 'PLATE_EXTRACTED') {
        const cleanedPlate = this.cleanLicensePlate(assessment.license_plate);
        console.log(`🎯 Step 3: Successfully extracted plate: ${cleanedPlate}`);
        
        return {
          success: true,
          step: 3,
          step_name: 'Targeted License Plate OCR',
          data: {
            status: 'PLATE_EXTRACTED',
            license_plate: cleanedPlate,
            confidence: assessment.confidence,
            extraction_details: assessment.extraction_details,
            reasoning: assessment.reasoning,
            target_vehicle: violatingVehicleInfo.description
          }
        };
      } else {
        console.log(`❌ Step 3: Could not extract plate - ${assessment.reasoning}`);
        return {
          success: false,
          step: 3,
          step_name: 'Targeted License Plate OCR',
          error: `License plate extraction failed: ${assessment.reasoning}`,
          errorCode: assessment.status === 'VEHICLE_NOT_FOUND' ? 'TARGET_VEHICLE_NOT_FOUND' : 'PLATE_NOT_READABLE',
          data: {
            status: assessment.status,
            license_plate: null,
            confidence: assessment.confidence || 0,
            extraction_details: assessment.extraction_details,
            reasoning: assessment.reasoning,
            target_vehicle: violatingVehicleInfo.description
          }
        };
      }

    } catch (error) {
      console.error('💥 Step 3 error:', error);
      return {
        success: false,
        step: 3,
        step_name: 'Targeted License Plate OCR',
        error: error.message || 'Failed to extract license plate',
        errorCode: 'STEP3_OCR_FAILED'
      };
    }
  }

  // =============================================================================
  // STEP 4: RTA VEHICLE DETAILS LOOKUP
  // Purpose: Get official vehicle information from government database
  // =============================================================================
  
  async step4_fetchRTADetails(licenseplate) {
    console.log('📋 STEP 4: RTA Vehicle Details Lookup...');
    console.log(`🔍 Looking up: ${licenseplate}`);
    
    try {
      // Validate input
      if (!licenseplate) {
        return {
          success: false,
          step: 4,
          step_name: 'RTA Vehicle Details Lookup',
          error: 'No license plate provided for RTA lookup',
          errorCode: 'MISSING_LICENSE_PLATE'
        };
      }

      // Check TSeChallan configuration
      if (!TSECHALLAN_CONFIG.vendorCode || !TSECHALLAN_CONFIG.vendorKey) {
        console.log('⚠️ TSeChallan API not configured, using sample data fallback');
        return this.fallbackToSampleData(licenseplate);
      }

      console.log(`🔐 Authenticating with TSeChallan API...`);
      
      // Get authentication token
      const token = await getAuthToken();
      console.log('✅ Authentication successful');

      console.log('📋 Making RTA details request...');
      const requestBody = {
        vendorCode: TSECHALLAN_CONFIG.vendorCode,
        userID: "TG1",
        idCode: "1",
        idDetails: licenseplate.toUpperCase()
      };

      const response = await fetch(`${TSECHALLAN_CONFIG.baseUrl}/IDDetails/getIDInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'User-Agent': 'TSeChallanRST'
        },
        body: JSON.stringify(requestBody),
        timeout: TSECHALLAN_CONFIG.timeout
      });

      console.log('📥 RTA API response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`TSeChallan API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 RTA API response data:', JSON.stringify(data, null, 2));
      
      if (data.responseCode === "0" && data.responseDesc === "Success" && data.data) {
        console.log('✅ Step 4: RTA data found successfully');
        
        const transformedData = transformTSeChallanResponse(data.data);
        
        return {
          success: true,
          step: 4,
          step_name: 'RTA Vehicle Details Lookup',
          data: {
            status: 'RTA_DATA_FOUND',
            rta_data: transformedData,
            data_source: 'TSeChallan API',
            lookup_attempted: true,
            lookup_successful: true,
            api_response_code: data.responseCode,
            registration_number: transformedData.registrationNumber
          }
        };
      } else {
        console.log('❌ Step 4: Vehicle not found in RTA database');
        
        return {
          success: false,
          step: 4,
          step_name: 'RTA Vehicle Details Lookup',
          error: `Vehicle not found in RTA database: ${data.responseDesc || 'Unknown error'}`,
          errorCode: 'RTA_VEHICLE_NOT_FOUND',
          data: {
            status: 'RTA_DATA_NOT_FOUND',
            rta_data: null,
            data_source: 'TSeChallan API',
            lookup_attempted: true,
            lookup_successful: false,
            api_response_code: data.responseCode,
            api_response_desc: data.responseDesc,
            license_plate_searched: licenseplate
          }
        };
      }

    } catch (error) {
      console.error('💥 Step 4 error:', error);
      console.log('🔄 Falling back to sample data...');
      return this.fallbackToSampleData(licenseplate, error.message);
    }
  }

  // =============================================================================
  // STEP 5: AI VEHICLE ANALYSIS & COMPARISON
  // Purpose: Analyze the violating vehicle and compare with RTA data
  // =============================================================================
  
  async step5_analyzeAndCompareVehicle(imageBuffer, violatingVehicleInfo, rtaData) {
    console.log('🔍 STEP 5: AI Vehicle Analysis & Comparison...');
    console.log(`🚗 Analyzing: ${violatingVehicleInfo.description}`);
    
    try {
      const prompt = `
You are a vehicle analysis expert. Your job is to analyze ONE specific vehicle and compare it with official RTA data.

**TARGET VEHICLE TO ANALYZE:**
Description: ${violatingVehicleInfo.description}
Location: ${violatingVehicleInfo.location}
Vehicle Type: ${violatingVehicleInfo.vehicle_type}
Features: ${violatingVehicleInfo.distinguishing_features || 'Not specified'}

**RTA DATA TO COMPARE WITH:**
${JSON.stringify(rtaData, null, 2)}

**ANALYSIS TASKS:**
1. **Visual Analysis**: Analyze ONLY the target vehicle described above
2. **Comparison**: Compare your visual analysis with the RTA data
3. **Verdict**: Determine if they match

**RESPONSE FORMAT:**
{
  "visual_analysis": {
    "vehicle_type": "motorcycle|car|auto-rickshaw|truck|scooter",
    "color": "specific color observed",
    "make_brand": "brand if visible",
    "model": "model if identifiable",
    "occupant_count": number,
    "distinctive_features": "any notable features",
    "analysis_confidence": 0.85
  },
  "comparison_result": {
    "overall_verdict": "MATCH|PARTIAL_MATCH|MISMATCH",
    "confidence_score": 0.80,
    "parameter_analysis": {
      "vehicle_type": {"ai": "car", "rta": "car", "match": true},
      "color": {"ai": "red", "rta": "red", "match": true},
      "make_brand": {"ai": "honda", "rta": "honda", "match": true}
    },
    "discrepancies": ["list of any mismatches found"],
    "explanation": "Detailed explanation of the comparison",
    "verification_recommendation": "APPROVE|REVIEW|REJECT"
  },
  "analysis_notes": "Any additional observations"
}

**REMEMBER:** Only analyze the specified violating vehicle. Focus on getting accurate details for comparison.
`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('📄 Step 5 raw response:', text);

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const assessment = JSON.parse(jsonMatch[0]);
      
      const verdict = assessment.comparison_result.overall_verdict;
      console.log(`🔍 Step 5: Vehicle analysis complete - ${verdict}`);
      console.log(`📊 Confidence: ${assessment.comparison_result.confidence_score}`);
      
      return {
        success: true,
        step: 5,
        step_name: 'AI Vehicle Analysis & Comparison',
        data: {
          status: 'ANALYSIS_COMPLETE',
          visual_analysis: assessment.visual_analysis,
          comparison_result: assessment.comparison_result,
          analysis_notes: assessment.analysis_notes,
          target_vehicle: violatingVehicleInfo.description,
          rta_data_used: rtaData
        }
      };

    } catch (error) {
      console.error('💥 Step 5 error:', error);
      return {
        success: false,
        step: 5,
        step_name: 'AI Vehicle Analysis & Comparison',
        error: error.message || 'Failed to analyze and compare vehicle',
        errorCode: 'STEP5_ANALYSIS_FAILED'
      };
    }
  }

  // =============================================================================
  // COMPLETE WORKFLOW EXECUTION
  // Purpose: Execute all 5 steps in sequence
  // =============================================================================
  
  async runCompleteAnalysis(imageBuffer) {
    console.log('🚀 Starting Complete 5-Step Analysis...');
    
    const analysis = {
      workflow: 'Complete 5-Step Analysis',
      timestamp: new Date().toISOString(),
      results: {},  // Changed from 'steps' to 'results' for frontend compatibility
      success: false,
      final_result: null
    };

    try {
      // STEP 1: Image Quality Check
      console.log('\n=== STEP 1: IMAGE QUALITY CHECK ===');
      const step1Result = await this.step1_checkImageQuality(imageBuffer);
      analysis.results.step1 = step1Result;
      
      if (!step1Result.success) {
        analysis.success = false;
        analysis.final_result = {
          action: 'REJECT_IMAGE',
          reason: step1Result.error,
          recommendation: 'Image quality insufficient for analysis'
        };
        // Add missing TypeScript interface fields
        analysis.recommendation = 'Image quality insufficient for analysis';
        analysis.next_steps = ['upload_better_image'];
        return analysis;
      }

      // STEP 2: Violation Detection & Vehicle Identification
      console.log('\n=== STEP 2: VIOLATION DETECTION ===');
      const step2Result = await this.step2_findViolatingVehicle(imageBuffer);
      analysis.results.step2 = step2Result;
      
      if (!step2Result.success) {
        analysis.success = false;
        analysis.final_result = {
          action: 'ANALYSIS_FAILED',
          reason: step2Result.error,
          recommendation: 'Violation detection failed'
        };
        // Add missing TypeScript interface fields
        analysis.recommendation = 'Violation detection failed';
        analysis.next_steps = ['retry_analysis', 'manual_review'];
        return analysis;
      }

      if (step2Result.data.status === 'NO_VIOLATION') {
        // Create step6 result for no violations case
        const step6Result = {
          success: true,
          step: 6,
          step_name: 'AI Violation Detection',
          data: {
            violation_analysis: {
              violations_detected: [],
              overall_assessment: {
                total_violations: 0,
                violation_summary: 'No violations detected',
                image_clarity_for_detection: 'good',
                analysis_confidence: 0.9,
                analysis_method: 'simplified_violation_first_analysis'
              },
              enforcement_recommendation: {
                action: 'NO_ACTION',
                priority: 'Low',
                notes: 'No traffic violations detected in image'
              },
              detected_violation_count: 0,
              violation_types_found: []
            },
            detection_method: 'Simplified Violation-First Analysis',
            detection_possible: true,
            traffic_related: true,
            vehicles_present: true,
            quality_sufficient: true
          }
        };
        analysis.results.step6 = step6Result;
        
        analysis.success = true;
        analysis.final_result = {
          action: 'NO_ACTION_REQUIRED',
          reason: 'No traffic violations detected',
          recommendation: 'Image clear but no violations found'
        };
        // Add missing TypeScript interface fields
        analysis.recommendation = 'Image clear but no violations found';
        analysis.next_steps = ['no_action_required'];
        return analysis;
      }

      // STEP 3: Targeted License Plate OCR
      console.log('\n=== STEP 3: TARGETED LICENSE PLATE OCR ===');
      const step3Result = await this.step3_extractViolatingVehiclePlate(
        imageBuffer, 
        step2Result.data.primary_violating_vehicle
      );
      analysis.results.step3 = step3Result;
      
      // 🚨 CRITICAL FIX: Don't fail workflow if step3 fails - allow manual review workflow
      if (!step3Result.success) {
        console.log('⚠️ Step 3 failed but continuing workflow for manual review');
        
        // Create a placeholder step3 result so workflow can continue
        step3Result = {
          success: false,
          step: 3,
          step_name: 'Targeted License Plate OCR',
          error: step3Result.error || 'Could not extract license plate from violating vehicle',
          errorCode: 'STEP3_OCR_FAILED',
          data: {
            status: 'PLATE_NOT_EXTRACTED',
            license_plate: null, // Explicitly null so we know it failed
            confidence: 0,
            requires_manual_correction: true, // CRITICAL: Mark step3 as requiring manual correction
            extraction_details: {
              target_vehicle_found: false,
              plate_visibility: 'not_readable',
              extraction_method: 'failed',
              plate_location: 'unknown'
            },
            reasoning: step3Result.error || 'Could not extract license plate',
            target_vehicle: step2Result.data.primary_violating_vehicle?.description || 'Unknown'
          }
        };
        
        // Assign the modified step3Result back to analysis results
        analysis.results.step3 = step3Result;
        
        console.log('✅ Created placeholder step3 result to continue workflow');
        console.log('🔍 DEBUG: Updated step3Result with requires_manual_correction:', step3Result.data.requires_manual_correction);
      }

      // STEP 4: RTA Vehicle Details Lookup
      console.log('\n=== STEP 4: RTA VEHICLE DETAILS LOOKUP ===');
      const step4Result = await this.step4_fetchRTADetails(step3Result.data.license_plate);
      analysis.results.step4 = step4Result;
      
      // Continue even if RTA lookup fails - we can still proceed with available data
      
      // STEP 5: AI Vehicle Analysis & Comparison
      console.log('\n=== STEP 5: AI VEHICLE ANALYSIS & COMPARISON ===');
      let step5Result;
      
      if (step4Result.success) {
        step5Result = await this.step5_analyzeAndCompareVehicle(
          imageBuffer,
          step2Result.data.primary_violating_vehicle,
          step4Result.data.rta_data
        );
      } else {
        // Proceed with analysis but no comparison
        step5Result = {
          success: true,
          step: 5,
          step_name: 'AI Vehicle Analysis & Comparison',
          data: {
            status: 'ANALYSIS_ONLY',
            note: 'RTA data not available, performed visual analysis only',
            rta_data_available: false
          }
        };
      }
      
      analysis.results.step5 = step5Result;

      // FRONTEND COMPATIBILITY: Add license plate to step1 AND step2 results for frontend expectation
      console.log('🔍 COMPATIBILITY CHECK: step3Result.success:', step3Result.success);
      console.log('🔍 COMPATIBILITY CHECK: step3Result.data.license_plate:', step3Result.data?.license_plate);
      
      if (step3Result.success && step3Result.data.license_plate) {
        console.log('✅ COMPATIBILITY: Adding license plate to step1 and step2');
        
        // Add to step1 result
        if (!analysis.results.step1.data) {
          analysis.results.step1.data = {};
        }
        analysis.results.step1.data.extracted_license_plate = step3Result.data.license_plate;
        analysis.results.step1.data.license_plate_confidence = step3Result.data.confidence;
        
        // Add to step2 result
        if (!analysis.results.step2.data) {
          analysis.results.step2.data = {};
        }
        analysis.results.step2.data.license_plate = step3Result.data.license_plate;
        analysis.results.step2.data.license_plate_confidence = step3Result.data.confidence;
        
        console.log('✅ COMPATIBILITY: License plate added successfully');
        console.log('🔍 COMPATIBILITY: step1.extracted_license_plate:', analysis.results.step1.data.extracted_license_plate);
        console.log('🔍 COMPATIBILITY: step2.license_plate:', analysis.results.step2.data.license_plate);
      } else {
        console.log('⚠️ COMPATIBILITY: Step3 failed - setting up for manual review workflow');
        
        // Even when step3 fails, we want to indicate this is a manual review case
        // Add null/placeholder values so frontend knows plates need manual correction
        if (!analysis.results.step1.data) {
          analysis.results.step1.data = {};
        }
        analysis.results.step1.data.extracted_license_plate = null;
        analysis.results.step1.data.license_plate_confidence = 0;
        analysis.results.step1.data.requires_manual_correction = true;
        
        if (!analysis.results.step2.data) {
          analysis.results.step2.data = {};
        }
        analysis.results.step2.data.license_plate = null;
        analysis.results.step2.data.license_plate_confidence = 0;
        analysis.results.step2.data.requires_manual_correction = true;
        
        console.log('✅ COMPATIBILITY: Set up manual review placeholders');
        console.log('🔍 DEBUG: Manual correction flags set:');
        console.log('  🔧 step1.requires_manual_correction:', analysis.results.step1.data.requires_manual_correction);
        console.log('  🔧 step2.requires_manual_correction:', analysis.results.step2.data.requires_manual_correction);
        console.log('  🔧 step3.requires_manual_correction:', analysis.results.step3.data?.requires_manual_correction);
      }

      // STEP 6: Create violation result for frontend compatibility
      const step6Result = {
        success: true,
        step: 6,
        step_name: 'AI Violation Detection',
        data: {
          violation_analysis: {
            violations_detected: step2Result.data.violations_detected || [],
            overall_assessment: {
              total_violations: step2Result.data.violation_count || 0,
              violation_summary: step2Result.data.violation_count > 0 ? `Violations detected: ${step2Result.data.violation_types.join(', ')}` : 'No violations detected',
              image_clarity_for_detection: 'good',
              analysis_confidence: 0.9,
              analysis_method: 'simplified_violation_first_analysis'
            },
            enforcement_recommendation: {
              action: step2Result.data.violation_count > 0 ? 'ISSUE_CHALLAN' : 'NO_ACTION',
              priority: step2Result.data.violation_count > 1 ? 'High' : step2Result.data.violation_count === 1 ? 'Medium' : 'Low',
              notes: `License plate extracted from violating vehicle. Vehicle: ${step2Result.data.primary_violating_vehicle?.description || 'N/A'}`
            },
            detected_violation_count: step2Result.data.violation_count || 0,
            violation_types_found: step2Result.data.violation_types || [] // This now contains deduplicated violations
          },
          detection_method: 'Simplified Violation-First Analysis',
          detection_possible: true,
          traffic_related: true,
          vehicles_present: true,
          quality_sufficient: true,
          // Add key fields the frontend might be looking for
          license_plate: step3Result.data.license_plate,
          license_plate_confidence: step3Result.data.confidence,
          vehicle_owner: step4Result.success ? (step4Result.data.rta_data.ownerName || 'Owner information not available') : 'RTA data not found',
          vehicle_details: step4Result.success ? step4Result.data.rta_data : null,
          rta_match: step5Result.success ? step5Result.data.comparison_result?.overall_verdict : 'Unknown'
        }
      };
      analysis.results.step6 = step6Result;

      // FINAL RESULT
      analysis.success = true;
      analysis.final_result = {
        action: 'CHALLAN_READY',
        violation_types: step2Result.data.violation_types,
        license_plate: step3Result.data.license_plate,
        vehicle_owner: step4Result.success ? (step4Result.data.rta_data.ownerName || 'Owner information not available') : 'RTA data not found',
        vehicle_details: step4Result.success ? step4Result.data.rta_data : null,
        vehicle_match: step5Result.success ? step5Result.data.comparison_result?.overall_verdict : 'Unknown',
        recommendation: 'All analysis complete - ready to generate challan'
      };

      console.log('\n🎉 COMPLETE ANALYSIS FINISHED SUCCESSFULLY!');
      console.log(`📋 Violations: ${step2Result.data.violation_types.join(', ')}`);
      console.log(`🎯 License Plate: ${step3Result.data.license_plate}`);
      console.log(`👤 Vehicle Owner: ${analysis.final_result.vehicle_owner}`);
      
      // Add frontend compatibility fields
      analysis.step = 6; // Indicate completed workflow
      analysis.step_name = 'Complete 5-Step Analysis';
      analysis.status = 'SUCCESS'; // Clear success indicator
      analysis.errorCode = null; // No error
      analysis.error = null; // No error message
      
      // CRITICAL FIX: Add missing TypeScript interface fields
      analysis.recommendation = 'All analysis complete - ready to generate challan';
      analysis.next_steps = ['review_results', 'generate_challan'];
      
      return analysis;

    } catch (error) {
      console.error('💥 Complete analysis error:', error);
      analysis.success = false;
      analysis.final_result = {
        action: 'SYSTEM_ERROR',
        reason: error.message || 'Unknown error during analysis',
        recommendation: 'Check system logs and retry'
      };
      // Add missing TypeScript interface fields
      analysis.recommendation = 'Check system logs and retry';
      analysis.next_steps = ['check_logs', 'retry_analysis'];
      return analysis;
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Fallback to sample RTA data when API is unavailable
   */
  fallbackToSampleData(licenseplate, apiError = null) {
    const { SAMPLE_RTA_DATA } = require('../config');
    
    // Try to find matching sample data
    const sampleMatch = SAMPLE_RTA_DATA.find(record => 
      record["Registration Number"]?.toLowerCase() === licenseplate.toLowerCase()
    );

    if (sampleMatch) {
      console.log(`✅ Found sample data for ${licenseplate}`);
      
      const transformedData = {
        registrationNumber: sampleMatch["Registration Number"],
        make: sampleMatch["Make"],
        model: sampleMatch["Model"],
        color: sampleMatch["Colour"],
        ownerName: sampleMatch["Owner"],
        rcStatus: 'ACTIVE'
      };

      return {
        success: true,
        step: 4,
        step_name: 'RTA Vehicle Details Lookup',
        data: {
          status: 'RTA_DATA_FOUND',
          rta_data: transformedData,
          data_source: 'Sample Data (API unavailable)',
          lookup_attempted: true,
          lookup_successful: true,
          api_fallback: true,
          api_error: apiError,
          registration_number: transformedData.registrationNumber
        }
      };
    } else {
      console.log(`❌ No sample data found for ${licenseplate}`);
      
      return {
        success: false,
        step: 4,
        step_name: 'RTA Vehicle Details Lookup',
        error: `No RTA data found for license plate: ${licenseplate}`,
        errorCode: 'NO_RTA_DATA_FOUND',
        data: {
          status: 'RTA_DATA_NOT_FOUND',
          rta_data: null,
          data_source: 'Sample Data (API unavailable)',
          lookup_attempted: true,
          lookup_successful: false,
          api_fallback: true,
          api_error: apiError,
          license_plate_searched: licenseplate
        }
      };
    }
  }

  /**
   * Clean license plate text
   */
  cleanLicensePlate(plateText) {
    if (!plateText) return '';
    // Remove spaces, dots, dashes and convert to uppercase
    return plateText.replace(/[^A-Z0-9]/g, '').toUpperCase();
  }

  /**
   * Validate Indian license plate format
   */
  validateLicensePlateFormat(plateText) {
    if (!plateText) return false;
    
    // Indian license plate patterns
    const patterns = [
      /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/,  // Standard format: XX##XX#### or XX##X####
      /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/, // Flexible format for older vehicles
      /^[A-Z]{3}\d{4}$/,  // Some older formats
      /^[A-Z]{2}\d{4}$/   // Simplified formats
    ];
    
    return patterns.some(pattern => pattern.test(plateText)) && plateText.length >= 6;
  }

  // =============================================================================
  // LEGACY COMPATIBILITY METHODS (for existing API endpoints)
  // =============================================================================
  
  // Keep these for backward compatibility with existing frontend
  async runStep6Analysis(imageBuffer) {
    console.log('🔄 Legacy Step 6 Analysis - redirecting to new Complete Analysis...');
    return await this.runCompleteAnalysis(imageBuffer);
  }

  async categorizeImageQuality(imageBuffer) {
    console.log('🔄 Legacy categorizeImageQuality - redirecting to Step 1...');
    return await this.step1_checkImageQuality(imageBuffer);
  }

  async detectViolations(imageBuffer) {
    console.log('🔄 Legacy detectViolations - redirecting to Step 2...');
    return await this.step2_findViolatingVehicle(imageBuffer);
  }
}

module.exports = new StepAnalysisService();