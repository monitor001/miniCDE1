#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findAndRemoveConsoleLogs(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      findAndRemoveConsoleLogs(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
      removeConsoleLogsFromFile(fullPath);
    }
  });
}

function removeConsoleLogsFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Loại bỏ console.log statements với nhiều pattern khác nhau
    const patterns = [
      /console\.log\([^)]*\);?\s*/g,
      /console\.log\(`[^`]*`\);?\s*/g,
      /console\.log\([^)]*,[^)]*\);?\s*/g,
      /console\.log\([^)]*\);\s*/g,
      /console\.log\([^)]*\)\s*/g
    ];
    
    patterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // Loại bỏ dòng trống thừa
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned: ${filePath}`);
    }
  } catch (error) {
    console.log(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🧹 Removing console.log statements from all TypeScript/JavaScript files...\n');

// Xử lý backend
if (fs.existsSync('backend/src')) {
  console.log('📁 Processing backend files...');
  findAndRemoveConsoleLogs('backend/src');
}

// Xử lý frontend
if (fs.existsSync('frontend/src')) {
  console.log('📁 Processing frontend files...');
  findAndRemoveConsoleLogs('frontend/src');
}

console.log('\n✅ Console.log cleanup completed!');
console.log('💡 Remember to test the application after cleanup.'); 