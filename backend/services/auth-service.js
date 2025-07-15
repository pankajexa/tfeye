const fetch = require('node-fetch');
const { TSECHALLAN_CONFIG } = require('../config');

// Token management
let authToken = null;
let tokenExpiryTime = 0;

// Get authentication token
const getAuthToken = async () => {
  console.log('🔐 Checking authentication token...');
  
  // Check if we have a valid token
  if (authToken && Date.now() < tokenExpiryTime) {
    console.log('🔄 Using cached authentication token');
    return authToken;
  }

  // Validate credentials
  if (!TSECHALLAN_CONFIG.vendorCode || !TSECHALLAN_CONFIG.vendorKey) {
    throw new Error('TSeChallan credentials not configured');
  }

  console.log('🔐 Requesting new authentication token from TSeChallan...');
  console.log('📡 Auth endpoint:', `${TSECHALLAN_CONFIG.baseUrl}/IDDetails/getAuthorization`);

  try {
    const authBody = {
      vendorCode: TSECHALLAN_CONFIG.vendorCode,
      vendorKey: TSECHALLAN_CONFIG.vendorKey
    };
    
    console.log('📤 Auth request body:', JSON.stringify({ ...authBody, vendorKey: '***HIDDEN***' }, null, 2));

    const response = await fetch(`${TSECHALLAN_CONFIG.baseUrl}/IDDetails/getAuthorization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'TSeChallanRST'
      },
      body: JSON.stringify(authBody),
      timeout: TSECHALLAN_CONFIG.timeout
    });

    console.log('📥 Auth response status:', response.status, response.statusText);
    console.log('📥 Auth response headers:', Object.fromEntries(response.headers));

    // Always try to get response body for debugging
    const responseText = await response.text();
    console.log('📄 Auth response body (raw):', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('📄 Auth response data (parsed):', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError.message);
      throw new Error(`Invalid JSON response from TSeChallan: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 500)}`);
    }
    
    if (data.responseCode === "0" && data.responseDesc) {
      authToken = data.responseDesc;
      // Token expires in 60 minutes, refresh 5 minutes early
      tokenExpiryTime = Date.now() + (55 * 60 * 1000);
      console.log('✅ Authentication token obtained successfully');
      console.log('⏰ Token will expire at:', new Date(tokenExpiryTime).toLocaleString());
      return authToken;
    } else {
      console.log('❌ Authentication failed:', data.responseDesc || data.responseMsg || 'Unknown error');
      throw new Error(`Authentication failed: ${data.responseDesc || data.responseMsg || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('💥 TSeChallan Authentication Error:', error);
    throw error;
  }
};

module.exports = {
  getAuthToken,
  getTokenExpiryTime: () => tokenExpiryTime
}; 