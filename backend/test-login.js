const axios = require('axios');

async function testLogin() {
  try {
    // Test login với user mới
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@minicde.com',
      password: '123456'
    });
    
    console.log('Login successful:', loginResponse.data);
    
    const token = loginResponse.data.token;
    
    // Test tạo issue với token
    const issueResponse = await axios.post('http://localhost:3001/api/issues', {
      title: 'Test Issue from API',
      description: 'Test Description',
      type: 'ISSUE',
      status: 'NEW',
      priority: 'MEDIUM',
      projectId: '31baea26-e4d8-4bd5-b6fa-f5564df18c68' // ID từ test trước
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Issue created successfully:', issueResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testLogin(); 