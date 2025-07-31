const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCalendarDisplay() {
  try {
    console.log('Testing calendar display...');
    
    // Get all events
    const events = await prisma.calendarEvent.findMany({
      include: { project: true, createdBy: true },
      orderBy: { startDate: 'asc' }
    });
    
    console.log('Total events:', events.length);
    
    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('Today:', todayStr);
    
    // Filter today's events
    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === todayStr;
    });
    
    console.log('Events today:', todayEvents.length);
    todayEvents.forEach(event => {
      console.log(`- ${event.title} (${event.type}) at ${event.startDate}`);
    });
    
    // Test dayjs-like date comparison
    const dayjs = require('dayjs');
    const todayDayjs = dayjs();
    
    console.log('\nTesting dayjs comparison:');
    todayEvents.forEach(event => {
      const eventDate = dayjs(event.startDate);
      const isSameDay = todayDayjs.isSame(eventDate, 'day');
      const eventDateStr = eventDate.format('YYYY-MM-DD');
      const todayStr2 = todayDayjs.format('YYYY-MM-DD');
      
      console.log(`Event: ${event.title}`);
      console.log(`  Event date: ${eventDateStr}`);
      console.log(`  Today: ${todayStr2}`);
      console.log(`  Same day: ${isSameDay}`);
      console.log(`  String comparison: ${eventDateStr === todayStr2}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCalendarDisplay(); 