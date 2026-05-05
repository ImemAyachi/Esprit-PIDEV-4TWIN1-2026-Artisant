# 🏗️ Documentation Infrastructure DevOps — BuildMarket

Ce document détaille l'architecture CI/CD, les outils utilisés et les commandes essentielles pour la gestion du projet BuildMarket.

## 📋 Architecture Globale
L'infrastructure repose sur une séparation nette entre l'intégration continue (Jenkins sur Windows) et le déploiement continu (Kubernetes sur VM Ubuntu).

1.  **Développement** : VS Code (Windows).
2.  **Intégration Continue (CI)** : Jenkins (Docker container sur Windows).
3.  **Analyse Statique** : SonarQube (Docker container sur Windows).
4.  **Registre d'images** : DockerHub.
5.  **Déploiement Continu (CD)** : Kubernetes (Kubeadm sur VM Ubuntu).

---

## 🛠️ Outils et Services
- **Jenkins** : Port `9080` (Interface), `50000` (Agent).
- **SonarQube** : Port `9000`.
- **Kubernetes API** : Port `6443` (Sur la VM).
- **Frontend App** : Port `30975` (NodePort).
- **Backend API** : Port `31070` (NodePort).

---

## 🚀 Pipelines Jenkins (CI/CD en 4 étapes)
Nous avons séparé la logique en 4 pipelines pour plus de modularité :
1.  **`buildmarket-backend`** (CI) : Test, Sonar, Build & Push Docker.
2.  **`buildmarket-backend-cd`** (CD) : Déploiement Kubernetes du Backend & MongoDB.
3.  **`buildmarket-frontend`** (CI) : Sonar, Build & Push Docker.
4.  **`buildmarket-frontend-cd`** (CD) : Déploiement Kubernetes du Frontend.

---

## 💻 Commandes Essentielles

### 1. Gestion des Containers (Docker sur Windows)
```powershell
# Démarrer toute l'infrastructure (Jenkins, Sonar, DB)
docker-compose up -d

# Voir les logs de Jenkins
docker logs -f buildmarket-jenkins

# Vérifier que SonarQube est prêt
docker logs -f buildmarket-sonarqube
```

### 2. Automatisation du Monitoring (Grafana)
```powershell
# Commande pour créer le Dashboard automatiquement
cd scripts
npm install axios
node grafana_setup.js
```

### 3. Installation de kubectl dans Jenkins
```powershell
# Commande utilisée pour permettre à Jenkins de piloter K8s
docker exec -u 0 buildmarket-jenkins curl -LO "https://dl.k8s.io/release/v1.30.0/bin/linux/amd64/kubectl"
docker exec -u 0 buildmarket-jenkins install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### 3. Gestion du Cluster Kubernetes (Sur la VM Ubuntu)
```bash
# Vérifier l'état des Pods
kubectl get pods -A

# Voir les services et les ports d'accès (NodePort)
kubectl get svc -n buildmarket

# Consulter les logs d'un Pod (ex: Backend)
kubectl logs -f deployment/backend-deployment -n buildmarket

# Réinitialiser le réseau Flannel (si crash)
sudo modprobe br_netfilter
sudo sysctl -w net.bridge.bridge-nf-call-iptables=1
```

### 4. Sécurité et Images Privées
```bash
# Créer le secret pour DockerHub (Indispensable pour ImagePullBackOff)
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=alabendawed871 \
  --docker-password=VOTRE_PASSWORD \
  --docker-email=VOTRE_EMAIL \
  -n buildmarket
```

---

## 🔍 Monitoring et Debugging
- **Logs Jenkins** : Directement dans l'interface pour voir les échecs de build.
- **SonarQube** : [http://localhost:9000](http://localhost:9000) pour voir la dette technique.
- **K8s Describe** : En cas de Pod qui ne démarre pas :
  ```bash
  kubectl describe pod [NOM_DU_POD] -n buildmarket
  ```

---
**BuildMarket DevOps — 2026**
