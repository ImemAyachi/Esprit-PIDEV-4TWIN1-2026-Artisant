<div align="center">
  <img src="https://res.cloudinary.com/dvz0zsgw5/image/upload/v1714571987/logo-artisant.png" alt="Artisant Logo" height="80">
  <h1>Artisant</h1>
  <p><strong>Plateforme Marketplace BTP Nouvelle Génération intégrée à l'IA</strong></p>
  
  [![Frontend](https://img.shields.io/badge/Frontend-Live_on_Vercel-000000?style=for-the-badge&logo=vercel)](https://artisanet.vercel.app/)
  [![Backend API](https://img.shields.io/badge/Backend-Live_on_Render-46E3B7?style=for-the-badge&logo=render)](https://artisanet.onrender.com/)
</div>

<br/>

## Liens Déployés (Production)

L'application est entièrement déployée et accessible via les liens suivants :

* **Frontend (Vercel)** : [https://artisanet.vercel.app/](https://artisanet.vercel.app/)
* **Backend API (Render)** : [https://artisanet.onrender.com/](https://artisanet.onrender.com/)

---

## À Propos du Projet

**Artisant** est une plateforme d'échange et de collaboration complète conçue spécifiquement pour les acteurs du BTP. Elle connecte de manière transparente les **Architectes**, les **Ingénieurs**, les **Artisans** et les **Fournisseurs de matériaux**, en fluidifiant les échanges, la gestion de chantiers, les devis et la commande de matériel.

Le projet intègre des fonctionnalités avancées d'**Intelligence Artificielle** pour aider à la création de plans 2D, à l'estimation de matériaux et propose un chatbot intelligent comprenant les dialectes locaux (Arabizi/Darija).

---

## Fonctionnalités Principales

- **Marketplace de Matériaux** : Les fournisseurs exposent leurs catalogues, les architectes et ingénieurs commandent en direct.
- **Gestion des Devis et Chantiers** : Appels d'offres, attributions de chantiers aux artisans, suivi financier.
- **Communication Temps Réel** : Chat intégré avec support NLP (correction de fautes, traduction Arabizi).
- **Intelligence Artificielle** :
  - Génération et analyse de plans 2D (Geometry service via FastAPI + Shapely).
  - Reconnaissance gestuelle et modélisation 3D basique.
  - Recommandation intelligente de produits.
- **Espace Pro 100% Personnalisé** : Des tableaux de bord analytiques uniques selon le rôle de l'utilisateur (SuperAdmin, Fournisseur, Architecte, etc.).

---

## Rôles Utilisateurs

| Rôle | Accès & Fonctionnalités |
|---|---|
| **SuperAdmin** | Tableau de bord analytique, modération, gestion globale des utilisateurs et des transactions. |
| **Architecte** | Recherche d'artisans, parcours de catalogues fournisseurs, génération de plans IA. |
| **Ingénieur** | Gestion de chantiers complexes, recrutement d'artisans, suivi d'avancement. |
| **Fournisseur** | Gestion du catalogue de matériaux, suivi des commandes, gestion des stocks. |
| **Artisan** | Réception de devis, gestion des tâches de chantier, suivi financier. |

---

## Stack Technique

### Frontend (Application Client)
* **Framework** : React 18, Vite
* **State Management** : Redux Toolkit
* **Routage** : React Router v6
* **Appels API & Temps Réel** : Axios, Socket.io-client
* **UI/UX & Formulaires** : React Hook Form, Recharts, CSS Custom

### Backend (Serveur API)
* **Environnement** : Node.js (v18+), Express
* **Base de Données** : MongoDB (Mongoose)
* **Sécurité & Authentification** : JWT, bcryptjs
* **Médias** : Multer, Cloudinary
* **Temps Réel** : Socket.io
* **Documentation** : Swagger

### Services IA (Microservices)
* **Python** : FastAPI, OpenCV, Shapely, NLP Processors

---

## Installation Locale (Développement)

Si vous souhaitez exécuter le projet localement pour le développement :

### 1. Cloner le dépôt
```bash
git clone https://github.com/ImemAyachi/Esprit-PIDEV-4TWIN1-2026-Artisant.git
cd Esprit-PIDEV-4TWIN1-2026-Artisant
```

### 2. Démarrer le Backend
```bash
cd server
npm install
# Créez votre fichier .env basé sur .env.example
npm run dev
```

### 3. Démarrer le Frontend
```bash
cd front
npm install
# Créez votre fichier .env basé sur .env.example
npm run dev
```

### 4. Jeu d'Essai (Seed)
Pour peupler la base de données avec des utilisateurs de test et des produits :
```bash
cd server
npm run seed
```

---
<div align="center">
  <i>Développé dans le cadre du projet PI (4TWIN1) — 2026</i>
</div>
