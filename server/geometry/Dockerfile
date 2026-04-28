# ============================================================
# BuildMarket — Geometry Service (FastAPI + Shapely)
# Image Python slim pour la génération de plans 2D
# ============================================================

FROM python:3.9-slim

# Installer les dépendances système nécessaires pour Shapely (libgeos)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libgeos-dev \
        wget \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source dans un sous-répertoire pour gérer les packages Python
COPY . geometry/

# Donner les permissions
RUN chown -R appuser:appgroup /app

# Passer en utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 8008

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8008/health || exit 1

# Lancer avec uvicorn en tant que module
CMD ["uvicorn", "geometry.app:app", "--host", "0.0.0.0", "--port", "8008"]
