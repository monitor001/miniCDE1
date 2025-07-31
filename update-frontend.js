const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function updateFrontend() {
  console.log('🚀 Updating Frontend Build...\n');

  // Check if we're in the right directory
  if (!fs.existsSync('./frontend')) {
    console.error('❌ Frontend directory not found. Please run this script from the project root.');
    process.exit(1);
  }

  // Step 1: Build frontend
  console.log('📦 Building frontend...');
  if (!runCommand('cd frontend && npm run build', 'Building frontend')) {
    console.error('❌ Frontend build failed');
    process.exit(1);
  }

  // Step 2: Copy build files to container
  console.log('📋 Copying build files to container...');
  if (!runCommand('docker cp frontend/build/. minicde_frontend_dev:/app/build/', 'Copying build files')) {
    console.error('❌ Failed to copy build files to container');
    process.exit(1);
  }

  // Step 3: Restart frontend container
  console.log('🔄 Restarting frontend container...');
  if (!runCommand('docker-compose -f docker-compose.dev.yml restart frontend', 'Restarting frontend')) {
    console.error('❌ Failed to restart frontend container');
    process.exit(1);
  }

  // Step 4: Wait a moment for container to start
  console.log('⏳ Waiting for container to start...');
  setTimeout(() => {
    // Step 5: Test the system
    console.log('🧪 Testing updated system...');
    if (fs.existsSync('./test-docker-local.js')) {
      runCommand('node test-docker-local.js', 'Running system tests');
    } else {
      console.log('⚠️ Test file not found, skipping tests');
    }

    console.log('\n🎉 Frontend update completed successfully!');
    console.log('\n📋 Updated URLs:');
    console.log('   Frontend: http://localhost:3001');
    console.log('   Backend API: http://localhost:3002');
    console.log('\n💡 You can now access the updated frontend in your browser.');
  }, 3000);
}

// Check command line arguments
const command = process.argv[2];

switch (command) {
  case 'help':
    console.log('📖 Frontend Update Script');
    console.log('\nUsage:');
    console.log('  node update-frontend.js          - Update frontend build');
    console.log('  node update-frontend.js help     - Show this help message');
    console.log('\nThis script will:');
    console.log('  1. Build the frontend');
    console.log('  2. Copy build files to Docker container');
    console.log('  3. Restart the frontend container');
    console.log('  4. Test the system');
    break;
  
  default:
    updateFrontend();
    break;
} 