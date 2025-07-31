#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Các file cần loại bỏ console.log
const filesToClean = [
  'backend/src/index.ts',
  'backend/src/db.ts',
  'backend/src/utils/cache.ts',
  'backend/src/middlewares/auth.ts',
  'backend/src/controllers/taskController.ts',
  'backend/src/controllers/settingsController.ts',
  'backend/src/controllers/reportController.ts',
  'backend/src/controllers/projectController.ts',
  'backend/src/controllers/isoController.ts',
  'backend/src/controllers/calendarController.ts',
  'backend/src/controllers/authController.ts',
  'backend/src/config/environment.ts',
  'frontend/src/store/slices/authSlice.ts',
  'frontend/src/pages/Users.tsx',
  'frontend/src/pages/Tasks.tsx',
  'frontend/src/pages/ProjectsNew.tsx',
  'frontend/src/pages/Project.tsx',
  'frontend/src/pages/CalendarPage.tsx',
  'frontend/src/config/environment.ts'
];

function removeConsoleLogs(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Loại bỏ console.log statements
  content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
  content = content.replace(/console\.log\([^)]*\);\s*/g, '');
  
  // Loại bỏ console.log với template literals
  content = content.replace(/console\.log\(`[^`]*`\);?\s*/g, '');
  
  // Loại bỏ console.log với multiple arguments
  content = content.replace(/console\.log\([^)]*,[^)]*\);?\s*/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Cleaned: ${filePath}`);
  } else {
    console.log(`ℹ️  No console.log found in: ${filePath}`);
  }
}

console.log('🧹 Removing console.log statements...\n');

filesToClean.forEach(file => {
  removeConsoleLogs(file);
});

console.log('\n✅ Console.log cleanup completed!');
console.log('💡 Remember to test the application after cleanup.'); 