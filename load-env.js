#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Environment Configuration Loader
 * Loads environment variables from config files and creates .env files
 */

// Parse environment file
function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const env = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  
  return env;
}

// Load environment configuration
function loadEnvironment(envType = 'production') {
  const configFile = path.join(__dirname, `env.${envType}`);
  
  if (!fs.existsSync(configFile)) {
    console.error(`❌ Environment file not found: ${configFile}`);
    process.exit(1);
  }
  
  console.log(`📁 Loading environment from: ${configFile}`);
  const env = parseEnvFile(configFile);
  
  // Load into process.env
  Object.keys(env).forEach(key => {
    process.env[key] = env[key];
  });
  
  console.log(`✅ Loaded ${Object.keys(env).length} environment variables`);
  return env;
}

// Create .env files
function createEnvFiles(envType = 'production') {
  const configFile = path.join(__dirname, `env.${envType}`);
  
  if (!fs.existsSync(configFile)) {
    console.error(`❌ Environment file not found: ${configFile}`);
    process.exit(1);
  }
  
  const env = parseEnvFile(configFile);
  
  // Create frontend .env
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  const frontendEnv = {};
  
  // Filter frontend variables
  Object.keys(env).forEach(key => {
    if (key.startsWith('REACT_APP_') || key.startsWith('GENERATE_') || key.startsWith('INLINE_')) {
      frontendEnv[key] = env[key];
    }
  });
  
  // Write frontend .env
  const frontendContent = Object.keys(frontendEnv)
    .map(key => `${key}=${frontendEnv[key]}`)
    .join('\n');
  
  fs.writeFileSync(frontendEnvPath, frontendContent);
  console.log(`✅ Created frontend .env with ${Object.keys(frontendEnv).length} variables`);
  
  // Create backend .env
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  const backendEnv = {};
  
  // Filter backend variables
  Object.keys(env).forEach(key => {
    if (!key.startsWith('REACT_APP_')) {
      backendEnv[key] = env[key];
    }
  });
  
  // Write backend .env
  const backendContent = Object.keys(backendEnv)
    .map(key => `${key}=${backendEnv[key]}`)
    .join('\n');
  
  fs.writeFileSync(backendEnvPath, backendContent);
  console.log(`✅ Created backend .env with ${Object.keys(backendEnv).length} variables`);
  
  return { frontendEnv, backendEnv };
}

// Main function
function main() {
  const command = process.argv[2];
  const envType = process.argv[3] || 'production';
  
  switch (command) {
    case 'load':
      console.log(`🔄 Loading ${envType} environment...`);
      loadEnvironment(envType);
      console.log('✅ Environment loaded successfully');
      break;
      
    case 'create':
      console.log(`📝 Creating .env files for ${envType} environment...`);
      createEnvFiles(envType);
      console.log('✅ .env files created successfully');
      break;
      
    case 'deploy':
      console.log('🚀 Deploying environment to Heroku...');
      loadEnvironment('production');
      
      // Set Heroku config vars
      const env = parseEnvFile(path.join(__dirname, 'env.production'));
      const herokuCommands = [];
      
      Object.keys(env).forEach(key => {
        if (key.startsWith('REACT_APP_') || key.startsWith('DATABASE_') || key.startsWith('JWT_') || 
            key.startsWith('CORS_') || key.startsWith('REDIS_') || key.startsWith('TRUST_') ||
            key.startsWith('RATE_') || key.startsWith('PROJECT_') || key.startsWith('NODE_') ||
            key.startsWith('PORT') || key.startsWith('DEBUG_')) {
          herokuCommands.push(`heroku config:set ${key}="${env[key]}" --app minicde-production`);
        }
      });
      
      console.log('📋 Heroku commands to run:');
      herokuCommands.forEach(cmd => console.log(cmd));
      break;
      
    default:
      console.log(`
🌍 Environment Configuration Tool

Usage:
  node load-env.js <command> [environment]

Commands:
  load [env]     - Load environment variables into process.env
  create [env]   - Create .env files for frontend and backend
  deploy         - Generate Heroku deployment commands

Environments:
  development    - Development environment (default: production)
  production     - Production environment (Heroku)

Examples:
  node load-env.js load development
  node load-env.js create production
  node load-env.js deploy
      `);
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { loadEnvironment, createEnvFiles, parseEnvFile }; 