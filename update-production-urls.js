const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Thay đổi thành tên app Heroku thực tế của bạn
  HEROKU_APP_NAME: 'minicde-app',
  
  // Frontend domain (nếu có custom domain)
  FRONTEND_DOMAIN: 'your-frontend-domain.com',
  
  // Files to update
  FILES_TO_UPDATE: [
    'frontend/src/axiosConfig.ts',
    'backend/src/index.ts',
    'backend/test-admin-login.js',
    'backend/test-ssl-cors.js',
    'backend/env.example',
    'docker-compose.yml',
    'heroku-deploy.md',
    'DEPLOYMENT.md',
    'README.md'
  ],
  
  // Patterns to replace
  REPLACEMENTS: [
    {
      pattern: /your-app-name\.herokuapp\.com/g,
      replacement: 'your-actual-heroku-app-name.herokuapp.com'
    },
    {
      pattern: /your-frontend-domain\.com/g,
      replacement: 'your-frontend-domain.com'
    },
    {
      pattern: /localhost:5432/g,
      replacement: 'HEROKU_POSTGRES_HOST:5432'
    },
    {
      pattern: /localhost:6379/g,
      replacement: 'HEROKU_REDIS_HOST:6379'
    }
  ]
};

function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    CONFIG.REPLACEMENTS.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
        console.log(`✅ Updated pattern in ${filePath}`);
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated file: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function updateEnvironmentVariables() {
  console.log('\n🔧 Environment Variables to set on Heroku:');
  console.log('==========================================');
  console.log(`NODE_ENV=production`);
  console.log(`JWT_SECRET=your_secure_jwt_secret_here`);
  console.log(`DATABASE_URL=postgresql://user:pass@host:port/db`);
  console.log(`REDIS_URL=redis://host:port`);
  console.log(`REACT_APP_API_URL=https://${CONFIG.HEROKU_APP_NAME}.herokuapp.com/api`);
  console.log(`REACT_APP_SOCKET_URL=https://${CONFIG.HEROKU_APP_NAME}.herokuapp.com`);
  console.log('');
}

function generateHerokuCommands() {
  console.log('🚀 Heroku Commands to run:');
  console.log('==========================');
  console.log(`# Set environment variables`);
  console.log(`heroku config:set NODE_ENV=production`);
  console.log(`heroku config:set JWT_SECRET=your_secure_jwt_secret_here`);
  console.log(`heroku config:set REACT_APP_API_URL=https://${CONFIG.HEROKU_APP_NAME}.herokuapp.com/api`);
  console.log(`heroku config:set REACT_APP_SOCKET_URL=https://${CONFIG.HEROKU_APP_NAME}.herokuapp.com`);
  console.log('');
  console.log(`# Deploy to Heroku`);
  console.log(`git add .`);
  console.log(`git commit -m "Update production URLs"`);
  console.log(`git push heroku main`);
  console.log('');
  console.log(`# Run database migrations`);
  console.log(`heroku run npm run db:migrate`);
  console.log(`heroku run npm run db:seed`);
  console.log('');
  console.log(`# Test production deployment`);
  console.log(`heroku run npm run test:admin`);
  console.log(`heroku run npm run test:ssl`);
  console.log('');
}

function checkCurrentConfiguration() {
  console.log('🔍 Current Configuration Check:');
  console.log('==============================');
  
  // Check frontend axios config
  const axiosConfigPath = 'frontend/src/axiosConfig.ts';
  if (fs.existsSync(axiosConfigPath)) {
    const content = fs.readFileSync(axiosConfigPath, 'utf8');
    const hasLocalhost = content.includes('localhost');
    const hasPlaceholder = content.includes('your-app-name');
    
    console.log(`Frontend API Config:`);
    console.log(`  - Has localhost: ${hasLocalhost ? '❌' : '✅'}`);
    console.log(`  - Has placeholder: ${hasPlaceholder ? '❌' : '✅'}`);
  }
  
  // Check backend CORS config
  const backendIndexPath = 'backend/src/index.ts';
  if (fs.existsSync(backendIndexPath)) {
    const content = fs.readFileSync(backendIndexPath, 'utf8');
    const hasLocalhost = content.includes('localhost');
    const hasPlaceholder = content.includes('your-app-name');
    
    console.log(`Backend CORS Config:`);
    console.log(`  - Has localhost: ${hasLocalhost ? '❌' : '✅'}`);
    console.log(`  - Has placeholder: ${hasPlaceholder ? '❌' : '✅'}`);
  }
  
  console.log('');
}

function main() {
  console.log('🚀 Production URLs Update Script');
  console.log('================================');
  console.log(`Heroku App Name: ${CONFIG.HEROKU_APP_NAME}`);
  console.log(`Frontend Domain: ${CONFIG.FRONTEND_DOMAIN}`);
  console.log('');
  
  // Check current configuration
  checkCurrentConfiguration();
  
  // Update files
  console.log('📝 Updating files...');
  let updatedCount = 0;
  
  CONFIG.FILES_TO_UPDATE.forEach(filePath => {
    if (updateFile(filePath)) {
      updatedCount++;
    }
  });
  
  console.log(`\n✅ Updated ${updatedCount} files`);
  
  // Show environment variables
  updateEnvironmentVariables();
  
  // Show Heroku commands
  generateHerokuCommands();
  
  console.log('🎯 Next Steps:');
  console.log('1. Update HEROKU_APP_NAME in this script');
  console.log('2. Run the script again');
  console.log('3. Set environment variables on Heroku');
  console.log('4. Deploy to Heroku');
  console.log('5. Test the deployment');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { updateFile, CONFIG }; 