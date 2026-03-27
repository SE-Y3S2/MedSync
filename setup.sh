#!/bin/bash

echo "🚀 Setting up MedSync Project..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual credentials before running!"
    echo "   Required: JWT_SECRET"
    echo "   Optional: EMAIL_USER, EMAIL_PASS, TWILIO_* for notifications"
fi

echo "🏗️  Building and starting services..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 30

echo "✅ Services should be running!"
echo ""
echo "🌐 Access URLs:"
echo "   Admin Dashboard: http://localhost:3000"
echo "   Auth Service: http://localhost:5000"
echo "   Appointment Service: http://localhost:3003"
echo "   Doctor Management: http://localhost:3002"
echo "   Notification Service: http://localhost:3006"
echo ""
echo "📊 To view logs: docker-compose logs -f [service-name]"
echo "🛑 To stop: docker-compose down"
echo ""
echo "🔐 First, create an admin user via POST to http://localhost:5000/auth/register"
echo "   with role: 'admin' in the request body"