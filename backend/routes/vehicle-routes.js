const express = require('express');
const fetch = require('node-fetch');
const { TSECHALLAN_CONFIG, SAMPLE_RTA_DATA } = require('../config');
const { validateRegistrationNumber } = require('../utils/validation');
const { getAuthToken, getTokenExpiryTime } = require('../services/auth-service');
const { transformTSeChallanResponse } = require('../services/rta-service');

const router = express.Router();

// Get vehicle details from TSeChallan
router.post('/api/vehicle-details', async (req, res) => {
  try {
    const { registrationNumber } = req.body;
    
    console.log('🚗 Vehicle lookup request for:', registrationNumber);
    console.log('📡 Request from IP:', req.ip || req.connection.remoteAddress);

    // Validate input
    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        error: 'Registration number is required',
        errorCode: 'MISSING_REGISTRATION_NUMBER'
      });
    }

    // Basic validation - just ensure it's reasonable input
    if (!validateRegistrationNumber(registrationNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Registration number must be between 3 and 20 characters',
        errorCode: 'INVALID_INPUT'
      });
    }

    console.log('🟢 Using TSeChallan API for vehicle lookup:', registrationNumber);
    console.log('📡 API Endpoint:', TSECHALLAN_CONFIG.baseUrl);
    console.log('🔑 Vendor Code:', TSECHALLAN_CONFIG.vendorCode);

    // Get authentication token
    console.log('🔐 Fetching authentication token...');
    const token = await getAuthToken();
    console.log('✅ Authentication successful, token obtained');

    console.log('📋 Making vehicle details request...');
    const requestBody = {
      vendorCode: TSECHALLAN_CONFIG.vendorCode,
      userID: "TG1",
      idCode: "1",
      idDetails: registrationNumber.toUpperCase()
    };
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

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

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`TSeChallan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📄 Response data:', JSON.stringify(data, null, 2));
    
    if (data.responseCode === "0" && data.responseDesc === "Success" && data.data) {
      console.log('✅ Vehicle data found successfully');
      res.json({
        success: true,
        data: transformTSeChallanResponse(data.data)
      });
    } else if (data.responseCode !== "0") {
      console.log('❌ Vehicle not found or API error:', data.responseDesc || data.responseMsg);
      res.json({
        success: false,
        error: data.responseDesc || data.responseMsg || 'Vehicle not found in RTA database',
        errorCode: 'NOT_FOUND'
      });
    } else {
      console.log('❓ Unexpected response format:', data);
      res.json({
        success: false,
        error: data.responseDesc || data.responseMsg || 'Unknown TSeChallan API error',
        errorCode: 'API_ERROR'
      });
    }

  } catch (error) {
    console.error('💥 Vehicle lookup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      errorCode: 'SERVER_ERROR'
    });
  }
});

// Test endpoint for quick credential verification
router.post('/api/test-credentials', async (req, res) => {
  try {
    console.log('🧪 Testing TSeChallan credentials...');
    
    if (!TSECHALLAN_CONFIG.vendorCode || !TSECHALLAN_CONFIG.vendorKey) {
      return res.status(400).json({
        success: false,
        error: 'TSeChallan credentials not configured',
        errorCode: 'MISSING_CREDENTIALS'
      });
    }

    // Just test authentication
    const token = await getAuthToken();
    
    res.json({
      success: true,
      message: 'TSeChallan credentials are valid',
      timestamp: new Date().toISOString(),
      tokenExpiry: new Date(getTokenExpiryTime()).toISOString()
    });

  } catch (error) {
    console.error('💥 Credential test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Credential test failed',
      errorCode: 'CREDENTIAL_TEST_FAILED'
    });
  }
});

// Get RTA sample data endpoint
router.get('/api/rta-data', (req, res) => {
  try {
    console.log('📋 RTA data request received');
    
    res.json({
      success: true,
      data: SAMPLE_RTA_DATA,
      count: SAMPLE_RTA_DATA.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 RTA data error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get RTA data',
      errorCode: 'RTA_DATA_FAILED'
    });
  }
});

module.exports = router; 