const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001/api';
const TEST_PROJECT_ID = 'test-project-id'; // Replace with actual project ID

// Test functions
async function testProjectStats() {
  try {
    console.log('Testing project statistics...');
    const response = await axios.get(`${BASE_URL}/projects/${TEST_PROJECT_ID}/stats`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    console.log('✅ Project stats:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Project stats error:', error.response?.data || error.message);
    return false;
  }
}

async function testProjectExport() {
  try {
    console.log('Testing project export...');
    const response = await axios.get(`${BASE_URL}/projects/${TEST_PROJECT_ID}/export?format=xlsx`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      },
      responseType: 'blob'
    });
    console.log('✅ Project export successful, size:', response.data.length);
    return true;
  } catch (error) {
    console.error('❌ Project export error:', error.response?.data || error.message);
    return false;
  }
}

async function testProjectShare() {
  try {
    console.log('Testing project share...');
    const response = await axios.post(`${BASE_URL}/projects/${TEST_PROJECT_ID}/share`, {
      email: 'test@example.com',
      message: 'Test share message'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    console.log('✅ Project share:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Project share error:', error.response?.data || error.message);
    return false;
  }
}

async function testProjectComments() {
  try {
    console.log('Testing project comments...');
    
    // Get comments
    const getResponse = await axios.get(`${BASE_URL}/projects/${TEST_PROJECT_ID}/comments`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    console.log('✅ Get comments:', getResponse.data);
    
    // Add comment
    const addResponse = await axios.post(`${BASE_URL}/projects/${TEST_PROJECT_ID}/comments`, {
      content: 'Test comment from automated test'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    console.log('✅ Add comment:', addResponse.data);
    
    return true;
  } catch (error) {
    console.error('❌ Project comments error:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Project Card Tests...\n');
  
  const results = await Promise.allSettled([
    testProjectStats(),
    testProjectExport(),
    testProjectShare(),
    testProjectComments()
  ]);
  
  console.log('\n📊 Test Results:');
  results.forEach((result, index) => {
    const testNames = ['Project Stats', 'Project Export', 'Project Share', 'Project Comments'];
    if (result.status === 'fulfilled' && result.value) {
      console.log(`✅ ${testNames[index]}: PASSED`);
    } else {
      console.log(`❌ ${testNames[index]}: FAILED`);
    }
  });
  
  console.log('\n✨ Test suite completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testProjectStats,
  testProjectExport,
  testProjectShare,
  testProjectComments,
  runTests
}; 