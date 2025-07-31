const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const FRONTEND_URL = 'http://localhost:3001';

async function testSystem() {
  console.log('🚀 Testing MiniCDE Docker Local System...\n');

  try {
    // Test 1: Backend Health Check
    console.log('1. Testing Backend Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend Health Check:', healthResponse.status);
    console.log('   Response:', healthResponse.data);

    // Test 2: Frontend Access
    console.log('\n2. Testing Frontend Access...');
    const frontendResponse = await axios.get(FRONTEND_URL);
    console.log('✅ Frontend Access:', frontendResponse.status);
    console.log('   Content-Type:', frontendResponse.headers['content-type']);

    // Test 3: Login
    console.log('\n3. Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@minicde.com',
      password: 'admin123'
    });
    console.log('✅ Login Success:', loginResponse.status);
    console.log('   User:', loginResponse.data.user.email);
    console.log('   Role:', loginResponse.data.user.role);

    const token = loginResponse.data.token;

    // Test 4: Protected API with Token
    console.log('\n4. Testing Protected API...');
    const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Users API:', usersResponse.status);
    console.log('   Users Count:', usersResponse.data.length);

    // Test 5: Projects API
    console.log('\n5. Testing Projects API...');
    const projectsResponse = await axios.get(`${BASE_URL}/api/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Projects API:', projectsResponse.status);
    console.log('   Projects Count:', projectsResponse.data.length);

    // Test 6: Tasks API
    console.log('\n6. Testing Tasks API...');
    const tasksResponse = await axios.get(`${BASE_URL}/api/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Tasks API:', tasksResponse.status);
    console.log('   Tasks Count:', tasksResponse.data.length);

    console.log('\n🎉 All tests passed! MiniCDE Docker Local System is working correctly.');
    console.log('\n📋 System Summary:');
    console.log('   Backend API: http://localhost:3002');
    console.log('   Frontend App: http://localhost:3001');
    console.log('   Database: PostgreSQL on port 5432');
    console.log('   Redis: Redis on port 6379');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: admin@minicde.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

testSystem(); 