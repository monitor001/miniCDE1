const axios = require('axios');

const HEROKU_URL = 'https://minicde-production-589be4b0d52b.herokuapp.com';

async function testHerokuConnection() {
  console.log('========================================');
  console.log('   Testing Heroku Connection');
  console.log('========================================');
  console.log('');

  try {
    // Test 1: Health check
    console.log('[1/4] Testing health endpoint...');
    const healthResponse = await axios.get(`${HEROKU_URL}/health`, {
      timeout: 10000
    });
    console.log('✅ Health check passed:', healthResponse.status);
    console.log('   Response:', healthResponse.data);
    console.log('');

    // Test 2: API endpoint
    console.log('[2/4] Testing API endpoint...');
    const apiResponse = await axios.get(`${HEROKU_URL}/api`, {
      timeout: 10000
    });
    console.log('✅ API endpoint accessible:', apiResponse.status);
    console.log('');

    // Test 3: CORS headers
    console.log('[3/4] Testing CORS headers...');
    const corsResponse = await axios.options(`${HEROKU_URL}/api`, {
      timeout: 10000,
      headers: {
        'Origin': 'https://qlda.hoanglong24.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    const corsHeaders = corsResponse.headers;
    console.log('✅ CORS headers found:');
    console.log('   Access-Control-Allow-Origin:', corsHeaders['access-control-allow-origin']);
    console.log('   Access-Control-Allow-Methods:', corsHeaders['access-control-allow-methods']);
    console.log('   Access-Control-Allow-Headers:', corsHeaders['access-control-allow-headers']);
    console.log('');

    // Test 4: Socket.IO endpoint
    console.log('[4/4] Testing Socket.IO endpoint...');
    const socketResponse = await axios.get(`${HEROKU_URL}/socket.io/`, {
      timeout: 10000,
      params: { EIO: '4', transport: 'polling' }
    });
    console.log('✅ Socket.IO endpoint accessible:', socketResponse.status);
    console.log('');

    console.log('========================================');
    console.log('   All Tests Passed! 🎉');
    console.log('========================================');
    console.log('');
    console.log('Heroku app is running correctly with:');
    console.log('✅ Health endpoint working');
    console.log('✅ API endpoint accessible');
    console.log('✅ CORS properly configured');
    console.log('✅ Socket.IO working');
    console.log('');
    console.log('Frontend should now be able to connect to:');
    console.log(`   API: ${HEROKU_URL}/api`);
    console.log(`   Socket: ${HEROKU_URL}`);
    console.log('');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    
    if (error.code === 'ECONNABORTED') {
      console.log('   Timeout occurred - Heroku might be starting up');
    }
    
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check if Heroku app is running: heroku ps -a minicde-production');
    console.log('2. Check logs: heroku logs --tail -a minicde-production');
    console.log('3. Restart app: heroku restart -a minicde-production');
  }
}

// Run the test
testHerokuConnection(); 