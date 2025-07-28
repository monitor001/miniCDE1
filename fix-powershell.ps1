# Fix PowerShell Execution Policy
Write-Host "Fixing PowerShell Execution Policy..." -ForegroundColor Green

# Set execution policy to allow scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

Write-Host "Execution policy updated successfully!" -ForegroundColor Green
Write-Host "You can now run Heroku commands." -ForegroundColor Yellow

# Test Heroku
Write-Host "Testing Heroku CLI..." -ForegroundColor Green
heroku --version

Write-Host "Done! You can now run the start-app.bat file." -ForegroundColor Green
pause 