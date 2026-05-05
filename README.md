<<<<<<< HEAD
# Artisant – Artisanal E-commerce & Management Platform

## Overview
This project was developed as part of the **PIDEV – 4th Year Engineering Program (4TWIN1)** at **Esprit School of Engineering** (Academic Year 2025–2026). 
Artisant is a comprehensive full-stack application designed by **NextGen Devs** to empower artisans, manufacturers, and experts by providing a platform for marketplace interactions, product management, and efficient order tracking.

## Features
- **Role-Based Access Control**: Secure login/registration for Artisans, Manufacturers, Experts, and Admins.
- **Dynamic Marketplace**: Exploration and listing of artisanal products.
- **Order Management System**: Full lifecycle tracking from creation through status updates and history.
- **Product Management**: Robust tools for manufacturers and admins to manage their catalogs.
- **Accessibility & Inclusivity**: Built with Gesture Control and Screen Reader optimizations.
- **Analytics Dashboards**: Insightful monitoring for both users and administrators.

## Tech Stack
### Frontend
- **React 19** with **Vite**
- **Tailwind CSS** for modern, responsive styling
- **Zustand** for state management
- **Framer Motion** for smooth animations
- **Lucide-React** for iconography
- **React-Router-DOM** for navigation

### Backend
- **Node.js** & **Express** (API framework)
- **MongoDB** with **Mongoose** (Database)
- **JWT** (Authentication)
- **Bcrypt.js** (Security)
- **Morgan** (Logging)

## Architecture
Artisant follows a **MERN stack** architecture with a clear separation between the client and server. The backend exposes a RESTful API consumed by the React-based single-page application (SPA).

## Contributors
- **NextGen Devs**

## Academic Context
Developed at **Esprit School of Engineering – Tunisia**  
PIDEV – 4TWIN1 | 2025–2026  
*Project Group: NextGen Devs*


## Getting Started
### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### Installation
1. Clone the repository:
   ```bash
   git clone [your-github-url-here]
   ```
2. Setup Backend:
   ```bash
   cd server
   npm install
   # Create a .env file with PORT, MONGODB_URI, JWT_SECRET
   npm run dev
   ```
3. Setup Frontend:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

## Acknowledgments
We would like to thank **Esprit School of Engineering** for providing the academic framework and tools to build this project. Special thanks to the mentors and the engineering community for their support.
=======
# 🏗️ BuildMarket — Plateforme Marketplace BTP

Plateforme d'échange entre Architectes/Ingénieurs, Artisans et Fournisseurs de matériaux de construction.

## 🗂️ Structure du projet

```
piweb/
├── front/          # React (Vite) — Interface utilisateur
└── server/         # Node.js/Express — API REST + Socket.io
```

## ⚙️ Prérequis

- Node.js >= 18
- MongoDB >= 6 (local ou Atlas)
- MongoDB Compass (optionnel, pour visualisation)
- npm >= 9

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd piweb
```

### 2. Backend (server/)

```bash
cd server
npm install
cp .env.example .env
# Éditer .env avec vos valeurs (MongoDB URI, JWT_SECRET, etc.)
npm run dev
```

### 3. Frontend (front/)

```bash
cd front
npm install
cp .env.example .env
# Éditer .env
npm run dev
```

## 🌍 NLP (langues + Arabizi + fautes)

Le chatbot du frontend (`front/`) peut pré-traiter chaque message via un service NLP (FastAPI) pour :
- Détecter la langue (y compris **Arabizi / Darija**)
- Corriger les fautes / mots mal écrits
- Normaliser le texte avant envoi au backend `/api/chat`

Backend `server/.env` (optionnel) :

- `NLP_PROCESSOR_URL` (défaut: `http://localhost:8000/api/v1/process`)

## 🔧 Variables d'environnement

### server/.env

| Variable | Description | Exemple |
|---|---|---|
| `PORT` | Port du serveur | `5000` |
| `MONGO_URI` | URI MongoDB | `mongodb://localhost:27017/buildmarket` |
| `JWT_SECRET` | Clé secrète JWT | `super_secret_key_change_me` |
| `JWT_EXPIRE` | Durée du token | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Nom cloud Cloudinary | |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | |
| `CLOUDINARY_API_SECRET` | Secret Cloudinary | |
| `CLIENT_URL` | URL du frontend | `http://localhost:5173` |
| `NODE_ENV` | Environnement | `development` |

### front/.env

| Variable | Description | Exemple |
|---|---|---|
| `VITE_API_URL` | URL de l'API | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | URL Socket.io | `http://localhost:5000` |

## 🌐 URLs par défaut

- Frontend : http://localhost:5173
- Backend API : http://localhost:5000/api
- Swagger docs : http://localhost:5000/api-docs

## 🧠 Geometry service (FastAPI + Shapely)

Le générateur de plan 2D “ready-to-use” peut s’appuyer sur un service Python dédié (géométrie + contraintes strictes).

### Lancer le service

```bash
cd server/geometry
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8008
```

### Variables d’environnement (server/.env)

- `GEOMETRY_SERVICE_URL`: ex. `http://localhost:8008`

## 🗄️ MongoDB Compass

Connectez-vous avec : `mongodb://localhost:27017`

Collections disponibles après le seed :
- `users` — Tous les utilisateurs (multi-rôles)
- `products` — Catalogue produits fournisseurs
- `services` — Services des artisans
- `quotes` — Devis (architecte → artisan)
- `orders` — Commandes produits
- `reviews` — Avis sur produits/services
- `projects` — Chantiers (ingénieurs)
- `notifications` — Notifications temps réel

### Exemples de requêtes MongoDB Compass

```js
// Tous les artisans actifs
{ role: "Artisan", isActive: true }

// Produits d'une catégorie
{ category: "marbre", isAvailable: true }

// Devis en attente
{ status: "pending" }

// Utilisateurs validés par l'admin
{ isVerified: true, role: { $in: ["Architecte", "Ingenieur"] } }
```

## 🌱 Seed (données de test)

```bash
cd server
npm run seed
```

Cela crée :
- 1 Super Admin (admin@buildmarket.com / Admin123!)
- 2 Architectes, 2 Ingénieurs, 3 Artisans, 2 Fournisseurs

## 📚 Rôles disponibles

| Rôle | Description |
|---|---|
| `SuperAdmin` | Gestion globale |
| `Architecte` | Recherche artisans, catalogue |
| `Ingenieur` | Gestion chantiers + artisans |
| `Fournisseur` | Catalogue produits |
| `Artisan` | Devis, suivi financier |

## 🛠️ Stack technique

**Backend :** Node.js, Express, Mongoose, JWT, bcryptjs, Socket.io, Multer, Cloudinary, Swagger  
**Frontend :** React 18, Vite, Redux Toolkit, React Router v6, Axios, Socket.io-client, React Hook Form, Recharts
>>>>>>> imem
