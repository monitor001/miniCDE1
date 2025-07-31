@echo off
echo Starting MiniCDE Frontend Server...
echo.

echo Step 1: Building frontend...
cd frontend
npm run build
echo.

echo Step 2: Starting frontend server...
serve -s build -l 3000
echo.

echo Frontend server started!
echo URL: http://localhost:3000
echo API URL: https://minicde-production-589be4b0d52b.herokuapp.com/api
echo.
echo Press Ctrl+C to stop the server
pause 