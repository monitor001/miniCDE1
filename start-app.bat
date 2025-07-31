@echo off
echo Starting Heroku App...
echo.

echo Step 1: Starting web dyno...
heroku ps:scale web=1 --app minicde-production
echo.

echo Step 2: Running database migrations...
heroku run "cd backend && npm run db:migrate" --app minicde-production
echo.

echo Step 3: Seeding database...
heroku run "cd backend && npm run db:seed" --app minicde-production
echo.

echo Step 4: Testing health endpoint...
curl https://minicde-production-589be4b0d52b.herokuapp.com/health
echo.

echo Step 5: Testing admin login...
curl -X POST https://minicde-production-589be4b0d52b.herokuapp.com/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"nguyenthanhvc@gmail.com\",\"password\":\"Ab5463698664#\"}"
echo.

echo.
echo App startup completed!
echo App URL: https://minicde-production-589be4b0d52b.herokuapp.com
echo API URL: https://minicde-production-589be4b0d52b.herokuapp.com/api
echo.
echo Admin Login:
echo Email: nguyenthanhvc@gmail.com
echo Password: Ab5463698664#
echo.

pause 