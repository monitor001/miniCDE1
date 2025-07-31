#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Kiểm tra và sửa lỗi syntax trong các file TypeScript/React
function checkAndFixSyntaxErrors() {
  console.log('🔍 Checking for syntax errors...\n');
  
  const filesToCheck = [
    'frontend/src/App.tsx',
    'frontend/src/axiosConfig.ts',
    'frontend/src/pages/Project.tsx',
    'frontend/src/pages/Tasks.tsx',
    'frontend/src/pages/Users.tsx'
  ];
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`📁 Checking: ${file}`);
      const content = fs.readFileSync(file, 'utf8');
      
      // Kiểm tra các lỗi syntax phổ biến
      const errors = [];
      
      // Kiểm tra dấu ngoặc không khớp
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
      }
      
      // Kiểm tra dấu ngoặc tròn không khớp
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
      }
      
      // Kiểm tra dấu ngoặc vuông không khớp
      const openBrackets = (content.match(/\[/g) || []).length;
      const closeBrackets = (content.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push(`Mismatched brackets: ${openBrackets} open, ${closeBrackets} close`);
      }
      
      if (errors.length > 0) {
        console.log(`❌ Errors found in ${file}:`);
        errors.forEach(error => console.log(`   - ${error}`));
      } else {
        console.log(`✅ ${file} - No syntax errors detected`);
      }
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
}

// Tạo file backup trước khi sửa
function createBackup() {
  const backupDir = 'backup-' + new Date().toISOString().replace(/[:.]/g, '-');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const filesToBackup = [
    'frontend/src/App.tsx',
    'frontend/src/axiosConfig.ts'
  ];
  
  filesToBackup.forEach(file => {
    if (fs.existsSync(file)) {
      const backupPath = path.join(backupDir, path.basename(file));
      fs.copyFileSync(file, backupPath);
      console.log(`💾 Backed up: ${file} -> ${backupPath}`);
    }
  });
  
  return backupDir;
}

console.log('🚀 Frontend Build Fix Script');
console.log('============================\n');

// Tạo backup
const backupDir = createBackup();
console.log(`📦 Backup created in: ${backupDir}\n`);

// Kiểm tra lỗi syntax
checkAndFixSyntaxErrors();

console.log('\n💡 Next steps:');
console.log('1. Review the syntax errors above');
console.log('2. Fix the identified issues');
console.log('3. Test the build locally: cd frontend && npm run build');
console.log('4. Deploy to Heroku once build succeeds');
console.log(`5. If needed, restore from backup: ${backupDir}`); 