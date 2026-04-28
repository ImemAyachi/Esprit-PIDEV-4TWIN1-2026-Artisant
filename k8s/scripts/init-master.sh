#!/bin/bash
# ============================================================
# BuildMarket — Kubernetes Master Initialization
# Run this ONLY on the Master Node
# ============================================================

set -e

echo "🕸️ Initializing Control Plane..."

# 1. Init Kubeadm
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# 2. Setup Kubeconfig for current user
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# 3. Install Flannel CNI (Simplest for distributed VMs)
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

echo "✅ Master Node Initialized!"
echo "👉 Use the 'kubeadm join' command above to add your worker nodes."
