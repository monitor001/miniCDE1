@echo off
echo ========================================
echo    MiniCDE Environment Switcher
echo ========================================
echo.

if "%1"=="" (
    echo Usage: switch-environment.bat [dev^|prod^|local-prod]
    echo.
    echo Environments:
    echo   dev        - Development environment (localhost:3000, localhost:3001)
    echo   prod       - Production environment (Docker with nginx proxy)
    echo   local-prod - Local production (Docker without nginx)
    echo.
    echo Examples:
    echo   switch-environment.bat dev
    echo   switch-environment.bat prod
    echo   switch-environment.bat local-prod
    pause
    exit /b 1
)

set ENV=%1

echo [1/4] Stopping existing containers...
docker-compose down
docker-compose -f docker-compose.dev.yml down

echo [2/4] Cleaning up containers and networks...
docker system prune -f

echo [3/4] Starting %ENV% environment...

if "%ENV%"=="dev" (
    echo Starting Development Environment...
    docker-compose -f docker-compose.dev.yml up -d
    echo.
    echo ========================================
    echo    Development Environment Started!
    echo ========================================
    echo.
    echo Frontend: http://localhost:3000
    echo Backend API: http://localhost:3001
    echo Database: localhost:5432
    echo Redis: localhost:6379
    echo.
    echo Features:
    echo - Hot reload enabled
    echo - Debug mode enabled
    echo - Source maps enabled
    echo - Volume mounting for live code changes
    echo.
) else if "%ENV%"=="prod" (
    echo Starting Production Environment...
    docker-compose up -d
    echo.
    echo ========================================
    echo    Production Environment Started!
    echo ========================================
    echo.
    echo Frontend: http://localhost:8080
    echo Backend API: http://localhost:3001
    echo Database: localhost:5432
    echo Redis: localhost:6379
    echo.
    echo Features:
    echo - Nginx reverse proxy
    echo - Optimized builds
    echo - Production security settings
    echo.
) else if "%ENV%"=="local-prod" (
    echo Starting Local Production Environment...
    docker-compose -f docker-compose.yml up -d --scale nginx-proxy=0
    echo.
    echo ========================================
    echo    Local Production Environment Started!
    echo ========================================
    echo.
    echo Frontend: http://localhost:8080
    echo Backend API: http://localhost:3001
    echo Database: localhost:5432
    echo Redis: localhost:6379
    echo.
    echo Features:
    echo - Production builds without nginx
    echo - Direct container access
    echo.
) else (
    echo ERROR: Invalid environment '%ENV%'
    echo Valid options: dev, prod, local-prod
    pause
    exit /b 1
)

echo [4/4] Checking container status...
timeout /t 5 /nobreak >nul

if "%ENV%"=="dev" (
    docker-compose -f docker-compose.dev.yml ps
) else (
    docker-compose ps
)

echo.
echo To view logs:
if "%ENV%"=="dev" (
    echo   docker-compose -f docker-compose.dev.yml logs -f
) else (
    echo   docker-compose logs -f
)
echo.
echo To stop:
if "%ENV%"=="dev" (
    echo   docker-compose -f docker-compose.dev.yml down
) else (
    echo   docker-compose down
)
echo.
pause 