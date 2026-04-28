# ☸️ Kubernetes Cluster Deployment — BuildMarket

Ce dossier contient les ressources nécessaires pour déployer le projet BuildMarket sur un cluster Kubernetes distribué (1 Master, 2 Workers) en utilisant **kubeadm**.

## 🏗️ Architecture du Cluster
- **Nœud Master** : Gestion du Control Plane, API Server et ordonnancement.
- **Nœuds Workers** : Exécution des Pods applicatifs (Frontend, Backend, Geometry, MongoDB).
- **Réseau Pod** : Flannel (CIDR: 10.244.0.0/16).
- **Stockage** : PersistentVolume local pour la base de données MongoDB.

---

## 🚀 Guide de Déploiement

### Étape 1 : Préparation des VM (VirtualBox)
1. Créer 3 instances Ubuntu Server 22.04.
2. Configurer une IP statique sur le réseau privé hôte pour chaque nœud.
3. Désactiver le swap sur chaque nœud (le script s'en occupe).

### Étape 2 : Installation des composants (Tous les nœuds)
Exécuter le script de préparation :
```bash
chmod +x scripts/prepare-nodes.sh
sudo ./scripts/prepare-nodes.sh
```

### Étape 3 : Initialisation du Master
Sur le nœud Master uniquement :
```bash
chmod +x scripts/init-master.sh
./scripts/init-master.sh
```
*Récupérez la commande `kubeadm join` affichée à la fin.*

### Étape 4 : Jonction des Workers
Sur chaque nœud Worker, collez la commande `kubeadm join` fournie par le Master.

### Étape 5 : Déploiement de BuildMarket
Sur le Master :
```bash
kubectl apply -f manifests/infra.yaml
kubectl apply -f manifests/app.yaml
```

---

## 🛠️ Commandes Utiles de Vérification

### État du Cluster
```bash
kubectl get nodes           # Vérifier que les 3 nœuds sont 'Ready'
kubectl get pods -A         # Voir tous les pods du cluster (y compris système)
```

### État de l'Application
```bash
kubectl get pods            # Vérifier que tous les pods BuildMarket sont 'Running'
kubectl get svc             # Voir les services et le port NodePort
kubectl get pvc             # Vérifier que le volume MongoDB est 'Bound'
```

### Debugging
```bash
kubectl logs <pod-name>     # Voir les logs d'un pod spécifique
kubectl describe pod <name> # Diagnostiquer un pod qui ne démarre pas
```

---
*Support Technique DevOps — Projet BuildMarket*
