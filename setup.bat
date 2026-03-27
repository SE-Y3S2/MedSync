@echo off
echo 🚀 Setting up MedSync Project...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please edit .env file with your actual credentials before running!
    echo    Required: JWT_SECRET
    echo    Optional: EMAIL_USER, EMAIL_PASS, TWILIO_* for notifications
)

echo 🏗️  Building and starting services...
docker-compose up --build -d

echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

echo ✅ Services should be running!
echo.
echo 🌐 Access URLs:
echo    Admin Dashboard: http://localhost:3000
echo    Auth Service: http://localhost:5000
echo    Appointment Service: http://localhost:3003
echo    Doctor Management: http://localhost:3002
echo    Notification Service: http://localhost:3006
echo.
echo 📊 To view logs: docker-compose logs -f [service-name]
echo 🛑 To stop: docker-compose down
echo.
echo 🔐 First, create an admin user via POST to http://localhost:5000/auth/register
echo    with role: 'admin' in the request body

pause