# MedSync: AI-Enabled Smart Healthcare Platform

MedSync is a cloud-native, microservices-based healthcare platform designed for high scalability, security, and performance. This project fulfills the requirements for **SE3020 – Distributed Systems Assignment 1 (2026)**.

The platform enables **Patients** to book appointments and consult with doctors via telemedicine, provides **Doctors** with tools for schedule and prescription management, and allows **Administrators** to oversee platform operations and verify healthcare providers.

---

## 🏗️ System Architecture

MedSync utilizes a decoupled, event-driven Microservices architecture:

- **Frontend (Next.js 16)**: A responsive React-based dashboard for all user roles.
- **Patient Management Service**: Handles registration, medical records (history/prescriptions), and document uploads (reports).
- **Doctor Management Service**: Manages doctor profiles, verification status, and availability slots.
- **Appointment Service**: Facilitates doctor search by specialty and real-time appointment booking/tracking.
- **Telemedicine Service**: Orchestrates secure video consultations using **Agora SDK** and Redis-based session caching.
- **Payment Service**: Provides secure consultation fee processing via **Stripe** integration.
- **Notification Service**: Sends automated Email/SMS confirmations triggered by **Apache Kafka** events.
- **AI Symptom Checker**: Integrates **Google Gemini AI** to provide preliminary health suggestions based on natural language symptoms.

---

## 🛠️ Technology Stack

| Logic | Technology |
|---|---|
| **Frontend** | React, Next.js, TypeScript, TailwindCSS/Vanilla CSS |
| **Backend** | Node.js, Express.js |
| **Databases** | MongoDB (Primary), Redis (Session Caching) |
| **Messaging** | Apache Kafka (Event-driven notifications) |
| **Orchestration** | Docker Compose, Kubernetes (K8s) |
| **APIs** | Agora (Video), Stripe (Payment), Gemini (AI) |

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- (Optional) [Minikube](https://minikube.sigs.k8s.io/) or Kubernetes cluster for orchestration.

### Initial Configuration

Ensure your environment variables are set or verify they match the default fallback values in `docker-compose.yml`. For live testing, you should provide:
- `GEMINI_API_KEY` (in `ai-symptom-checker` service)
- `STRIPE_SECRET_KEY` (in `payment-service`)
- `AGORA_APP_ID` (in `telemedicine-service`)

### Quick Start (One Command)

Run the included startup script in your terminal (Bash/PowerShell/Git Bash):

```bash
./start-medsync.sh
```

Alternatively, manually trigger the build:

```bash
docker-compose up -d --build
```

---

## 🔑 Role-Based Access

### 1. Administrator
- **Credentials**: `admin@medsync.com` / `admin123`
- **Dashboard**: `http://localhost:3000/admin`
- **Actions**: Manage all user records, verify doctor registrations, and audit transations.

### 2. Doctor
- **Access**: Register as a Doctor via `/register`. Once verified by an Admin, login via `/login`.
- **Portal**: `http://localhost:3000/doctor`
- **Actions**: Manage availability schedule, accept/reject appointments, issue digital prescriptions, and conduct video calls.

### 3. Patient
- **Access**: Register as a Patient via `/register`.
- **Portal**: `http://localhost:3000`
- **Actions**: Search for specialists, book appointments, use the AI Symptom Checker, upload medical reports, and attend virtual consultations.

---

## ⚓ Kubernetes Deployment

MedSync is ready for production orchestration. To deploy on a K8s cluster:

1. Navigate to the `/k8s` directory.
2. Apply the namespace and configurations:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -k k8s/
```
3. Access the platform via the configured Ingress at `medsync.local`.

---

## 📋 Deliverables Tracking

- [x] **Microservices**: All services containerized and communicating via REST/Kafka.
- [x] **Security**: JWT-based authentication for all three roles.
- [x] **Infrastructure**: Complete `docker-compose` and `k8s/` manifests provided.
- [x] **AI Integration**: Gemini-powered symptom checker implemented.
- [x] **External APIs**: Stripe (Payments) and Agora (Telemedicine) modules ready.

---

*Developed for SE3020: Distributed Systems (BSC Information Technology).*