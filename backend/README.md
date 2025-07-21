# Traffic Challan Backend

Backend service for the Traffic Challan System with TSeChallan API integration and Gemini Vision AI for traffic violation analysis.

## Features

- **TSeChallan API Integration**: Real-time vehicle data verification
- **Gemini Vision AI**: Advanced traffic violation detection and vehicle attribute extraction
- **RTA Data Verification**: Vehicle details matching with fuzzy logic
- **Image Analysis**: Upload and analyze traffic images for violations
- **CORS Enabled**: Ready for frontend integration

## Environment Variables

Create a `.env` file in the backend directory with the following:

```bash
# TSeChallan API Configuration
TSECHALLAN_API_URL=https://echallan.tspolice.gov.in/TSeChallanRST
TSECHALLAN_VENDOR_CODE=Squarebox
TSECHALLAN_VENDOR_KEY=SDF#$%jkjkh@#$MBJG8790JKH

# Google Gemini API Configuration  
GEMINI_API_KEY=your_gemini_api_key_here

# Node.js Environment
NODE_ENV=production

# Port (optional - defaults to 3001)
PORT=3001
```

## API Endpoints

### Health Check
- **GET** `/health` - Service status and configuration check

### TSeChallan Integration
- **POST** `/api/vehicle-details` - Get vehicle details by registration number
- **POST** `/api/test-credentials` - Test TSeChallan API credentials

### Gemini Image Analysis
- **POST** `/api/analyze-image` - Upload and analyze traffic images
  - Requires: `multipart/form-data` with `image` field
  - Supports: JPG, PNG, GIF (max 10MB)
  - Returns: Vehicle details, violations detected, RTA verification

- **POST** `/api/test-gemini` - Test Gemini API configuration
- **GET** `/api/rta-data` - Get sample RTA data

## Traffic Violations Detected

The system can detect the following violations:

1. **Wrong Direction Driving** - Vehicles driving against traffic flow
2. **No Helmet** - Two-wheeler riders without helmets
3. **Cell Phone Driving** - Drivers using mobile phones while driving
4. **Triple Riding or More** - Two-wheelers with 3+ passengers
5. **Extra Passengers in Driving Seat** - Auto-rickshaw with passengers next to driver
6. **Stop Line Crossing** - Vehicles crossing stop lines at signals
7. **Number Plate Font Modification** - Non-standard fonts on number plates

## Vehicle Attributes Extracted

- Vehicle Type (Car, Motorcycle, Auto-rickshaw, etc.)
- Wheel Category (Two/Three/Four-wheeler)
- Vehicle Color with confidence scores
- Vehicle Make/Brand (Hyundai, Maruti, Hero, etc.)
- Vehicle Model with confidence scores
- Number Plate Text with OCR confidence
- Direction Facing

## RTA Verification

The system performs fuzzy matching between Gemini-detected attributes and RTA database:

- **Make Matching**: Brand name similarity
- **Model Matching**: Vehicle model comparison
- **Color Matching**: Semantic color grouping and matching
- **Overall Confidence**: Combined matching score

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## Model Information

- **Gemini Model**: `gemini-2.5-pro` (exact same as Python notebook)
- **Prompt**: Comprehensive traffic analysis with vehicle extraction and violation detection
- **Image Processing**: Base64 encoding with multipart upload support

## Sample Response

```json
{
  "success": true,
  "gemini_analysis": {
    "vehicle_details": {
      "vehicle_type": "Motorcycle",
      "wheel_category": "Two-wheeler",
      "color": "Black",
      "make": "Hero",
      "model": "Splendor Plus",
      "number_plate": {
        "text": "TS21J5859",
        "confidence": {
          "score": "95.23%",
          "reason": "Clear visibility under good lighting"
        }
      }
    },
    "violations": [
      {
        "type": "No Helmet",
        "probability": "98.5%",
        "reason": "Rider clearly visible without helmet"
      }
    ]
  },
  "rta_verification": {
    "registration_number": "TS21J5859",
    "status": "VERIFIED",
    "matches": true,
    "confidence_scores": {
      "make": 100.0,
      "model": 100.0,
      "color": 85.67
    },
    "overall_score": 95.22
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Error Handling

The API returns structured error responses with specific error codes for different failure scenarios:

- `MISSING_GEMINI_KEY` - Gemini API key not configured
- `MISSING_IMAGE` - No image uploaded
- `FILE_TOO_LARGE` - Image exceeds 10MB limit
- `ANALYSIS_FAILED` - Gemini analysis error
- `CREDENTIAL_TEST_FAILED` - TSeChallan authentication failed

## Security

- File upload validation (image types only)
- File size limits (10MB max)
- Input validation for API requests
- Error message sanitization
- CORS configuration for frontend integration

## Deployment

This backend is designed to be deployed on Render.com with automatic deployments from GitHub. The service requires:

1. Environment variables configured in Render
2. IP whitelisting for TSeChallan API access
3. Gemini API key with appropriate quotas 