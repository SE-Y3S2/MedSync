==================================================
MEDSYNC - ADMIN PLATFORM & SECURITY SERVICE
README - MEMBER 04 PROJECT GUIDE
==================================================

Welcome to MedSync! This README explains the project structure
and how to run the Authentication, Notification, and Admin 
Dashboard services developed by Member 04 (Dushanthini).

==================================================
QUICK START
==================================================

1. Prerequisites:
   - Node.js (v14 or higher)
   - npm (v6 or higher)
   - Docker & Docker Compose (for containerization)
   - MongoDB (local or Docker)

2. Clone/Setup the Project:
   cd MedSync

3. Run Everything with Docker Compose:
   docker-compose up --build

   This starts:
   - MongoDB (port 27017)
   - Auth Service (port 5000)
   - Notification Service (port 3006)
   - Frontend Admin Dashboard (port 3000)

4. Access Admin Dashboard:
   Open browser: http://localhost:3000
   Login with: admin@medsync.com / password

==================================================
PROJECT OVERVIEW
==================================================

MedSync is a cloud-native healthcare platform. Your role 
(Member 04) develops:

1. AUTHENTICATION & AUTHORIZATION (Auth Service)
   - User registration/login with role assignment
   - Role-based access control (Patient/Doctor/Admin)
   - JWT token-based authentication
   - Secure password hashing

2. NOTIFICATIONS (Notification Service)
   - Email notifications
   - SMS notifications via Twilio
   - Async processing
   - Configurable credentials

3. ADMIN DASHBOARD (Frontend)
   - User management
   - Doctor verification
   - Platform monitoring
   - Statistics & oversight

==================================================
DIRECTORY STRUCTURE
==================================================

MedSync/
│
├── backend/
│   └── services/
│       ├── auth/                    ← Your Auth Service
│       │   ├── src/
│       │   │   ├── auth/
│       │   │   │   ├── index.js
│       │   │   │   ├── service.js
│       │   │   │   ├── controllers/authController.js
│       │   │   │   ├── middleware/authMiddleware.js
│       │   │   │   ├── models/userModel.js
│       │   │   │   └── routes/authRoutes.js
│       │   │   └── config/
│       │   ├── .env                 (Configuration)
│       │   ├── server.js            (Entry point)
│       │   ├── Dockerfile
│       │   └── package.json
│       │
│       └── notification/            ← Your Notification Service
│           ├── src/
│           │   ├── app.js
│           │   ├── server.js
│           │   ├── controllers/notificationController.js
│           │   └── routes/notificationRoutes.js
│           ├── .env                 (Configuration)
│           ├── Dockerfile
│           └── package.json
│
├── frontend/                        ← Your Admin Dashboard
│   ├── src/
│   │   ├── AdminDashboard.js        (Main component)
│   │   ├── App.js                   (Router)
│   │   ├── App.css                  (Styling)
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile
│   └── package.json
│
├── k8s/                             ← Kubernetes Configs
│   ├── auth/deployment.yaml
│   ├── notification/deployment.yaml
│   ├── frontend/deployment.yaml
│   ├── kustomization.yaml
│   └── ingress.yaml
│
├── docker-compose.yml               ← Run all services
├── Submission.txt                   ← Submission details
├── README.txt                       ← This file
├── SECURITY_REPORT.txt              ← Security mechanisms
└── RUNNING.md

==================================================
RUNNING THE SERVICES
==================================================

OPTION 1: Using Docker Compose (Recommended)
-----------

  docker-compose up --build

  This automatically:
  - Starts MongoDB
  - Builds and runs Auth Service
  - Builds and runs Notification Service
  - Builds and runs Admin Dashboard Frontend
  - Sets up networking between services

  Access: http://localhost:3000


OPTION 2: Running Locally
-----------

Terminal 1 - Auth Service:
  cd backend/services/auth
  npm install
  npm run dev
  → Runs on http://localhost:5000

Terminal 2 - Notification Service:
  cd backend/services/notification
  npm install
  npm start
  → Runs on http://localhost:3006

Terminal 3 - Frontend:
  cd frontend
  npm install
  npm start
  → Runs on http://localhost:3000 (auto-opens browser)


OPTION 3: Using Kubernetes
-----------

  kubectl create namespace medsync
  kubectl apply -k k8s/
  kubectl get pods -n medsync          (Check status)
  kubectl port-forward svc/frontend 3000:3000 -n medsync

  Access: http://localhost:3000

==================================================
ADMIN DASHBOARD FEATURES
==================================================

Login Page:
  - Email/password authentication
  - Redirects to dashboard on success
  - Error messages on login failure

Dashboard Interface:
  ✓ Platform Overview
    - Show total user count
    - Break down by role (Doctor/Patient/Admin)
    - Quick stats cards

  ✓ User Management
    - Table of all registered users
    - View user details (name, email, role)
    - User verification status
    - Approve/verify users

  ✓ Doctor Verification Panel
    - List pending doctor verifications
    - Review credentials
    - Verify/approve doctors
    - View verified doctors

  ✓ Platform Monitoring
    - System status indicators
    - Security status (RBAC active)
    - Active session count

==================================================
API ENDPOINTS
==================================================

Auth Service (localhost:5000):
  
  Register User:
    POST /auth/register
    Body: {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "password123",
      "role": "patient"  // or "doctor" or "admin"
    }
    Response: { user: {...}, token: "..." }

  Login:
    POST /auth/login
    Body: {
      "email": "john@example.com",
      "password": "password123"
    }
    Response: { user: {...}, token: "..." }

  Get Profile:
    GET /auth/profile
    Headers: { Authorization: "Bearer <token>" }
    Response: { user: {...} }

  List Users (Admin Only):
    GET /auth/
    Headers: { Authorization: "Bearer <token>" }
    Response: [{ user1 }, { user2 }, ...]


Notification Service (localhost:3006):
  
  Send Email:
    POST /api/notify/email
    Body: {
      "to": "user@example.com",
      "subject": "Appointment Confirmation",
      "text": "Your appointment is confirmed"
    }
    Response: { message: "Email sent successfully" }

  Send SMS:
    POST /api/notify/sms
    Body: {
      "to": "+1234567890",
      "message": "Your appointment is confirmed"
    }
    Response: { message: "SMS sent successfully" }

==================================================
ENVIRONMENT CONFIGURATION
==================================================

Auth Service (.env):
  PORT=5000
  MONGO_URI=mongodb://localhost:27017/medsync
  JWT_SECRET=medsync_super_secret_jwt_key_2026
  JWT_EXPIRE=7d

Notification Service (.env):
  PORT=3006
  EMAIL_USER=your.email@gmail.com
  EMAIL_PASS=your_app_password
  TWILIO_SID=your_twilio_sid
  TWILIO_AUTH_TOKEN=your_auth_token
  TWILIO_FROM=+1234567890

Frontend (.env):
  REACT_APP_API_BASE_URL=http://localhost:5000

==================================================
TEST CREDENTIALS
==================================================

Admin User:
  Email: admin@medsync.com
  Password: password
  Role: Admin
  Usage: Login to admin dashboard

Doctor User:
  Email: doctor@medsync.com
  Password: password
  Role: Doctor
  Usage: Cannot access admin dashboard

Patient User:
  Email: patient@medsync.com
  Password: password
  Role: Patient
  Usage: Cannot access admin dashboard

==================================================
SECURITY FEATURES
==================================================

✓ Password Encryption:
  - Passwords hashed with bcryptjs (10 salt rounds)

✓ JWT Authentication:
  - Tokens valid for 7 days
  - Bearer token in Authorization header

✓ Role-Based Access Control:
  - Middleware checks user role
  - Protects admin endpoints
  - Prevents unauthorized access

✓ Input Validation:
  - All API inputs validated
  - Error messages don't leak sensitive info

✓ CORS Protection:
  - Frontend and backend communication secured
  - Only specified origins allowed

✓ Environment Variables:
  - Sensitive data (JWT secret, API keys) not hardcoded
  - Credentials stored in .env files

See SECURITY_REPORT.txt for detailed security mechanisms.

==================================================
TROUBLESHOOTING
==================================================

Problem: "MONGO_URI is undefined" error
Solution: Check auth service .env file has MONGO_URI set
         Ensure MongoDB is running (port 27017)

Problem: "Cannot GET /auth" error
Solution: Make sure auth service is running (port 5000)
         Check frontend REACT_APP_API_BASE_URL is correct

Problem: Admin dashboard shows blank user list
Solution: Login with admin credentials first
         Check browser DevTools console for errors
         Verify auth service is accessible

Problem: Email/SMS not sending
Solution: Check .env has correct credentials
         For Gmail, use app-specific passwords
         Enable "Less secure app access" for testing

Problem: Port already in use
Solution: Kill process on that port or change port in .env
         Docker: restart Docker

==================================================
USEFUL COMMANDS
==================================================

Docker:
  docker-compose up --build           # Start all services
  docker-compose down                 # Stop all services
  docker-compose logs -f auth         # View auth service logs
  docker ps                           # See running containers

Kubernetes:
  kubectl apply -k k8s/               # Deploy to k8s
  kubectl delete -k k8s/              # Remove deployment
  kubectl get pods -n medsync         # List pods
  kubectl logs -f auth -n medsync     # View auth logs

Node.js:
  npm start                           # Start service (production)
  npm run dev                         # Start with nodemon (development)
  npm install                         # Install dependencies

Useful URLs:
  Admin Dashboard: http://localhost:3000
  Auth API: http://localhost:5000
  Notification API: http://localhost:3006
  MongoDB: localhost:27017 (internal, no UI)

==================================================
PROJECT DOCUMENTATION
==================================================

Submission.txt   - Complete deliverables checklist
README.txt       - This file (setup & usage)
SECURITY_REPORT.txt - Security mechanism details
RUNNING.md       - Additional running instructions

==================================================
SUPPORT & NOTES
==================================================

This project was built as part of the Cloud Native 
Healthcare Platform for academic purposes.

Key Points:
- Only services developed by Member 04 are included
- Other members' services should be added separately
- Docker Compose has only 3 services (auth, notification, frontend)
- MongoDB, Kafka, Redis, etc. are removed unless needed
- All code follows Node.js and React best practices

For questions or issues, refer to:
1. Submission.txt (detailed checklist)
2. SECURITY_REPORT.txt (security details)
3. Service-specific README files in each service directory

==================================================
Project Status: ✓ COMPLETE
Member: Dushanthini (04)
Date: March 26, 2026
==================================================
