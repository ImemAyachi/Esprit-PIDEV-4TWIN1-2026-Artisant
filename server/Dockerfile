# ============================================================
# BuildMarket — Backend (Node.js / Express)
# Image légère avec utilisateur non-root
# ============================================================

FROM node:22-alpine

# Installer dumb-init pour un PID 1 propre (gestion des signaux)
RUN apk add --no-cache dumb-init

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copier les fichiers de dépendances en premier (cache Docker)
COPY package.json package-lock.json ./

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev && npm cache clean --force

# Copier le code source
COPY . .

# Créer le dossier uploads et donner les permissions
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Passer en utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Démarrer avec dumb-init pour la gestion propre des signaux
CMD ["dumb-init", "node", "src/index.js"]
