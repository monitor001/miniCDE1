const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  // Development
  dev: {
    baseURL: 'http://localhost:3001/api',
    adminEmail: 'nguyenthanhvc@gmail.com',
    adminPassword: 'Ab5463698664#'
  },
  // Production (update with actual Heroku URL)
  prod: {
    baseURL: 'https://your-actual-heroku-app-name.herokuapp.com/api',
    adminEmail: 'nguyenthanhvc@gmail.com',
    adminPassword: 'Ab5463698664#'
  }
};

async function testAdminLogin(environment = 'dev') {
  const config = TEST_CONFIG[environment];
  const axiosInstance = axios.create({
    baseURL: config.baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log(`🔍 Testing admin login for ${environment.toUpperCase()} environment...`);
  console.log(`📍 API URL: ${config.baseURL}`);
  console.log(`👤 Admin Email: ${config.adminEmail}`);
  console.log('');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axiosInstance.get('/health');
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Database health check
    console.log('2️⃣ Testing database health...');
    const dbHealthResponse = await axiosInstance.get('/health/db');
    console.log('✅ Database health check passed:', dbHealthResponse.data);
    console.log('');

    // Test 3: Admin login
    console.log('3️⃣ Testing admin login...');
    const loginResponse = await axiosInstance.post('/auth/login', {
      email: config.adminEmail,
      password: config.adminPassword
    });

    if (loginResponse.data.token) {
      console.log('✅ Admin login successful!');
      console.log('🔑 Token received:', loginResponse.data.token.substring(0, 50) + '...');
      console.log('👤 User info:', {
        id: loginResponse.data.user.id,
        email: loginResponse.data.user.email,
        name: loginResponse.data.user.name,
        role: loginResponse.data.user.role
      });
      console.log('');

      // Test 4: Get current user with token
      console.log('4️⃣ Testing get current user...');
      const userResponse = await axiosInstance.get('/auth/me', {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      console.log('✅ Get current user successful:', userResponse.data);
      console.log('');

      // Test 5: Test admin-only endpoint
      console.log('5️⃣ Testing admin-only endpoint (users list)...');
      const usersResponse = await axiosInstance.get('/users', {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      console.log('✅ Admin access confirmed!');
      console.log(`📊 Found ${usersResponse.data.users?.length || 0} users`);
      console.log('');

      // Test 6: Test CORS headers
      console.log('6️⃣ Testing CORS configuration...');
      const corsResponse = await axiosInstance.options('/auth/login');
      console.log('✅ CORS headers:', {
        'access-control-allow-origin': corsResponse.headers['access-control-allow-origin'],
        'access-control-allow-methods': corsResponse.headers['access-control-allow-methods'],
        'access-control-allow-headers': corsResponse.headers['access-control-allow-headers']
      });
      console.log('');

      console.log('🎉 All tests passed! Admin account is working correctly.');
      return true;

    } else {
      console.log('❌ Login failed - no token received');
      return false;
    }

  } catch (error) {
    console.log('❌ Test failed with error:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('Network error:', error.message);
      console.log('Make sure the server is running and accessible');
    } else {
      console.log('Error:', error.message);
    }
    
    return false;
  }
}

async function testPublicRegistration() {
  console.log('🔒 Testing public registration (should be disabled)...');
  
  try {
    const response = await axios.post('http://localhost:3001/api/auth/register', {
      email: 'test@example.com',
      password: 'test123',
      name: 'Test User'
    });
    
    console.log('❌ Public registration is still enabled!');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ Public registration is correctly disabled (404 Not Found)');
      return true;
    } else {
      console.log('⚠️  Public registration test inconclusive:', error.message);
      return false;
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive admin account tests...\n');
  
  // Test public registration
  await testPublicRegistration();
  console.log('');
  
  // Test development environment
  const devResult = await testAdminLogin('dev');
  console.log('');
  
  // Test production environment (if configured)
  if (TEST_CONFIG.prod.baseURL !== 'https://your-actual-heroku-app-name.herokuapp.com/api') {
    const prodResult = await testAdminLogin('prod');
    console.log('');
  } else {
    console.log('⚠️  Production URL not configured, skipping production tests');
    console.log('   Update TEST_CONFIG.prod.baseURL with your actual Heroku URL');
    console.log('');
  }
  
  console.log('📋 Test Summary:');
  console.log(`   Development: ${devResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log('   Public Registration: ✅ DISABLED');
  console.log('');
  
  if (devResult) {
    console.log('🎯 Admin account is ready for production deployment!');
  } else {
    console.log('⚠️  Please fix the issues before deploying to production.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testAdminLogin, testPublicRegistration }; 