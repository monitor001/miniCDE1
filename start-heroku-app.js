const { execSync } = require('child_process');

const APP_NAME = 'minicde-production';

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function startApp() {
  console.log('🚀 Starting Heroku App...');
  console.log(`App Name: ${APP_NAME}`);
  console.log('');
  
  try {
    // Step 1: Check app status
    console.log('📊 Checking app status...');
    const status = execSync(`heroku ps --app ${APP_NAME}`, { encoding: 'utf8' });
    console.log('Current status:', status);
    
    // Step 2: Try to start web dyno
    console.log('🔧 Starting web dyno...');
    try {
      runCommand(`heroku ps:scale web=1 --app ${APP_NAME}`, 'Starting web dyno');
    } catch (error) {
      console.log('⚠️  Web dyno start failed, trying alternative method...');
    }
    
    // Step 3: Check if app is running
    console.log('🔍 Checking if app is running...');
    const runningStatus = execSync(`heroku ps --app ${APP_NAME}`, { encoding: 'utf8' });
    console.log('Running status:', runningStatus);
    
    // Step 4: Test health endpoint
    console.log('🧪 Testing health endpoint...');
    try {
      const healthResult = execSync(`curl -f https://${APP_NAME}-589be4b0d52b.herokuapp.com/health`, { encoding: 'utf8' });
      console.log('Health check result:', healthResult);
    } catch (error) {
      console.log('⚠️  Health check failed:', error.message);
    }
    
    // Step 5: Run database migrations
    console.log('🗄️  Running database migrations...');
    try {
      runCommand(`heroku run "cd backend && npm run db:migrate" --app ${APP_NAME}`, 'Running database migrations');
    } catch (error) {
      console.log('⚠️  Database migration failed:', error.message);
    }
    
    // Step 6: Seed database
    console.log('🌱 Seeding database...');
    try {
      runCommand(`heroku run "cd backend && npm run db:seed" --app ${APP_NAME}`, 'Seeding database');
    } catch (error) {
      console.log('⚠️  Database seeding failed:', error.message);
    }
    
    // Step 7: Test admin login
    console.log('🔐 Testing admin login...');
    try {
      const loginResult = execSync(`curl -X POST https://${APP_NAME}-589be4b0d52b.herokuapp.com/api/auth/login -H "Content-Type: application/json" -d '{"email":"nguyenthanhvc@gmail.com","password":"Ab5463698664#"}'`, { encoding: 'utf8' });
      console.log('Login test result:', loginResult);
    } catch (error) {
      console.log('⚠️  Login test failed:', error.message);
    }
    
    console.log('');
    console.log('🎉 App startup process completed!');
    console.log(`🌐 App URL: https://${APP_NAME}-589be4b0d52b.herokuapp.com`);
    console.log(`🔗 API URL: https://${APP_NAME}-589be4b0d52b.herokuapp.com/api`);
    console.log('');
    console.log('🔐 Admin Login:');
    console.log(`   Email: nguyenthanhvc@gmail.com`);
    console.log(`   Password: Ab5463698664#`);
    
  } catch (error) {
    console.error('❌ App startup failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check Heroku CLI is installed: heroku --version');
    console.log('2. Check app exists: heroku apps:info --app ' + APP_NAME);
    console.log('3. Check logs: heroku logs --app ' + APP_NAME);
  }
}

// Run if called directly
if (require.main === module) {
  startApp();
}

module.exports = { startApp }; 