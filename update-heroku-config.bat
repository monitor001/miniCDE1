@echo off
echo ========================================
echo    Heroku Configuration Updater
echo ========================================
echo.

echo [1/4] Checking Heroku CLI...
heroku --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Heroku CLI is not installed or not in PATH
    echo Please install Heroku CLI from: https://devcenter.heroku.com/articles/heroku-cli
    pause
    exit /b 1
)

echo [2/4] Setting environment variables...

echo Setting CORS_ORIGIN...
heroku config:set CORS_ORIGIN="https://qlda.hoanglong24.com,https://minicde-production-589be4b0d52b.herokuapp.com,https://minicde-frontend-833302d6ab3c.herokuapp.com" -a minicde-production

echo Setting REACT_APP_API_URL...
heroku config:set REACT_APP_API_URL="https://minicde-production-589be4b0d52b.herokuapp.com/api" -a minicde-production

echo Setting REACT_APP_SOCKET_URL...
heroku config:set REACT_APP_SOCKET_URL="https://minicde-production-589be4b0d52b.herokuapp.com" -a minicde-production

echo Setting REACT_APP_TITLE...
heroku config:set REACT_APP_TITLE="Quản lý dự án" -a minicde-production

echo Setting TRUST_PROXY...
heroku config:set TRUST_PROXY="1" -a minicde-production

echo Setting DEBUG_MODE...
heroku config:set DEBUG_MODE="false" -a minicde-production

echo [3/4] Restarting Heroku app...
heroku restart -a minicde-production

echo [4/4] Checking app status...
heroku ps -a minicde-production

echo.
echo ========================================
echo    Configuration Updated Successfully!
echo ========================================
echo.
echo Current configuration:
heroku config -a minicde-production
echo.
echo To view logs:
echo   heroku logs --tail -a minicde-production
echo.
echo To open the app:
echo   heroku open -a minicde-production
echo.
pause 