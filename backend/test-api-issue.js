const axios = require('axios');

async function testApiIssue() {
  try {
    // 1. Login để lấy token
    console.log('1. Đăng nhập...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@minicde.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('Đăng nhập thành công, token:', token.substring(0, 20) + '...');
    
    // 2. Tạo issue
    console.log('\n2. Tạo issue...');
    const issueResponse = await axios.post('http://localhost:3001/api/issues', {
      title: 'Vấn đề test từ API',
      description: 'Mô tả vấn đề test',
      type: 'ISSUE',
      status: 'NEW',
      priority: 'MEDIUM',
      projectId: '31baea26-e4d8-4bd5-b6fa-f5564df18c68'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Tạo issue thành công:', issueResponse.data);
    
    // 3. Kiểm tra Activity Log
    console.log('\n3. Kiểm tra Activity Log...');
    const logResponse = await axios.get('http://localhost:3001/api/activity-logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Activity Logs:', logResponse.data);
    
  } catch (error) {
    console.error('Lỗi:', error.response?.data || error.message);
  }
}

testApiIssue(); 