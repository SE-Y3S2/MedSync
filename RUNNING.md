# MedSync - Telemedicine Platform

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Option 1: Docker Compose (Recommended)

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd MedSync
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run setup script:**
   ```bash
   # Linux/Mac
   chmod +x setup.sh && ./setup.sh

   # Windows
   setup.bat
   ```

4. **Access the application:**
   - Admin Dashboard: http://localhost:3000
   - API Services: http://localhost:5000 (auth), http://localhost:3003 (appointments), etc.

### Option 2: Manual Setup

1. **Install dependencies for each service:**
   ```bash
   # Auth service
   cd backend/services/auth && npm install

   # Appointment service
   cd backend/services/appointment && npm install

   # Doctor management
   cd backend/services/doctor-management && npm install

   # Notification service
   cd backend/services/notification && npm install

   # Frontend
   cd frontend && npm install
   ```

2. **Start MongoDB:**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6.0

   # Or install MongoDB locally
   ```

3. **Start services individually:**
   ```bash
   # Terminal 1: Auth service
   cd backend/services/auth && npm start

   # Terminal 2: Appointment service
   cd backend/services/appointment && npm start

   # Terminal 3: Doctor management
   cd backend/services/doctor-management && npm start

   # Terminal 4: Notification service
   cd backend/services/notification && npm start

   # Terminal 5: Frontend
   cd frontend && npm start
   ```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Required
JWT_SECRET=your_super_secret_jwt_key_here

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS (Twilio - optional)
TWILIO_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM=+1234567890

# Database (optional - defaults provided)
MONGO_URI=mongodb://localhost:27017/medsync
```

### Getting Gmail App Password
1. Go to Google Account settings
2. Enable 2FA
3. Generate App Password for "Mail"
4. Use that password in EMAIL_PASS

### Getting Twilio Credentials
1. Sign up at twilio.com
2. Get Account SID and Auth Token
3. Purchase a phone number for TWILIO_FROM

## 📡 API Endpoints

### Authentication (Port 5000)
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile
- `GET /auth` - List all users (admin only)

### Appointments (Port 3003)
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/stats/admin` - Platform stats (admin)
- `PUT /api/appointments/:id/status` - Update status

### Doctor Management (Port 3002)
- `POST /api/doctors/register` - Register doctor (admin)
- `GET /api/doctors` - List doctors
- `PUT /api/doctors/:id/verify` - Verify doctor (admin)

### Notifications (Port 3006)
- `POST /api/notify/email` - Send email
- `POST /api/notify/sms` - Send SMS

## 🧪 Testing the Application

### 1. Create Admin User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@medsync.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. Login and Get Token
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@medsync.com",
    "password": "admin123"
  }'
```

### 3. Access Admin Dashboard
- Open http://localhost:3000
- Use the token from login for API calls

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose up --build auth

# Clean up
docker-compose down -v --rmi all
```

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Input validation
- Environment variable secrets

## 📊 Monitoring

- View service logs: `docker-compose logs -f [service-name]`
- Check container status: `docker-compose ps`
- Access MongoDB: `docker exec -it medsync_appointment-db_1 mongo`

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Find process using port
   lsof -i :3000
   # Kill process or change port in docker-compose.yml
   ```

2. **MongoDB connection failed:**
   - Ensure MongoDB is running
   - Check MONGO_URI in .env

3. **Email not sending:**
   - Verify Gmail credentials
   - Check if less secure apps are enabled

4. **Services not starting:**
   ```bash
   docker-compose logs [service-name]
   ```

### Reset Everything
```bash
docker-compose down -v --rmi all
docker system prune -f
```

## 📚 Project Structure

```
MedSync/
├── backend/
│   └── services/
│       ├── auth/              # Authentication & RBAC
│       ├── appointment/       # Appointment booking
│       ├── doctor-management/ # Doctor CRUD & verification
│       └── notification/      # Email & SMS service
├── frontend/                  # React admin dashboard
├── k8s/                      # Kubernetes manifests
├── docker-compose.yml        # Local development
├── .env.example             # Environment template
└── setup.sh                 # Quick setup script
```

## 🎯 User Stories Implemented

- ✅ **RBAC**: Role-based access control for patient/doctor/admin
- ✅ **Notifications**: SMS & email confirmations
- ✅ **User Management**: Admin dashboard for user oversight
- ✅ **Verification**: Doctor credential verification
- ✅ **Platform Oversight**: Admin monitoring capabilities

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

ISC License