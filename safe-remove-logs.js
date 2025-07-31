#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Chỉ loại bỏ console.log đơn giản, không động đến code phức tạp
function safeRemoveConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Chỉ loại bỏ console.log đơn giản
    const simpleConsoleLogPattern = /^\s*console\.log\([^)]*\);?\s*$/gm;
    content = content.replace(simpleConsoleLogPattern, '');
    
    // Loại bỏ dòng trống thừa
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned: ${filePath}`);
    } else {
      console.log(`ℹ️  No simple console.log found in: ${filePath}`);
    }
  } catch (error) {
    console.log(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Chỉ xử lý các file cụ thể đã được kiểm tra
const filesToClean = [
  'backend/src/prisma/seed.ts',
  'frontend/src/App.tsx',
  'frontend/src/axiosConfig.ts',
  'frontend/src/pages/ProjectsNew.tsx',
  'frontend/src/pages/Tasks.tsx'
];

console.log('🧹 Safely removing simple console.log statements...\n');

filesToClean.forEach(file => {
  if (fs.existsSync(file)) {
    safeRemoveConsoleLogs(file);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('\n✅ Safe console.log cleanup completed!');
console.log('💡 Only simple console.log statements were removed.'); 