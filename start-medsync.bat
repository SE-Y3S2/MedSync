@echo off
echo 🚀 Initializing MedSync Cloud-Native Healthcare Platform...

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo 📦 Building and starting microservices...
docker-compose up -d --build

echo ⏳ Waiting for services to initialize...
timeout /t 10 /nobreak >nul

echo --------------------------------------------------------
echo ✅ MedSync is now online!
echo --------------------------------------------------------
echo 🌐 Frontend Dashboard: http://localhost:3000
echo 🛡️ Admin Credentials: admin@medsync.com / admin123
echo 👨‍⚕️ Doctor Portal: Login as Doctor after Admin verification
echo 🏠 Patient Portal: Register/Login as Patient
echo --------------------------------------------------------
echo 📊 Monitoring: Use "docker-compose logs -f" to see live trails.
pause
