# MedSync: AI-Enabled Smart Healthcare Platform

MedSync is a high-availability, cloud-native healthcare ecosystem built with a microservices architecture. It streamlines patient-doctor interactions through AI-driven diagnostics, real-time telemedicine, and secure payment processing.

This project is the official implementation for the **SE3020 – Distributed Systems Assignment 1 (2026)**.

---

## 🏛️ System Architecture

MedSync consists of **8 core microservices** and a **Next.js Frontend**, all containerized and ready for orchestration.

### Core Services:
*   **Auth Service (Port 5000)**: Unified JWT-based authentication for Patients, Doctors, and Admins.
*   **Patient Management (Port 3001)**: Digital Health Records (PHR), document uploads, and medical history.
*   **Doctor Management (Port 3002)**: Profile verification, availability scheduling, and analytics.
*   **Appointment Service (Port 3003)**: Real-time booking engine with specialty-based search.
*   **Telemedicine Service (Port 3004)**: Secure video consultations via Agora SDK and Redis signaling.
*   **Payment Service (Port 3005)**: Financial gateway integrated with Stripe Checkout.
*   **Notification Service (Port 3006)**: Event-driven alerts (Email/SMS) powered by Apache Kafka.
*   **AI Symptom Checker (Port 3007)**: Preliminary diagnostic engine using Google Gemini AI.

---

## 🛠️ Technology Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React, Next.js 14, TypeScript, CSS3 |
| **Backend** | Node.js, Express, Socket.io |
| **Data** | MongoDB (Primary), Redis (Session Cache) |
| **Messaging** | Apache Kafka (Event Streaming) |
| **Infrastructure** | Docker, Docker Compose, Kubernetes (K8s) |
| **External APIs** | Stripe, Agora, Google Gemini, Twilio |

---

## ⚙️ Configuration (Environment Variables)

The project now uses a **Centralized Environment Configuration**. You only need to manage variables in the root directory.

1.  **Initialize**: Rename [`.env.example`](file:///c:/Users/LENOVO/Desktop/MedSync/.env.example) to `.env`.
2.  **Fill API Keys**: 
    *   `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/).
    *   `STRIPE_SECRET_KEY`: Get from [Stripe Dashboard](https://dashboard.stripe.com/).
    *   `AGORA_APP_ID`: Get from [Agora Console](https://console.agora.io/).

---

## 🚀 One-Command Deployment

### Option A: Docker Compose (Quickest)
Best for local development and demonstration.
*   **Windows**: Double-click [`start-medsync.bat`](file:///c:/Users/LENOVO/Desktop/MedSync/start-medsync.bat)
*   **Linux/Mac**: Run `chmod +x start-medsync.sh && ./start-medsync.sh`

### Option B: Kubernetes (Orchestrasted)
Best for production simulation and assignment requirements.
1.  Ensure you have a k8s cluster running (Docker Desktop K8s or Minikube).
2.  **Deploy**:
    *   **Windows**: Run [`run-k8s.bat`](file:///c:/Users/LENOVO/Desktop/MedSync/run-k8s.bat)
    *   **Linux/Mac**: Run `./run-k8s.sh`
3.  **Local Mapping**: Add the following to your `hosts` file:
    ```bash
    127.0.0.1 medsync.local
    ```
4.  **Access**: Visit `http://medsync.local`

---

## 🔑 User Role Credentials

| Role | Email | Password | Dashboard URL |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@medsync.com` | `admin123` | `/admin` |
| **Doctor** | (Register first) | (Your Choice) | `/doctor` |
| **Patient** | (Register first) | (Your Choice) | `/` (Home) |

---

## 📋 Assignment Deliverables Checklist

- [x] **Microservices**: All 8 services containerized.
- [x] **Advanced Tech**: Kafka, Redis, and Gemini AI integration.
- [x] **Documentation**: Automatic README, Startup Scripts, and K8s manifests.
- [x] **Secure Access**: JWT cross-service verification.
- [x] **UI/UX**: Premium medical-themed dashboard.

---

*Developed for SE3020 Distributed Systems (BSC Information Technology).*