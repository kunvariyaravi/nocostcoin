@echo off
echo Starting Nocostcoin...

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running or not installed. Please install Docker Desktop and try again.
    pause
    exit /b
)

echo Building and starting containers...
docker-compose up -d --build

echo.
echo Services started!
echo UI: http://localhost:3000
echo API: http://localhost:8000
echo.
pause
