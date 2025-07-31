const axios = require('axios');

async function testLoginAndAPI() {
  try {
    console.log('Testing login and API...\n');

    // 1. Login
    console.log('1. Testing login...');
    const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@minicde.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    console.log('   Token:', token.substring(0, 50) + '...');
    console.log('   User:', loginRes.data.user.name);

    // 2. Test projects API
    console.log('\n2. Testing projects API...');
    const projectsRes = await axios.get('http://localhost:3001/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Projects API successful');
    console.log('   Projects count:', projectsRes.data.projects ? projectsRes.data.projects.length : 'No projects array');
    if (projectsRes.data.projects && projectsRes.data.projects.length > 0) {
      console.log('   Sample project:', projectsRes.data.projects[0].name);
    }

    // 3. Test users API
    console.log('\n3. Testing users API...');
    const usersRes = await axios.get('http://localhost:3001/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Users API successful');
    console.log('   Users count:', usersRes.data.users ? usersRes.data.users.length : 'No users array');
    if (usersRes.data.users && usersRes.data.users.length > 0) {
      console.log('   Sample user:', usersRes.data.users[0].name);
    }

    // 4. Test assignable users API
    console.log('\n4. Testing assignable users API...');
    if (projectsRes.data.projects && projectsRes.data.projects.length > 0) {
      const projectId = projectsRes.data.projects[0].id;
      const assignableRes = await axios.get(`http://localhost:3001/api/users/assignable?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Assignable users API successful');
      console.log('   Assignable users count:', Array.isArray(assignableRes.data) ? assignableRes.data.length : 'Not an array');
      if (Array.isArray(assignableRes.data) && assignableRes.data.length > 0) {
        console.log('   Sample assignable user:', assignableRes.data[0].name);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLoginAndAPI(); 