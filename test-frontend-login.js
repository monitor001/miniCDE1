const axios = require('axios');

// Test frontend login functionality
async function testFrontendLogin() {
  console.log('🧪 Testing Frontend Login...');
  console.log('');
  
  const loginData = {
    email: 'nguyenthanhvc@gmail.com',
    password: 'Ab5463698664#'
  };
  
  const apiUrl = 'https://minicde-production-589be4b0d52b.herokuapp.com/api/auth/login';
  
  try {
    console.log('📡 Testing API connection...');
    console.log(`API URL: ${apiUrl}`);
    console.log(`Login Data: ${JSON.stringify(loginData, null, 2)}`);
    console.log('');
    
    const response = await axios.post(apiUrl, loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Login successful!');
    console.log('📊 Response status:', response.status);
    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.token) {
      console.log('🔐 JWT Token received');
      console.log('Token preview:', response.data.token.substring(0, 50) + '...');
    }
    
    if (response.data.user) {
      console.log('👤 User data received');
      console.log('User ID:', response.data.user.id);
      console.log('User Email:', response.data.user.email);
      console.log('User Role:', response.data.user.role);
    }
    
  } catch (error) {
    console.error('❌ Login failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Network error - no response received');
      console.error('Request details:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
  
  console.log('');
  console.log('🌐 Frontend URL: https://minicde-frontend-833302d6ab3c.herokuapp.com');
  console.log('🔗 Backend API: https://minicde-production-589be4b0d52b.herokuapp.com/api');
  console.log('');
  console.log('🔐 Admin Login:');
  console.log('   Email: nguyenthanhvc@gmail.com');
  console.log('   Password: Ab5463698664#');
}

// Run the test
testFrontendLogin(); 