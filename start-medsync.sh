#!/bin/bash

# MedSync Startup Script (Distributed Systems Assignment 1)

echo "🚀 Initializing MedSync Cloud-Native Healthcare Platform..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "📦 Building and starting microservices..."
docker-compose up -d --build

echo "⏳ Waiting for services to initialize..."
sleep 10

echo "--------------------------------------------------------"
echo "✅ MedSync is now online!"
echo "--------------------------------------------------------"
echo "🌐 Frontend Dashboard: http://localhost:3000"
echo "🛡️ Admin Credentials: admin@medsync.com / admin123"
echo "👨‍⚕️ Doctor Portal: Login as Doctor after Admin verification"
echo "🏠 Patient Portal: Register/Login as Patient"
echo "--------------------------------------------------------"
echo "📊 Monitoring: Use 'docker-compose logs -f' to see live trails."
