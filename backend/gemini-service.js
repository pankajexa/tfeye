const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const visionService = require('./vision-service');

// Initialize Gemini client - using the same approach as Python notebook
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper functions ported from Python notebook
function cleanRegistrationNumber(text) {
  /**
   * Cleans OCR output to return only valid alphanumeric vehicle registration numbers.
   * Removes unwanted characters like '*', '·', '.', '-', or spaces.
   */
  const cleaned = text.replace(/[^A-Z0-9]/g, '').toUpperCase();
  return cleaned;
}

function normalize(text) {
  return text ? String(text).trim().toLowerCase() : "";
}

function fuzzyScore(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);
  
  if (!normA || !normB) {
    return 0.0;
  }

  // Regex match: Gemini model appears anywhere in RTA model or vice versa
  const pattern = new RegExp(`\\b${normA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  if (pattern.test(normB)) {
    return 100.0;
  }

  const patternRev = new RegExp(`\\b${normB.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  if (patternRev.test(normA)) {
    return 100.0;
  }

  // Fallback: fuzzy similarity using simple algorithm
  const similarity = stringSimilarity(normA, normB);
  return Math.round(100 * similarity * 100) / 100;
}

function stringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  return track[str2.length][str1.length];
}

function colorMatchScore(geminiColor, rtaColor) {
  // Define synonymous color buckets
  const colorGroups = {
    "white": new Set(["white", "silver", "offwhite", "cream", "ivory"]),
    "black": new Set(["black"]),
    "grey": new Set(["grey", "gray", "ash", "charcoal"]),
    "blue": new Set(["blue", "navy", "skyblue", "darkblue", "lightblue"]),
    "red": new Set(["red", "maroon", "crimson"]),
    "green": new Set(["green", "olive", "darkgreen", "lightgreen"]),
    "yellow": new Set(["yellow", "gold", "mustard"]),
    "brown": new Set(["brown", "beige", "tan"]),
    "orange": new Set(["orange"]),
    "purple": new Set(["purple", "violet", "lavender"]),
    "pink": new Set(["pink", "rose", "peach"])
  };

  function normalizeColors(c) {
    const ignoreWords = new Set(["dark", "light", "metallic", "matte", "pearl", "shiny", "bright", "and"]);
    let colorTokens;
    
    if (Array.isArray(c)) {
      colorTokens = c.map(col => normalize(col));
    } else {
      colorTokens = normalize(c).split(/[,/& ]+/);
    }
    
    return new Set(colorTokens.filter(token => token && !ignoreWords.has(token)));
  }

  const gColors = normalizeColors(geminiColor);
  const rColors = normalizeColors(rtaColor);

  if (gColors.size === 0 || rColors.size === 0) {
    return 0.0;
  }

  // Map tokens to groups
  function findGroup(token) {
    for (const [key, group] of Object.entries(colorGroups)) {
      if (group.has(token)) {
        return key;
      }
    }
    return token; // fallback: use token as-is
  }

  const gGroups = new Set([...gColors].map(c => findGroup(c)));
  const rGroups = new Set([...rColors].map(c => findGroup(c)));

  const intersection = new Set([...gGroups].filter(x => rGroups.has(x)));
  return Math.round(100 * intersection.size / Math.max(gGroups.size, rGroups.size) * 100) / 100;
}

function verifyVehicleWithConfidence(geminiOutput, rtaData) {
  const regNo = normalize(geminiOutput.number_plate).replace(/ /g, "");
  const matchedRow = rtaData.find(row => 
    normalize(row["Registration Number"]).replace(/ /g, "") === regNo
  );

  if (!matchedRow) {
    return {
      registration_number: geminiOutput.number_plate,
      status: "NOT FOUND",
      matches: false,
      confidence_scores: {
        make: 0.0,
        model: 0.0,
        color: 0.0
      },
      overall_score: 0.0,
      comparison_details: {
        make: { 
          rta: 'Not Found', 
          ai: geminiOutput.make, 
          match: false 
        },
        model: { 
          rta: 'Not Found', 
          ai: geminiOutput.model, 
          match: false 
        },
        color: { 
          rta: 'Not Found', 
          ai: geminiOutput.color, 
          match: false 
        }
      }
    };
  }

  const makeScore = fuzzyScore(geminiOutput.make, matchedRow.Make);
  const modelScore = fuzzyScore(geminiOutput.model, matchedRow.Model);
  const colorScore = colorMatchScore(geminiOutput.color, matchedRow.Colour);

  // Debug logging to track field mapping
  console.log('🔍 RTA Comparison Debug:');
  console.log(`  AI detected -> Make: "${geminiOutput.make}", Model: "${geminiOutput.model}", Color: "${geminiOutput.color}"`);
  console.log(`  RTA database -> Make: "${matchedRow.Make}", Model: "${matchedRow.Model}", Color: "${matchedRow.Colour}"`);
  console.log(`  Match scores -> Make: ${makeScore}, Model: ${modelScore}, Color: ${colorScore}`);

  const modelUnknown = ["unknown", ""].includes(normalize(geminiOutput.model));
  const overallScore = Math.round((makeScore + modelScore + colorScore) / 3 * 100) / 100;

  // Enhanced logic
  let matchFlag = false;
  if (makeScore >= 80) {
    if (modelScore >= 80 || modelUnknown) {
      matchFlag = true;
    }
  }

  return {
    registration_number: matchedRow["Registration Number"],
    status: matchFlag ? "VERIFIED" : "LOW CONFIDENCE",
    matches: matchFlag,
    confidence_scores: {
      make: makeScore,
      model: modelScore,
      color: colorScore
    },
    overall_score: overallScore,
    comparison_details: {
      make: { 
        rta: matchedRow.Make, 
        ai: geminiOutput.make, 
        match: makeScore >= 80 
      },
      model: { 
        rta: matchedRow.Model, 
        ai: geminiOutput.model, 
        match: modelScore >= 80 || ["unknown", ""].includes(normalize(geminiOutput.model))
      },
      color: { 
        rta: matchedRow.Colour, 
        ai: geminiOutput.color, 
        match: colorScore >= 60 // Slightly lower threshold for color
      }
    }
  };
}

// The exact prompt from your notebook
const TRAFFIC_ANALYSIS_PROMPT = `
**ROLE for Priority 1:**
You are an expert **Vehicle Attribute Extractor AI** specialized in analyzing street-level traffic images.

**OBJECTIVE for Priority 1:**
Analyze the image and extract attributes of the **primary vehicle**, which is defined as:
- The **most centrally located**, **visually dominant** and **vehicle violating traffic rules** in the image.

**Priority 1: Primary Vehicle Extraction:** Extract the following details **only for the primary vehicle**
1. **Vehicle Type**: (e.g., Car, Motorcycle, Auto-rickshaw)
2. **Wheel Category**: Two-wheeler / Three-wheeler / Four-wheeler
3. **Vehicle Color**: Return the primary visible color(s). If multiple colors are equally prominent (e.g., two-tone vehicles), return a list of up to 2 major colors.
4. **Vehicle Make (Brand)**: (e.g., Hyundai, Maruti Suzuki, Hero)
5. **Vehicle Model**: If identifiable (e.g., i10, Activa, Alto)
6. **Number Plate Text**:
  - Provide full number (if visible)
  - If blurred, return most probable characters
  - Mark unreadable characters as \`*\`
7. **Direction Facing**: Approximate angle (e.g., Front-facing, Side-facing)

**Confidence Scores (MANDATORY)**:
Provide a **confidence score (0-100%)** for each of the following fields **along with a brief reason** explaining the basis of that score. Use floating-point values between 0–100%, with 1–2 decimal places. Avoid rounding or restricting to steps like .0 or .5 — use naturally occurring values.

For each field, return a dictionary with:
- \`score\`: the percentage value (e.g., "87.56%")
- \`reason\`: concise reason explaining why this confidence score is assigned (e.g., "Color is clearly visible under natural light without occlusion").

Required Fields:
- Color
- Make
- Model
- Number Plate

If a field is not identifiable from the image, return "Unknown" and a score of 0.00%, with reason (e.g., "Branding fully obscured by glare").

**Rules:**
- Be concise and objective.
- Do NOT hallucinate any details.
- Use "Unknown" if a field is not identifiable from the image.
- If you are not confident enough in reading the number plate, do not guess or fabricate any characters. Instead, represent unreadable or uncertain characters with asterisks (*).

**Role and Task for Priority 2:** You are a Traffic Violation Classifier, analyze the traffic-related image and determine whether any traffic violations are present. If a violation is detected, classify the specific traffic rule that has been violated. Additionally, provide a probability score indicating the confidence level of the violation detection and classification.

**Instructions for Priority 2:**
- Your primary task is to analyze the provided image to identify the main vehicle in focus—that is, the vehicle most visually prominent or central in the scene. Once the main vehicle is clearly identified, assess whether it is involved in any traffic violations based on the visual evidence. If a violation is detected, classify it based on a predefined list of possible violations. Additionally, provide a probability score indicating the confidence level of both the vehicle identification and the violation detection.

**Contextual Note:** Indian vehicles always drive on the left-hand side. Use this rule to infer legal direction. Any vehicle driving on the right side or moving toward oncoming traffic on a two-way road is likely in violation.

**Priority 2.1: Traffic Violation Analysis**
- **Identify Traffic Violations:** After identifying the vehicle, examine the image again specifically for traffic violations related to that vehicle. Identify **only** violations from the specific list below that are clearly visible.
- *Violation List (Mandatory - Choose ONLY from this list):**
    **Wrong Direction Driving (Opposite Side of the Road)** — A vehicle is considered in violation if:
    - **Visual Cue to Detect:** Detect vehicles moving against the legal flow of traffic in a lane meant for oncoming vehicles.
    - Traffic Flow Analysis: Identify the legal direction of traffic using the movement of other vehicles. Identify the vehicle moving in oppisite direction with other vehicles. Flag vehicles that are traveling opposite to this direction.
    - Vehicle Orientation: Analyze vehicle orientation and movement trajectory relative to other vehicles. Highlight if a vehicle is entering from a wrong end, such as turning into an exit or the wrong way.
    - Identify if any vehicle is driving on the wrong side of a two-way road. In Indian roads, vehicles must always drive on the left-hand side. Evaluate the flow of traffic, orientation of other vehicles, and the lane positioning of each vehicle.
    -Clearly identify front or back of each vehicle. If the front of a vehicle faces the front of other vehicles, it may be in violation.
    - Look for headlights versus taillights, license plate position, windshield orientation, or seating direction.
    - If other vehicles are showing their backs (taillights), and one vehicle is showing its front (headlights), flag it.
    - Flag a violation if:
      - A vehicle is facing or moving against the direction of the general traffic flow.
      - It is approaching other vehicles head-on or traveling in an unusual direction on a clearly demarcated road.
      - A vehicle is occupying the right-hand lane while other vehicles are moving on the left side in the same lane.
      - The rear or front side of the violating vehicle is clearly visible and facing toward oncoming vehicles(opposite direction).
      - If a road is designated as a one-way street, traffic will flow in a single direction on both sides of the divider. Even though the road may be physically divided, vehicles on both sides must travel in the same direction. Any vehicle moving in the opposite direction should be considered a wrong-side driving violation.
      - Do not depend on road signs completely. Instead, use spatial orientation, vehicle direction, and flow of adjacent traffic for assessment.

    **No Helmet**:
    - Visual Cue to Detect: Look specifically at the head of the two-wheeler rider
    - Driver on a two-wheeler not wearing helmets.
    - The driver of a two-wheeler (motorcycle, scooter, moped, etc.) must be wearing a helmet securely fastened on the head.
    - A violation is considered if:
    - The rider is not wearing a helmet at all.
    - The helmet is visibly present but not worn properly (e.g., hanging on the arm, placed on the fuel tank, or worn without fastening the strap).

    **Cell Phone Driving** — This violation is detected when:
    - **Visual Cue to Detect:** Look for the driver's right or left hand holding a phone close to the ear or talking on a call while driving the vehicle.
    - The driver is visibly holding or using a mobile phone while operating the vehicle.
    - Typical indicators include the phone being held to the ear, visible in hand while riding/driving, or positioned against the head.
    - Even if the rider has placed the mobile phone inside the helmet and is using it to talk while riding, it is considered a violation.
    - This violation is considered a violation regardless of signal status if there is visible signage or markings.
    - **Detect if the driver is holding a mobile phone between their shoulder and ear, typically indicated by a tilted head or bent neck posture, suggesting cell phone use while driving.**

    **Triple Riding or More:**
    - Two-wheeler with three or more persons (including the driver).

    **Extra Passengers in Driving Seat:**
    - **Visual Cue to Detect:** Look for Auto-rickshaw or three-wheeler with passengers seated next to the driver in the designated driver's area.
    - It is only applicable to three-wheeler.

    **Stop Line Crossing** — A vehicle is considered in violation if:
    - **Visual Cue to Detect:** Detect a solid white line just before a zebra crossing; consider it a stop line even if partially faded or worn.
    - The front wheels of the vehicle are past the marked line that separates the vehicle zone from the pedestrian crossing zone.
    - If the vehicle is positioned beyond the white stop line near a zebra crossing or signal post. If vehicle is not beyond the white stop line, it is not considered a violation regardless of signal status.
    - Analyze the image thoroughly to detect faded or worn-out stop lines, ensuring stop line presence is considered even if partially shaded or degraded over time.
    - The LLM should focus on identifying stop line violations *only when a white stop line is present before or after or adjacent to a zebra crossing**; Do not consider this violation for the cases where the zebra crossing exists without a *visible white stop line*.
    - Consider if there is a clear stop line across the entire road width, typically seen as broad horizontal white lines.
    - Do not confuse road edge or lane markings as stop lines.

    **Number Plate Font Modification** — A vehicle is considered in violation if:
    - **Visual Cue to Detect:** Check if the vehicle's number plate uses the standard Indian number plate font — clear, uniform, and unaltered. Flag plates with stylized, decorative, cursive, stretched, or distorted fonts.
    - Font Compliance Check: Verify that the text on the number plate matches the Indian standard number plate font (as per AIS-063 or prescribed RTO norms). Detect and flag non-standard fonts, including cursive, italic, artistic, handwritten, overly bold, or compressed text.

**Priority 2.2: Violation Probability:** For each violation identified from the list above, assign a probability score (Confidence Scores, e.g., 95%) indicating your confidence that the violation is occurring based on the visual evidence. If no violations from the list are detected, state this clearly.
- For each violation detected, along with the "probability" score, also provide a "reason" field that briefly explains the visual evidence or cues leading to that confidence score.
- The "reason" should be concise but specific (e.g., "Vehicle facing opposite traffic flow with visible headlights towards oncoming vehicles").
- If no violations are detected, return an empty list or "None Detected" with no reason needed.

**Important Clarification:**
- If **any visual evidence of a violation** is found, return it along with a realistic **confidence score**. Do **not skip** violations just because the confidence is not very high.
- Even if a violation is **not clearly confirmed**, still analyze and report it if there is **visual evidence suggesting the possibility**. Assign a **lower confidence score** (e.g., 40%-70%) for uncertain visible cases.
- However, if **no visual evidence** matches any of the predefined violations — even at low confidence — then **do not guess**. Leave the \`"violations"\` list **empty**.
- Do **not omit a violation** just because its confidence is low. If any signs match a violation type (even faintly), include it with a low probability like 35–60%.
- If **no signs or cues** match any violations, return an empty list [] or state "None Detected".
- Do not generate violations by assumption or guesswork.

**Output Format:**

Present the results clearly, structured as follows (JSON format preferred):
{
  "vehicle_details": {
    "vehicle_type": "",
    "wheel_category": "",
    "color": "",
    "make": "",
    "model": "",
    "number_plate": {
      "text": "",
      "confidence": {
        "score": "",
        "reason": ""
      }
    },
    "confidence_scores": {
      "color": {
        "score": "",
        "reason": ""
      },
      "make": {
        "score": "",
        "reason": ""
      },
      "model": {
        "score": "",
        "reason": ""
      }
    }
  },
  "violations": [
    {
      "type": "Name of Violation from List",
      "probability": "<probability_percentage>%",
       "reason": ""
    }
  ]
}
`;

// Main hybrid analysis function - Vision API for plates + Gemini for everything else
async function analyzeTrafficImage(imageBuffer, rtaData = null) {
  try {
    console.log('🔍 Starting hybrid traffic image analysis (Vision API + Gemini)...');
    
    // Step 1: Use Google Cloud Vision API for license plate detection
    console.log('📍 Step 1: License plate detection with Google Cloud Vision API...');
    const visionPlateResult = await visionService.detectLicensePlate(imageBuffer);
    
    // Step 2: Use Gemini for vehicle details and violation detection
    console.log('📍 Step 2: Vehicle analysis with Gemini AI...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert buffer to the format Gemini expects
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };

    console.log('📡 Sending request to Gemini API...');
    
    // Generate content with the prompt and image
    const result = await model.generateContent([TRAFFIC_ANALYSIS_PROMPT, imagePart]);
    const response = await result.response;
    let rawContent = response.text().trim();

    console.log('📥 Raw Gemini response received');

    // Clean up the response (remove code block markers)
    if (rawContent.startsWith("```json")) {
      rawContent = rawContent.substring(7).trim();
    }
    if (rawContent.endsWith("```")) {
      rawContent = rawContent.substring(0, rawContent.length - 3).trim();
    }

    // Parse JSON response
    const geminiResult = JSON.parse(rawContent);
    console.log('✅ Gemini analysis completed successfully');

    // Step 3: Merge Vision API plate detection with Gemini analysis
    console.log('📍 Step 3: Merging Vision API and Gemini results...');
    
    let finalPlateData;
    if (visionPlateResult.success) {
      console.log(`🎯 Using Vision API plate: "${visionPlateResult.plateNumber}" (confidence: ${visionPlateResult.confidence}%)`);
      finalPlateData = {
        text: visionPlateResult.plateNumber,
        confidence: {
          score: `${visionPlateResult.confidence}%`,
          reason: `Detected via Google Cloud Vision API specialized for license plates. ${visionPlateResult.region === 'Telangana' ? 'Recognized as Telangana format.' : ''}`
        },
        detection_method: visionPlateResult.method,
        original_text: visionPlateResult.originalText,
        region: visionPlateResult.region,
        vision_candidates: visionPlateResult.allCandidates
      };
    } else {
      console.log('⚠️ Vision API failed, using Gemini plate detection as fallback');
      finalPlateData = {
        text: geminiResult.vehicle_details?.number_plate?.text || 'NOT_DETECTED',
        confidence: geminiResult.vehicle_details?.number_plate?.confidence || {
          score: '0%',
          reason: 'Both Vision API and Gemini failed to detect reliable plate number'
        },
        detection_method: 'Gemini AI (fallback)',
        vision_error: visionPlateResult.error
      };
    }

    // Create enhanced analysis result
    const enhancedAnalysis = {
      ...geminiResult,
      vehicle_details: {
        ...geminiResult.vehicle_details,
        number_plate: finalPlateData
      }
    };

    // Step 4: RTA verification using the best available plate number
    let verification = null;
    if (rtaData && finalPlateData.text && finalPlateData.text !== 'NOT_DETECTED') {
      console.log('📍 Step 4: RTA verification with detected plate...');
      const geminiOutput = {
        number_plate: cleanRegistrationNumber(finalPlateData.text),
        make: geminiResult.vehicle_details?.make || 'Unknown',
        model: geminiResult.vehicle_details?.model || 'Unknown',
        color: geminiResult.vehicle_details?.color || 'Unknown'
      };

      verification = verifyVehicleWithConfidence(geminiOutput, rtaData);
      console.log('🔍 RTA verification completed');
    } else {
      console.log('⚠️ Skipping RTA verification - no reliable plate number detected');
    }

    // Step 5: Return comprehensive results
    const result_summary = {
      plate_detection: {
        method: visionPlateResult.success ? 'Google Cloud Vision API' : 'Gemini AI (fallback)',
        success: visionPlateResult.success || (finalPlateData.text !== 'NOT_DETECTED'),
        confidence: visionPlateResult.success ? visionPlateResult.confidence : 0,
        detected_plate: finalPlateData.text
      },
      vehicle_analysis: {
        method: 'Gemini AI',
        success: !!geminiResult.vehicle_details,
        violations_detected: geminiResult.violations?.length || 0
      },
      rta_verification: {
        performed: !!verification,
        success: verification?.status === 'VERIFIED'
      }
    };

    console.log('✅ Hybrid analysis completed:', result_summary);

    return {
      success: true,
      gemini_analysis: enhancedAnalysis,
      rta_verification: verification,
      analysis_summary: result_summary,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('💥 Hybrid analysis error:', error);
    return {
      success: false,
      error: error.message,
      errorCode: 'HYBRID_ANALYSIS_FAILED'
    };
  }
}

module.exports = {
  analyzeTrafficImage,
  cleanRegistrationNumber,
  normalize,
  fuzzyScore,
  colorMatchScore,
  verifyVehicleWithConfidence
}; 