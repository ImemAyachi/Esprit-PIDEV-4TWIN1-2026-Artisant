# ============================================================
# BuildMarket — Frontend (React + Vite)
# Multi-stage build : Node → Nginx
# ============================================================

# ── Stage 1 : Build ──────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances en premier (cache Docker)
COPY package.json package-lock.json ./

# Installer toutes les dépendances (y compris devDependencies pour le build)
RUN npm ci

# Copier le reste du code source
COPY . .

# Variables d'env injectées au build-time pour Vite
ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_SOCKET_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build de production
RUN npm run build

# ── Stage 2 : Production (Nginx) ────────────────────────────
FROM nginx:stable-alpine AS production

# Supprimer la config par défaut de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copier notre configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers statiques depuis le stage de build
COPY --from=build /app/dist /usr/share/nginx/html

# Exposer le port 80 (mappé sur 5173 via docker-compose)
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
