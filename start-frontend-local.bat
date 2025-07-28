@echo off
echo Starting MiniCDE Frontend Locally...
echo.

echo Step 1: Installing dependencies...
cd frontend
npm install
echo.

echo Step 2: Starting development server...
npm start
echo.

echo Frontend development server started!
echo URL: http://localhost:3000
echo API URL: https://minicde-production-589be4b0d52b.herokuapp.com/api
echo.
echo Press Ctrl+C to stop the server
pause 