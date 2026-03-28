#!/bin/bash

# MedSync Kubernetes Deployment Script

echo "🚀 Starting MedSync Orchestration on Kubernetes..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null
then
    echo "❌ Error: kubectl could not be found. Please install it to proceed."
    exit 1
fi

# Apply the entire Kubernetes configuration using Kustomize
echo "📦 Applying manifests from /k8s..."
kubectl apply -k k8s/

echo "⏳ Waiting for pods to initialize in 'medsync' namespace..."
kubectl get pods -n medsync

echo "--------------------------------------------------------"
echo "✅ Deployment initiated!"
echo "--------------------------------------------------------"
echo "🌐 Access the platform via: http://medsync.local"
echo "📝 Note: Ensure 'medsync.local' is mapped to your cluster's ingress IP in /etc/hosts."
echo "🔎 Run 'kubectl get all -n medsync' to check detailed status."
echo "--------------------------------------------------------"
