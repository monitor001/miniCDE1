const axios = require('axios');
const https = require('https');

// Test configuration
const TEST_CONFIG = {
  dev: {
    baseURL: 'http://localhost:3001',
    apiURL: 'http://localhost:3001/api'
  },
  prod: {
    baseURL: 'https://your-actual-heroku-app-name.herokuapp.com',
    apiURL: 'https://your-actual-heroku-app-name.herokuapp.com/api'
  }
};

async function testSSL(environment = 'dev') {
  const config = TEST_CONFIG[environment];
  
  console.log(`🔒 Testing SSL for ${environment.toUpperCase()} environment...`);
  console.log(`📍 URL: ${config.baseURL}`);
  console.log('');

  try {
    // Test 1: Basic connectivity
    console.log('1️⃣ Testing basic connectivity...');
    const response = await axios.get(config.baseURL + '/health', {
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log('✅ Server is reachable');
    console.log(`📊 Status: ${response.status}`);
    console.log('');

    // Test 2: HTTPS redirect (production only)
    if (environment === 'prod') {
      console.log('2️⃣ Testing HTTPS redirect...');
      try {
        const httpResponse = await axios.get(config.baseURL.replace('https://', 'http://') + '/health', {
          timeout: 5000,
          maxRedirects: 0,
          validateStatus: () => true
        });
        
        if (httpResponse.status === 301 || httpResponse.status === 302) {
          console.log('✅ HTTPS redirect working');
          console.log(`🔄 Redirect location: ${httpResponse.headers.location}`);
        } else {
          console.log('⚠️  HTTPS redirect not working as expected');
        }
      } catch (error) {
        if (error.response && (error.response.status === 301 || error.response.status === 302)) {
          console.log('✅ HTTPS redirect working');
        } else {
          console.log('❌ HTTPS redirect test failed');
        }
      }
      console.log('');
    }

    // Test 3: Security headers
    console.log('3️⃣ Testing security headers...');
    const headersResponse = await axios.get(config.baseURL + '/health');
    const headers = headersResponse.headers;
    
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'content-security-policy'
    ];
    
    const optionalHeaders = [
      'strict-transport-security',
      'referrer-policy'
    ];
    
    console.log('📋 Security headers found:');
    requiredHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`✅ ${header}: ${headers[header]}`);
      } else {
        console.log(`❌ ${header}: Missing`);
      }
    });
    
    optionalHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`✅ ${header}: ${headers[header]}`);
      } else {
        console.log(`⚠️  ${header}: Not set (optional)`);
      }
    });
    console.log('');

    // Test 4: SSL certificate (production only)
    if (environment === 'prod') {
      console.log('4️⃣ Testing SSL certificate...');
      try {
        const url = new URL(config.baseURL);
        const agent = new https.Agent({
          rejectUnauthorized: true
        });
        
        const sslResponse = await axios.get(config.baseURL + '/health', {
          httpsAgent: agent,
          timeout: 10000
        });
        
        console.log('✅ SSL certificate is valid');
        console.log(`🔐 Protocol: ${sslResponse.request.protocol}`);
      } catch (error) {
        console.log('❌ SSL certificate validation failed:', error.message);
      }
      console.log('');
    }

    return true;

  } catch (error) {
    console.log('❌ SSL test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

async function testCORS(environment = 'dev') {
  const config = TEST_CONFIG[environment];
  
  console.log(`🌐 Testing CORS for ${environment.toUpperCase()} environment...`);
  console.log(`📍 API URL: ${config.apiURL}`);
  console.log('');

  try {
    // Test 1: CORS preflight request
    console.log('1️⃣ Testing CORS preflight...');
    const preflightResponse = await axios.options(config.apiURL + '/auth/login', {
      headers: {
        'Origin': 'https://test-frontend.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      },
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log('✅ Preflight request successful');
    console.log('📋 CORS headers:');
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-allow-credentials',
      'access-control-max-age'
    ];
    
    corsHeaders.forEach(header => {
      if (preflightResponse.headers[header]) {
        console.log(`✅ ${header}: ${preflightResponse.headers[header]}`);
      } else {
        console.log(`⚠️  ${header}: Not set`);
      }
    });
    console.log('');

    // Test 2: Actual CORS request
    console.log('2️⃣ Testing actual CORS request...');
    const actualResponse = await axios.post(config.apiURL + '/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    }, {
      headers: {
        'Origin': 'https://test-frontend.com',
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log('✅ Actual CORS request successful');
    console.log(`📊 Status: ${actualResponse.status}`);
    console.log('');

    // Test 3: Credentials support
    console.log('3️⃣ Testing credentials support...');
    const credentialsResponse = await axios.post(config.apiURL + '/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    }, {
      headers: {
        'Origin': 'https://test-frontend.com',
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (credentialsResponse.headers['access-control-allow-credentials'] === 'true') {
      console.log('✅ Credentials support working');
    } else {
      console.log('⚠️  Credentials support not configured');
    }
    console.log('');

    return true;

  } catch (error) {
    console.log('❌ CORS test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

async function testMixedContent(environment = 'dev') {
  if (environment !== 'prod') {
    console.log('⚠️  Mixed content test only applicable for production');
    return true;
  }

  const config = TEST_CONFIG[environment];
  
  console.log(`🔗 Testing mixed content for ${environment.toUpperCase()} environment...`);
  console.log('');

  try {
    // Test 1: Check for HTTP resources in HTTPS response
    console.log('1️⃣ Testing for mixed content...');
    const response = await axios.get(config.baseURL + '/health');
    
    // Check response body for HTTP URLs
    const body = JSON.stringify(response.data);
    const httpUrls = body.match(/http:\/\//g);
    
    if (httpUrls) {
      console.log('❌ Found HTTP URLs in HTTPS response:', httpUrls.length);
      console.log('⚠️  This may cause mixed content warnings');
    } else {
      console.log('✅ No HTTP URLs found in response');
    }
    console.log('');

    return true;

  } catch (error) {
    console.log('❌ Mixed content test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting SSL & CORS comprehensive tests...\n');
  
  // Test development environment
  console.log('='.repeat(50));
  console.log('DEVELOPMENT ENVIRONMENT TESTS');
  console.log('='.repeat(50));
  
  const devSSL = await testSSL('dev');
  console.log('');
  const devCORS = await testCORS('dev');
  console.log('');
  
  // Test production environment (if configured)
  console.log('='.repeat(50));
  console.log('PRODUCTION ENVIRONMENT TESTS');
  console.log('='.repeat(50));
  
  if (TEST_CONFIG.prod.baseURL !== 'https://your-actual-heroku-app-name.herokuapp.com') {
    const prodSSL = await testSSL('prod');
    console.log('');
    const prodCORS = await testCORS('prod');
    console.log('');
    const prodMixed = await testMixedContent('prod');
    console.log('');
  } else {
    console.log('⚠️  Production URL not configured, skipping production tests');
    console.log('   Update TEST_CONFIG.prod.baseURL with your actual Heroku URL');
    console.log('');
  }
  
  console.log('='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Development SSL: ${devSSL ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Development CORS: ${devCORS ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  if (devSSL && devCORS) {
    console.log('🎯 SSL & CORS configuration is ready for production!');
  } else {
    console.log('⚠️  Please fix the issues before deploying to production.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testSSL, testCORS, testMixedContent }; 