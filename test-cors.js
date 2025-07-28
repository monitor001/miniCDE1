const axios = require('axios');

// Test CORS configuration between frontend and backend
async function testCORS() {
  console.log('🧪 Testing CORS Configuration...');
  console.log('');
  
  const frontendURL = 'https://minicde-frontend-833302d6ab3c.herokuapp.com';
  const backendURL = 'https://minicde-production-589be4b0d52b.herokuapp.com';
  const apiURL = `${backendURL}/api/auth/login`;
  
  try {
    console.log(`📡 Testing CORS from ${frontendURL} to ${backendURL}`);
    console.log('');
    
    const response = await axios.post(apiURL, 
      {
        email: 'nguyenthanhvc@gmail.com',
        password: 'Ab5463698664#'
      }, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': frontendURL
        },
        timeout: 10000
      }
    );
    
    console.log('✅ CORS Test Successful!');
    console.log('📊 Response status:', response.status);
    console.log('📄 Response headers:', JSON.stringify(response.headers, null, 2));
    
    if (response.headers['access-control-allow-origin']) {
      console.log('🔐 CORS Headers:');
      console.log('  Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
      console.log('  Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials']);
      console.log('  Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);
    } else {
      console.log('⚠️ No CORS headers found in response');
    }
    
    if (response.data.token) {
      console.log('✅ Login also successful!');
      console.log('Token preview:', response.data.token.substring(0, 50) + '...');
    }
    
  } catch (error) {
    console.error('❌ CORS Test Failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
      
      if (error.response.headers['access-control-allow-origin']) {
        console.log('🔐 CORS Headers (from error response):');
        console.log('  Access-Control-Allow-Origin:', error.response.headers['access-control-allow-origin']);
        console.log('  Access-Control-Allow-Credentials:', error.response.headers['access-control-allow-credentials']);
        console.log('  Access-Control-Allow-Methods:', error.response.headers['access-control-allow-methods']);
      }
    } else if (error.request) {
      console.error('No response received');
      console.error('Request details:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    if (error.message.includes('CORS')) {
      console.error('❌ This is a CORS error. The server is not allowing requests from the frontend origin.');
      console.error('Suggested fixes:');
      console.error('1. Check that the CORS_ORIGIN environment variable is set correctly on the backend');
      console.error(`2. Make sure the backend's CORS configuration includes '${frontendURL}'`);
      console.error('3. Verify that the backend is properly handling preflight OPTIONS requests');
    }
  }
  
  console.log('');
  console.log('🌐 Frontend URL:', frontendURL);
  console.log('🔗 Backend API:', backendURL + '/api');
  console.log('');
}

// Run the test
testCORS(); 