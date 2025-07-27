const axios = require('axios');

async function testCalendarAPI() {
  try {
    // Login to get token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@minicde.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token:', token.substring(0, 50) + '...');
    
    // Test calendar API
    const calendarResponse = await axios.get('http://localhost:3001/api/calendar', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Calendar API response:');
    console.log('Total events:', calendarResponse.data.length);
    
    // Show today's events
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const todayEvents = calendarResponse.data.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === todayStr;
    });
    
    console.log('Events today:', todayEvents.length);
    todayEvents.forEach(event => {
      console.log(`- ${event.title} (${event.type}) at ${event.startDate}`);
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testCalendarAPI(); 