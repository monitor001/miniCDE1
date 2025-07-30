const axios = require('axios');

async function testLogin() {
  const baseURL = 'https://minicde-production-589be4b0d52b.herokuapp.com';
  
  console.log('🔍 Testing login endpoint...');
  console.log(`📍 Base URL: ${baseURL}`);
  
  try {
    // Test the correct endpoint
    const loginURL = `${baseURL}/api/auth/login`;
    console.log(`🔗 Testing URL: ${loginURL}`);
    
    const response = await axios.post(loginURL, {
      email: 'admin@example.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Login endpoint is working!');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', response.data);
    
  } catch (error) {
    console.error('❌ Login test failed:');
    console.error('📊 Status:', error.response?.status);
    console.error('📋 Error data:', error.response?.data);
    console.error('🔗 URL attempted:', error.config?.url);
    
    if (error.response?.status === 404) {
      console.error('💡 404 Error - Endpoint not found. This might indicate:');
      console.error('   - Backend server is not running');
      console.error('   - Route is not properly configured');
      console.error('   - URL path is incorrect');
    }
  }
}

// Test the incorrect endpoint that was causing the issue
async function testIncorrectEndpoint() {
  const baseURL = 'https://minicde-production-589be4b0d52b.herokuapp.com';
  
  console.log('\n🔍 Testing the incorrect endpoint that was causing the issue...');
  
  try {
    // Test the incorrect endpoint (double /api)
    const incorrectURL = `${baseURL}/api/api/auth/login`;
    console.log(`🔗 Testing incorrect URL: ${incorrectURL}`);
    
    const response = await axios.post(incorrectURL, {
      email: 'admin@example.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('⚠️  Incorrect endpoint is working (unexpected)');
    
  } catch (error) {
    console.log('✅ Incorrect endpoint correctly returns 404 (expected)');
    console.log('📊 Status:', error.response?.status);
  }
}

async function runTests() {
  console.log('🚀 Starting login endpoint tests...\n');
  
  await testLogin();
  await testIncorrectEndpoint();
  
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error); 