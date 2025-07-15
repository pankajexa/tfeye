// Smart color normalization function
const normalizeColorField = (rawColor) => {
  if (!rawColor) return 'UNKNOWN';
  
  const colorStr = rawColor.toString().toUpperCase().trim();
  
  // Color code mapping for common RTA abbreviations
  const colorCodeMap = {
    // Common cryptic codes
    'BHG': 'BEIGE',
    'BLK': 'BLACK',
    'BLU': 'BLUE',
    'BRN': 'BROWN', 
    'GRN': 'GREEN',
    'GRY': 'GREY',
    'RED': 'RED',
    'WHT': 'WHITE',
    'YLW': 'YELLOW',
    'SLV': 'SILVER',
    'GLD': 'GOLD',
    'ORG': 'ORANGE',
    'PNK': 'PINK',
    'VLT': 'VIOLET',
    'MAR': 'MAROON',
    'CRM': 'CREAM',
    
    // Variations and longer forms
    'AQUA TEAL': 'AQUA TEAL',
    'DARK BLUE': 'DARK BLUE',
    'LIGHT BLUE': 'LIGHT BLUE',
    'DARK GREEN': 'DARK GREEN',
    'LIGHT GREEN': 'LIGHT GREEN',
    'METALLIC SILVER': 'SILVER',
    'PEARL WHITE': 'WHITE',
    'JET BLACK': 'BLACK'
  };
  
  // Check if it's a direct mapping
  if (colorCodeMap[colorStr]) {
    return colorCodeMap[colorStr];
  }
  
  // If it's already a reasonable color name (3+ chars, contains letters)
  if (colorStr.length >= 3 && /^[A-Z\s]+$/.test(colorStr)) {
    return colorStr;
  }
  
  // If it's a short cryptic code we don't recognize
  if (colorStr.length <= 3) {
    console.log(`⚠️ Unknown color code: "${colorStr}" - mapping to UNKNOWN`);
    return `UNKNOWN (${colorStr})`;
  }
  
  // Return as-is for longer unrecognized values
  return colorStr;
};

const mapRCStatus = (status) => {
  const normalizedStatus = status?.toUpperCase();
  switch (normalizedStatus) {
    case 'ACTIVE':
    case 'VALID':
      return 'ACTIVE';
    case 'SUSPENDED':
    case 'BLOCKED':
      return 'SUSPENDED';
    case 'CANCELLED':
    case 'INVALID':
      return 'CANCELLED';
    default:
      return 'ACTIVE';
  }
};

// Transform TSeChallan response to standard format
const transformTSeChallanResponse = (apiResponse) => {
  const fullData = {
    registrationNumber: apiResponse.regnNo || apiResponse.registrationNumber || apiResponse.regNo || apiResponse.vehicleNumber,
    ownerName: apiResponse.ownerName || apiResponse.owner,
    ownerAddress: apiResponse.ownerAddress || apiResponse.address,
    vehicleClass: apiResponse.vehicleClass || apiResponse.class || apiResponse.vehicleType,
    make: apiResponse.maker || apiResponse.make || apiResponse.manufacturer,
    model: apiResponse.model || apiResponse.modelName,
    color: normalizeColorField(apiResponse.color || apiResponse.colour),
    fuelType: apiResponse.fuelType || apiResponse.fuel,
    engineNumber: apiResponse.engineNumber || apiResponse.engineNo,
    chassisNumber: apiResponse.chassisNumber || apiResponse.chassisNo,
    registrationDate: apiResponse.registrationDate || apiResponse.regDate,
    fitnessValidUpto: apiResponse.fitnessValidUpto || apiResponse.fitnessUpto,
    insuranceValidUpto: apiResponse.insuranceValidUpto || apiResponse.insuranceUpto,
    rcStatus: mapRCStatus(apiResponse.rcStatus || apiResponse.status || 'ACTIVE'),
    state: apiResponse.state || 'TELANGANA',
    rto: apiResponse.rto || apiResponse.rtoCode || apiResponse.rtaOffice
  };

  // For traffic challan processing, we primarily need these fields for AI comparison
  const essentialData = {
    registrationNumber: fullData.registrationNumber,
    make: fullData.make,
    model: fullData.model, 
    color: fullData.color,
    rcStatus: fullData.rcStatus,
    ownerName: fullData.ownerName,
    vehicleClass: fullData.vehicleClass
  };

  // Return essential data with full data available for debugging
  return {
    ...essentialData,
    _fullData: fullData  // Complete data available but not used in comparison
  };
};

module.exports = {
  normalizeColorField,
  mapRCStatus,
  transformTSeChallanResponse
}; 