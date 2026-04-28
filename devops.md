# 🏗️ BuildMarket — Documentation DevOps

Ce document détaille l'infrastructure technique, l'automatisation CI/CD et l'orchestration du projet BuildMarket.

## 1. 🐳 Dockerisation & Orchestration
L'application est entièrement conteneurisée pour garantir la parité entre les environnements de développement et de production.

### Services
- **Frontend** : React (Vite 8) servi par Nginx (Build multi-étape).
- **Backend** : Node.js 18 (Express API).
- **Geometry Service** : Python 3.9 (FastAPI).
- **Database** : MongoDB (Image officielle).

### Commandes utiles
```bash
# Lancer toute l'infrastructure
docker-compose up -d --build

# Voir les logs en temps réel
docker-compose logs -f
```

## 2. 🔍 Qualité du Code (SonarQube)
Le suivi de la qualité est assuré par un serveur SonarQube local ou via SonarCloud.

- **Interface locale** : [http://localhost:9000](http://localhost:9000)
- **Analyse manuelle** :
```bash
docker run --rm -v "${PWD}:/usr/src" sonarsource/sonar-scanner-cli \
  -Dsonar.projectKey=BuildMarket -Dsonar.host.url=http://localhost:9000
```

## 🚀 3. CI/CD (GitHub Actions)
Quatre pipelines automatisent le cycle de vie du projet (`.github/workflows/`) :

| Workflow | Rôle | Déclencheur |
| :--- | :--- | :--- |
| **Frontend CI** | Lint + Tests + SonarQube | Push/PR front/ |
| **Backend CI** | Tests + SonarQube | Push/PR server/ |
| **Frontend CD** | Build & Push Docker Hub | Success CI Main |
| **Backend CD** | Build & Push Docker Hub | Success CI Main |

## ☸️ 4. Kubernetes (Production)
Le déploiement distribué est géré via un cluster `kubeadm` (1 Master, 2 Workers).

### Déploiement de l'infrastructure
Les manifestes se trouvent dans le dossier `k8s/` :
1. **Prepare Nodes** : `sudo ./k8s/scripts/prepare-nodes.sh`
2. **Init Master** : `./k8s/scripts/init-master.sh`
3. **Apply Manifests** :
```bash
kubectl apply -f k8s/manifests/infra.yaml
kubectl apply -f k8s/manifests/app.yaml
```

## 📊 5. Monitoring & Métriques (Prometheus & Grafana)
Le système de monitoring permet de surveiller la santé du cluster et de l'application.

- **Prometheus** : Collecte les métriques (Port 9090).
- **Grafana** : Visualisation (Port 3000, Login: `admin/admin`).
- **Node Exporter** : Fournit les métriques système des hôtes.

### Déploiement K8s
```bash
kubectl apply -f k8s/manifests/monitoring.yaml
```
Accès Grafana : `http://<IP_DU_MASTER>:32000`

---
*Document généré pour le projet PIDEV - Esprit 2026*
