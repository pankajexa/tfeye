const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');

/**
 * Enhanced OCR Service - Multi-Stage Pipeline for Absolutely Great OCR
 * 
 * This service implements a 5-stage OCR pipeline:
 * 1. Image Preprocessing (multiple variants)
 * 2. License Plate Region Detection
 * 3. Multi-Attempt OCR with different approaches
 * 4. Confidence Verification & Cross-Validation
 * 5. Fallback Strategies
 */
class EnhancedOCRService {
  constructor() {
    this.model = null;
    this.initializeModel();
  }

  async initializeModel() {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('✅ Enhanced OCR Service initialized with Gemini');
    } catch (error) {
      console.error('💥 Failed to initialize Enhanced OCR Service:', error);
    }
  }

  /**
   * STAGE 1: Advanced Image Preprocessing
   * Creates multiple enhanced versions of the image for better OCR
   */
  async preprocessImage(imageBuffer) {
    console.log('🔧 Stage 1: Advanced Image Preprocessing...');
    
    try {
      const variants = [];
      
      // Original image
      variants.push({
        name: 'original',
        buffer: imageBuffer,
        description: 'Original unprocessed image'
      });

      // Enhanced contrast and sharpening
      const enhanced = await sharp(imageBuffer)
        .normalize() // Auto-adjust contrast
        .sharpen({ sigma: 1.5 }) // Sharpen edges
        .modulate({ 
          brightness: 1.1, // Slightly brighter
          contrast: 1.2    // Higher contrast
        })
        .jpeg({ quality: 95 })
        .toBuffer();

      variants.push({
        name: 'enhanced',
        buffer: enhanced,
        description: 'Enhanced contrast and sharpening'
      });

      // High contrast for difficult plates
      const highContrast = await sharp(imageBuffer)
        .normalize()
        .linear(1.5, -50) // Aggressive contrast
        .sharpen({ sigma: 2.0 })
        .modulate({ contrast: 1.5 })
        .jpeg({ quality: 95 })
        .toBuffer();

      variants.push({
        name: 'high_contrast',
        buffer: highContrast,
        description: 'High contrast for difficult plates'
      });

      // Grayscale with enhanced edges
      const grayscale = await sharp(imageBuffer)
        .greyscale()
        .normalize()
        .sharpen({ sigma: 1.8 })
        .modulate({ contrast: 1.3 })
        .jpeg({ quality: 95 })
        .toBuffer();

      variants.push({
        name: 'grayscale',
        buffer: grayscale,
        description: 'Grayscale with enhanced edges'
      });

      console.log(`✅ Created ${variants.length} image variants for OCR`);
      return variants;

    } catch (error) {
      console.error('💥 Image preprocessing error:', error);
      return [{ name: 'original', buffer: imageBuffer, description: 'Original (preprocessing failed)' }];
    }
  }

  /**
   * STAGE 2: License Plate Region Detection
   * Identifies and crops license plate regions for focused OCR
   */
  async detectLicensePlateRegions(imageBuffer) {
    console.log('🎯 Stage 2: License Plate Region Detection...');
    
    try {
      const prompt = `
You are an expert license plate detection system. Identify and locate license plate regions in this traffic image.

**DETECTION OBJECTIVES:**
1. Identify ALL license plate regions in the image
2. Assess visibility and quality of each plate
3. Prioritize plates based on clarity and size

**RESPONSE FORMAT:**
{
  "plates_detected": [
    {
      "plate_id": 1,
      "location": "front-center|rear-center|left-side|right-side",
      "visibility": "excellent|good|fair|poor",
      "readability_score": 0.85,
      "priority": "high|medium|low",
      "description": "Clear front license plate on red motorcycle"
    }
  ],
  "total_plates": 1,
  "recommended_plate": {
    "plate_id": 1,
    "reason": "Highest visibility and readability score"
  }
}

Focus on finding the CLEAREST and most READABLE license plate regions.
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

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const detection = JSON.parse(jsonMatch[0]);
        console.log(`✅ Detected ${detection.total_plates} license plate regions`);
        return detection;
      }

      return { plates_detected: [], total_plates: 0, recommended_plate: null };

    } catch (error) {
      console.error('💥 License plate detection error:', error);
      return { plates_detected: [], total_plates: 0, recommended_plate: null };
    }
  }

  /**
   * STAGE 3: Multi-Attempt OCR with Different Approaches
   * Try multiple OCR strategies for maximum accuracy
   */
  async performMultiAttemptOCR(imageVariants, plateDetection = null) {
    console.log('🔄 Stage 3: Multi-Attempt OCR...');
    
    const ocrAttempts = [];
    
    // Strategy 1: General OCR on all variants
    for (const variant of imageVariants) {
      try {
        const result = await this.performGeneralOCR(variant);
        if (result.success) {
          ocrAttempts.push({
            method: `general_ocr_${variant.name}`,
            result: result,
            confidence: result.confidence || 0.5,
            source: variant.description
          });
        }
      } catch (error) {
        console.log(`⚠️ General OCR failed for ${variant.name}:`, error.message);
      }
    }

    // Strategy 2: Focused OCR (if plate regions detected)
    if (plateDetection?.plates_detected?.length > 0) {
      for (const variant of imageVariants.slice(0, 2)) {
        try {
          const result = await this.performFocusedOCR(variant, plateDetection);
          if (result.success) {
            ocrAttempts.push({
              method: `focused_ocr_${variant.name}`,
              result: result,
              confidence: result.confidence || 0.6,
              source: `${variant.description} - Focused on detected regions`
            });
          }
        } catch (error) {
          console.log(`⚠️ Focused OCR failed for ${variant.name}:`, error.message);
        }
      }
    }

    // Strategy 3: Format-Specific OCR
    for (const variant of imageVariants.slice(0, 2)) {
      try {
        const result = await this.performFormatSpecificOCR(variant);
        if (result.success) {
          ocrAttempts.push({
            method: `format_specific_${variant.name}`,
            result: result,
            confidence: result.confidence || 0.7,
            source: `${variant.description} - Format-specific approach`
          });
        }
      } catch (error) {
        console.log(`⚠️ Format-specific OCR failed for ${variant.name}:`, error.message);
      }
    }

    console.log(`✅ Completed ${ocrAttempts.length} OCR attempts`);
    return ocrAttempts;
  }

  /**
   * General OCR - Enhanced version of existing approach
   */
  async performGeneralOCR(imageVariant) {
    const prompt = `
You are an expert OCR system specializing in Indian license plates. Extract the license plate number from this image.

**FOCUS AREAS:**
- Look for rectangular regions with license plate characteristics
- Indian license plates: TS09EA1234, KA05AB9876, MH12A5432

**EXTRACTION RULES:**
1. Only extract clear, readable text
2. Validate against Indian license plate formats
3. Provide confidence based on text clarity
4. If multiple plates, choose the clearest one

**RESPONSE FORMAT:**
{
  "status": "success|no_plate_found|unclear",
  "license_plate": "extracted_plate_text",
  "confidence": 0.85,
  "reasoning": "Clear front plate on motorcycle, all characters visible"
}

Be conservative - only extract if confident about the text.
`;

    const imagePart = {
      inlineData: {
        data: imageVariant.buffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };

    const result = await this.model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const ocrResult = JSON.parse(jsonMatch[0]);
      if (ocrResult.status === 'success' && ocrResult.license_plate) {
        return {
          success: true,
          license_plate: ocrResult.license_plate,
          confidence: ocrResult.confidence || 0.5,
          reasoning: ocrResult.reasoning
        };
      }
    }

    return { success: false, error: 'No plate detected in general OCR' };
  }

  /**
   * Focused OCR - Target specific plate regions
   */
  async performFocusedOCR(imageVariant, plateDetection) {
    const recommendedPlate = plateDetection.recommended_plate;
    if (!recommendedPlate) return { success: false, error: 'No recommended plate region' };

    const targetPlate = plateDetection.plates_detected.find(p => p.plate_id === recommendedPlate.plate_id);
    
    const prompt = `
You are an expert OCR system. Focus ONLY on the license plate in the ${targetPlate.location} region.

**TARGET PLATE DETAILS:**
- Location: ${targetPlate.location}
- Visibility: ${targetPlate.visibility}
- Description: ${targetPlate.description}

**FOCUSED EXTRACTION:**
1. Look specifically at the ${targetPlate.location} area
2. This plate has ${targetPlate.visibility} visibility
3. Ignore any other text or plates in the image

**RESPONSE FORMAT:**
{
  "status": "success|unclear|obstructed",
  "license_plate": "extracted_text",
  "confidence": 0.90,
  "reasoning": "Focused on ${targetPlate.location} plate"
}
`;

    const imagePart = {
      inlineData: {
        data: imageVariant.buffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };

    const result = await this.model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const ocrResult = JSON.parse(jsonMatch[0]);
      if (ocrResult.status === 'success' && ocrResult.license_plate) {
        return {
          success: true,
          license_plate: ocrResult.license_plate,
          confidence: ocrResult.confidence || 0.6,
          reasoning: ocrResult.reasoning
        };
      }
    }

    return { success: false, error: 'Focused OCR failed' };
  }

  /**
   * Format-Specific OCR - Use Indian license plate format knowledge
   */
  async performFormatSpecificOCR(imageVariant) {
    const prompt = `
You are an expert Indian license plate OCR system with deep knowledge of formats.

**INDIAN LICENSE PLATE FORMATS:**
1. Standard: XX##XX#### (e.g., KA05AB1234)
2. Variant: XX##X#### (e.g., MH12A5432)
3. Old format: XX#### (e.g., KA1234)

**STATE CODES:**
- TS = Telangana, KA = Karnataka, MH = Maharashtra
- AP = Andhra Pradesh, TN = Tamil Nadu, etc.

**FORMAT-SPECIFIC EXTRACTION:**
1. Look for 2-letter state code at start
2. Follow with 2-digit district code
3. Then 1-3 letter series
4. End with 4-digit number

**RESPONSE FORMAT:**
{
  "status": "success|format_mismatch|unclear",
  "license_plate": "extracted_text",
  "confidence": 0.88,
  "reasoning": "Clear format match with standard Indian pattern"
}
`;

    const imagePart = {
      inlineData: {
        data: imageVariant.buffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };

    const result = await this.model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const ocrResult = JSON.parse(jsonMatch[0]);
      if (ocrResult.status === 'success' && ocrResult.license_plate) {
        return {
          success: true,
          license_plate: ocrResult.license_plate,
          confidence: ocrResult.confidence || 0.7,
          reasoning: ocrResult.reasoning
        };
      }
    }

    return { success: false, error: 'Format-specific OCR failed' };
  }

  /**
   * STAGE 4: Confidence Verification & Cross-Validation
   * Analyze multiple OCR results and pick the best one
   */
  async crossValidateResults(ocrAttempts) {
    console.log('🔍 Stage 4: Confidence Verification & Cross-Validation...');
    
    if (ocrAttempts.length === 0) {
      return { success: false, error: 'No OCR attempts to validate' };
    }

    // Group results by extracted license plate
    const plateGroups = {};
    for (const attempt of ocrAttempts) {
      const plate = attempt.result.license_plate.replace(/\s+/g, '').toUpperCase();
      if (!plateGroups[plate]) {
        plateGroups[plate] = [];
      }
      plateGroups[plate].push(attempt);
    }

    // Analyze consensus and confidence
    const validationResults = [];
    for (const [plate, attempts] of Object.entries(plateGroups)) {
      const avgConfidence = attempts.reduce((sum, a) => sum + a.confidence, 0) / attempts.length;
      const consensusCount = attempts.length;
      const maxConfidence = Math.max(...attempts.map(a => a.confidence));
      
      validationResults.push({
        license_plate: plate,
        consensus_count: consensusCount,
        average_confidence: avgConfidence,
        max_confidence: maxConfidence,
        consensus_score: (consensusCount / ocrAttempts.length) * avgConfidence,
        attempts: attempts
      });
    }

    // Sort by consensus score (best first)
    validationResults.sort((a, b) => b.consensus_score - a.consensus_score);

    const bestResult = validationResults[0];
    
    // Validate format
    const formatValid = this.validateIndianLicensePlateFormat(bestResult.license_plate);
    
    console.log(`✅ Cross-validation complete. Best result: ${bestResult.license_plate}`);
    console.log(`   Consensus: ${bestResult.consensus_count}/${ocrAttempts.length} attempts`);
    console.log(`   Confidence: ${bestResult.average_confidence.toFixed(2)} (avg)`);
    console.log(`   Format valid: ${formatValid.valid}`);

    return {
      success: true,
      license_plate: bestResult.license_plate,
      confidence: bestResult.average_confidence,
      max_confidence: bestResult.max_confidence,
      consensus_count: bestResult.consensus_count,
      total_attempts: ocrAttempts.length,
      format_validation: formatValid,
      reasoning: `Best result from ${bestResult.consensus_count} attempts with ${bestResult.average_confidence.toFixed(2)} confidence`
    };
  }

  /**
   * STAGE 5: Fallback Strategies
   * Additional attempts if primary methods fail
   */
  async performFallbackOCR(imageBuffer) {
    console.log('🔄 Stage 5: Fallback Strategies...');
    
    try {
      // Fallback 1: Ultra-high contrast
      const ultraContrast = await sharp(imageBuffer)
        .linear(2.0, -100)
        .sharpen({ sigma: 3.0 })
        .jpeg({ quality: 95 })
        .toBuffer();

      const result1 = await this.performGeneralOCR({ 
        buffer: ultraContrast, 
        name: 'ultra_contrast' 
      });

      if (result1.success) {
        return {
          success: true,
          license_plate: result1.license_plate,
          confidence: result1.confidence * 0.8,
          method: 'fallback_ultra_contrast',
          reasoning: 'Fallback method with ultra-high contrast'
        };
      }

      return { success: false, error: 'All fallback strategies failed' };

    } catch (error) {
      console.error('💥 Fallback OCR error:', error);
      return { success: false, error: 'Fallback OCR failed' };
    }
  }

  /**
   * Main Enhanced OCR Method - Orchestrates all stages
   */
  async performEnhancedOCR(imageBuffer) {
    console.log('🚀 Starting Enhanced OCR Pipeline...');
    
    const startTime = Date.now();

    try {
      // Stage 1: Image Preprocessing
      const imageVariants = await this.preprocessImage(imageBuffer);

      // Stage 2: License Plate Detection
      const plateDetection = await this.detectLicensePlateRegions(imageBuffer);

      // Stage 3: Multi-Attempt OCR
      const ocrAttempts = await this.performMultiAttemptOCR(imageVariants, plateDetection);

      // Stage 4: Cross-Validation
      let finalResult = null;
      if (ocrAttempts.length > 0) {
        const crossValidation = await this.crossValidateResults(ocrAttempts);
        
        if (crossValidation.success && crossValidation.confidence >= 0.6) {
          finalResult = crossValidation;
        }
      }

      // Stage 5: Fallback if needed
      if (!finalResult || finalResult.confidence < 0.6) {
        console.log('🔄 Primary methods insufficient, trying fallback...');
        const fallbackResult = await this.performFallbackOCR(imageBuffer);
        
        if (fallbackResult.success) {
          finalResult = fallbackResult;
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`⏱️ Enhanced OCR completed in ${processingTime}ms`);

      if (finalResult && finalResult.success) {
        return {
          success: true,
          license_plate: finalResult.license_plate,
          confidence: finalResult.confidence,
          method: finalResult.method || 'enhanced_multi_stage',
          processing_time: processingTime,
          pipeline_summary: {
            image_variants: imageVariants.length,
            plates_detected: plateDetection.total_plates,
            ocr_attempts: ocrAttempts.length,
            cross_validation_performed: !!finalResult.consensus_count,
            fallback_used: finalResult.method?.includes('fallback') || false
          },
          reasoning: finalResult.reasoning || 'Enhanced multi-stage OCR pipeline'
        };
      }

      return {
        success: false,
        error: 'Enhanced OCR pipeline failed - no readable license plate found',
        processing_time: processingTime,
        pipeline_summary: {
          image_variants: imageVariants.length,
          plates_detected: plateDetection.total_plates,
          ocr_attempts: ocrAttempts.length,
          all_stages_attempted: true
        }
      };

    } catch (error) {
      console.error('💥 Enhanced OCR pipeline error:', error);
      return {
        success: false,
        error: error.message || 'Enhanced OCR pipeline failed',
        processing_time: Date.now() - startTime
      };
    }
  }

  /**
   * Validate Indian license plate format
   */
  validateIndianLicensePlateFormat(plateText) {
    if (!plateText) return { valid: false, reason: 'No plate text provided' };

    const cleanPlate = plateText.replace(/\s+/g, '').toUpperCase();
    
    const patterns = [
      { regex: /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/, name: 'Standard format (XX##XX####)' },
      { regex: /^[A-Z]{2}\d{2}[A-Z]\d{4}$/, name: 'Single letter variant (XX##X####)' },
      { regex: /^[A-Z]{2}\d{4}$/, name: 'Old format (XX####)' },
      { regex: /^[A-Z]{3}\d{4}$/, name: 'Three letter format (XXX####)' }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(cleanPlate)) {
        return {
          valid: true,
          format: pattern.name,
          cleaned_plate: cleanPlate
        };
      }
    }

    return {
      valid: false,
      reason: 'Does not match any known Indian license plate format',
      cleaned_plate: cleanPlate
    };
  }
}

module.exports = new EnhancedOCRService(); 