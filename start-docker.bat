@echo off
echo ========================================
echo    MiniCDE Docker Build Script
echo ========================================
echo.

echo [1/5] Checking Docker status...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    pause
    exit /b 1
)

echo [2/5] Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo Waiting for Docker to start...
timeout /t 30 /nobreak >nul

echo [3/5] Checking Docker daemon...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker daemon is not running
    echo Please start Docker Desktop manually and try again
    pause
    exit /b 1
)

echo [4/5] Building and starting containers...
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo [5/5] Checking container status...
timeout /t 10 /nobreak >nul
docker-compose ps

echo.
echo ========================================
echo    Build completed successfully!
echo ========================================
echo.
echo Frontend: http://localhost:8080
echo Backend API: http://localhost:3001
echo Database: localhost:5432
echo Redis: localhost:6379
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause 