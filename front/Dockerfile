# ============================================================
# BuildMarket — Frontend (React + Vite 8)
# Multi-stage build : Node (Debian) → Nginx
# Fix: package.json only (no lock) to get correct Linux binaries
# for rolldown, lightningcss and other native packages
# ============================================================

# ── Stage 1 : Build ──────────────────────────────────────────
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Copier UNIQUEMENT package.json (pas le package-lock.json Windows)
# Cela force npm à résoudre et télécharger les bons binaires Linux
COPY package.json ./

# Installation propre avec les binaires Linux natifs
RUN npm install --legacy-peer-deps

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
