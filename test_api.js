const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test function
async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test 1: Get projects
    console.log('1. Testing GET /projects');
    try {
      const projectsRes = await axios.get(`${API_BASE}/projects`);
      console.log('✅ Projects API:', projectsRes.data.projects ? projectsRes.data.projects.length : 'No projects array');
      console.log('   Response structure:', Object.keys(projectsRes.data));
    } catch (error) {
      console.log('❌ Projects API Error:', error.response?.data || error.message);
    }

    // Test 2: Get users (admin only)
    console.log('\n2. Testing GET /users');
    try {
      const usersRes = await axios.get(`${API_BASE}/users`);
      console.log('✅ Users API:', usersRes.data.users ? usersRes.data.users.length : 'No users array');
      console.log('   Response structure:', Object.keys(usersRes.data));
    } catch (error) {
      console.log('❌ Users API Error:', error.response?.data || error.message);
    }

    // Test 3: Get assignable users for project
    console.log('\n3. Testing GET /users/assignable');
    try {
      const assignableRes = await axios.get(`${API_BASE}/users/assignable?projectId=76e4f6b6-4d1a-40c7-8ce4-9cc8c320b0cc`);
      console.log('✅ Assignable Users API:', Array.isArray(assignableRes.data) ? assignableRes.data.length : 'Not an array');
      if (Array.isArray(assignableRes.data) && assignableRes.data.length > 0) {
        console.log('   Sample user:', assignableRes.data[0]);
      }
    } catch (error) {
      console.log('❌ Assignable Users API Error:', error.response?.data || error.message);
    }

    // Test 4: Get tasks
    console.log('\n4. Testing GET /tasks');
    try {
      const tasksRes = await axios.get(`${API_BASE}/tasks`);
      console.log('✅ Tasks API:', tasksRes.data.tasks ? tasksRes.data.tasks.length : 'No tasks array');
      console.log('   Response structure:', Object.keys(tasksRes.data));
    } catch (error) {
      console.log('❌ Tasks API Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('General error:', error.message);
  }
}

testAPI(); 