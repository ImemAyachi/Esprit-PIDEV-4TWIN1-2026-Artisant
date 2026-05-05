# ============================================================
# BuildMarket — Backend (Node.js / Express + Python)
# ============================================================

FROM node:18-slim

# Installer dumb-init, python3, pip, and OpenCV system dependencies
RUN apt-get update && apt-get install -y \
    dumb-init \
    python3 \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Installer les packages Python requis
RUN pip3 install opencv-python-headless numpy --no-cache-dir --break-system-packages

# Créer un utilisateur non-root pour la sécurité
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# Copier les fichiers de dépendances en premier (cache Docker)
COPY package.json package-lock.json ./

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev && npm cache clean --force

# Copier le code source
COPY . .

# Créer le dossier uploads et donner les permissions
RUN mkdir -p /app/uploads /app/tmp && chown -R appuser:appgroup /app

# Passer en utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Démarrer avec dumb-init pour la gestion propre des signaux
CMD ["dumb-init", "node", "src/index.js"]
