@echo off
echo 🚀 Starting MedSync Orchestration on Kubernetes...

where kubectl >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: kubectl could not be found. Please install it to proceed.
    pause
    exit /b 1
)

echo 📦 Applying manifests from /k8s...
kubectl apply -k k8s/

echo ⏳ Waiting for pods to initialize in "medsync" namespace...
kubectl get pods -n medsync

echo --------------------------------------------------------
echo ✅ Deployment initiated!
echo --------------------------------------------------------
echo 🌐 Access the platform via: http://medsync.local
echo 📝 Note: Ensure "medsync.local" is mapped to your cluster's ingress IP in C:\Windows\System32\drivers\etc\hosts.
echo 🔎 Run "kubectl get all -n medsync" to check detailed status.
echo --------------------------------------------------------
pause
