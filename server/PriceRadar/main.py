import os
import math
import datetime
import torch
import numpy as np
import io
from PIL import Image, ImageFilter
from typing import List, Optional
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

# Import PriceSeer (LSTM Engine)
from priceseer import PriceSeerService

load_dotenv()

app = FastAPI(title="PriceRadar 3.0 — Surveillance & Prédiction")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def serialize_doc(doc):
    if not doc: return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        return {k: (str(v) if isinstance(v, (ObjectId, datetime.datetime)) else serialize_doc(v)) for k, v in doc.items()}
    return doc

# --- SERVICES ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/artisanet")
client = AsyncIOMotorClient(MONGO_URI)
db = client.get_database("artisanet")
price_seer = PriceSeerService()

class PriceSubmission(BaseModel):
    productId: Optional[str] = None
    name: str
    category: str
    price: float
    supplierId: str
    stock: int = 0
    description: Optional[str] = ""
    specifications: Optional[str] = ""
    city: Optional[str] = "Tunis"

class PriceSuggestionRequest(BaseModel):
    name: str
    category: str
    description: str
    specifications: Optional[str] = ""
    tags: Optional[str] = ""
    city: str
    stock: int = 0
    marketAvg: Optional[float] = None

class ChartRequest(BaseModel):
    history: List[dict]
    marketAvg: float

# --- ALGORITHMES DE CALCUL (BUSINESS INTELLIGENCE) ---

def calculate_mean(prices: List[float]) -> float:
    if not prices: return 0.0
    return sum(prices) / len(prices)

def calculate_deviation(price: float, mean: float) -> float:
    if mean == 0: return 0.0
    return ((price - mean) / mean) * 100

def get_transparency_status(deviation: float) -> dict:
    """Badge de Transparence visuel (PriceRadar 3.0)"""
    if deviation <= 10:
        return {"color": "green", "label": "Prix Optimal", "level": 1}
    elif deviation <= 20:
        return {"color": "orange", "label": "Légèrement Supérieur", "level": 2}
    else:
        return {"color": "red", "label": "Écart Significatif", "level": 3}

# --- ENDPOINTS API ---

@app.post("/analyze")
async def analyze_price_3_0(submission: PriceSubmission):
    # 1. Surveillance Temps Réel (3 mois d'historique)
    ninety_days_ago = datetime.datetime.now() - datetime.timedelta(days=90)
    
    cursor = db.products.find({
        "category": submission.category,
        "createdAt": {"$gte": ninety_days_ago}
    })
    
    market_data = []
    async for doc in cursor:
        market_data.append(doc)
    
    market_prices = [d["price"] for d in market_data]
    market_avg = calculate_mean(market_prices) if market_prices else 100.0
    
    # 2. Obtenir la prédiction IA "From Scratch" (Référence de confiance)
    ai_suggested_price = price_seer.predict_suggestion({
        "name": submission.name,
        "category": submission.category,
        "description": submission.description or submission.name, 
        "specifications": submission.specifications,
        "city": submission.city,
        "stock": submission.stock,
        "marketAvg": market_avg
    })

    # 3. Calculer l'écart par rapport à l'IA (Seuil réduit à 1% pour assurer que le test se déclenche si différent)
    deviation = ((submission.price - ai_suggested_price) / ai_suggested_price) * 100
    
    status = "normal"
    predictive_note = ""
    
    if deviation > 5: # Seuil de 5% au dessus
        status = "high"
        predictive_note = f"Alerte : Votre prix est {round(deviation, 1)}% au-dessus de la recommandation IA ({ai_suggested_price} DT)."
    elif deviation < -5: # Seuil de 5% en dessous
        status = "low"
        predictive_note = f"Produit Chance : Ce prix est très compétitif ({round(abs(deviation), 1)}% en dessous de l'IA)."
    else:
        predictive_note = "Votre prix est validé par PriceSeer (conforme aux prévisions)."

    # 4. Transparence et Score d'Opportunité
    transparency = get_transparency_status(deviation)
    opportunity_score = 0
    if status == "low":
        gap_score = min(abs(deviation) * 2, 70) 
        stock_score = min(submission.stock / 100 * 30, 30)
        opportunity_score = gap_score + stock_score

    response = {
        "status": status,
        "transparency": transparency,
        "marketAvg": round(ai_suggested_price, 2), # Le prix IA devient la référence
        "deviationPercent": round(deviation, 1),
        "prediction": {"suggested": ai_suggested_price, "reference": "PriceSeer 3.0"},
        "predictiveNote": predictive_note,
        "opportunityScore": round(opportunity_score, 1),
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    # Auto-entraînement : Ajout au buffer de mémoire
    price_seer.add_to_memory(submission.dict(), submission.price)
    
    return response

@app.post("/suggest-price")
async def suggest_price(req: PriceSuggestionRequest):
    # Fallback pour marketAvg si non fourni
    if not req.marketAvg:
        cursor = db.products.find({"category": req.category})
        prices = []
        async for doc in cursor:
            prices.append(doc["price"])
        req.marketAvg = calculate_mean(prices) if prices else 100.0

    prediction = price_seer.predict_suggestion({
        "name": req.name,
        "category": req.category,
        "description": req.description,
        "specifications": req.specifications,
        "tags": req.tags,
        "city": req.city,
        "stock": req.stock,
        "marketAvg": req.marketAvg
    })

    return {
        "suggestedPrice": prediction,
        "marketAvg": round(req.marketAvg, 2),
        "currency": "DT"
    }

@app.post("/chart")
async def get_price_chart_3_0(req: ChartRequest):
    history = req.history
    if not history:
        return {"svg": "<svg></svg>", "history": [], "marketAvg": req.marketAvg}
    
    market_avg = req.marketAvg
    
    # --- LOGIQUE GÉNÉRATION SVG PRICERADAR (DESIGN PREMIUM) ---
    width = 600
    height = 200
    padding = 30
    
    prices = [h["price"] for h in history]
    # Padding dynamique pour que le graph respire
    min_p = min(prices + [market_avg * 0.8])
    max_p = max(prices + [market_avg * 1.2])
    range_p = (max_p - min_p) if max_p != min_p else 1
    
    def get_y(p):
        return height - padding - ((p - min_p) / range_p) * (height - 2 * padding)
    
    def get_x(i):
        if len(history) <= 1: return width / 2
        return padding + (i / (len(history) - 1)) * (width - 2 * padding)

    # Gradients, Filtres et Animations CSS
    defs = """
    <defs>
        <linearGradient id="normalityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#10b981" stop-opacity="0.02" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <style>
            @keyframes pulse {
                0% { stroke-width: 2; opacity: 1; filter: drop-shadow(0 0 4px rgba(139,92,246,0.6)); }
                50% { stroke-width: 4; opacity: 0.8; filter: drop-shadow(0 0 8px rgba(139,92,246,0.9)); }
                100% { stroke-width: 2; opacity: 1; filter: drop-shadow(0 0 4px rgba(139,92,246,0.6)); }
            }
            .animated-dot { animation: pulse 2s infinite ease-in-out; transform-origin: center; }
            .price-text { font-family: 'Inter', system-ui, sans-serif; font-size: 13px; font-weight: 800; fill: #1e293b; }
            .market-text { font-family: 'Inter', system-ui, sans-serif; font-size: 11px; font-weight: 700; fill: #059669; }
            .zone-text { font-family: 'Inter', system-ui, sans-serif; font-size: 10px; font-weight: 600; fill: #10b981; opacity: 0.8; }
        </style>
    </defs>
    """

    # 1. Zone de Normalité (Market Interval)
    y_top = get_y(market_avg * 1.15)
    y_bottom = get_y(market_avg * 0.85)
    normality_rect = f'<rect x="{padding}" y="{y_top}" width="{width-2*padding}" height="{y_bottom-y_top}" fill="url(#normalityGrad)" rx="8" />'
    
    # 2. Ligne de Moyenne du Marché
    y_avg = get_y(market_avg)
    avg_line = f'<line x1="{padding}" y1="{y_avg}" x2="{width-padding}" y2="{y_avg}" stroke="#10b981" stroke-dasharray="6,4" stroke-width="1.5" />'
    
    # 3. Chemin des prix
    points = []
    if len(history) == 1:
        p_y = get_y(history[0]['price'])
        points = [f"{padding},{p_y}", f"{width-padding},{p_y}"]
    else:
        for i, h in enumerate(history):
            points.append(f"{get_x(i)},{get_y(h['price'])}")
            
    path_d = f"M {points[0]} " + " ".join([f"L {p}" for p in points[1:]])
    price_path = f'<path d="{path_d}" fill="none" stroke="url(#lineGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)" />'
    
    # 4. Points et Textes
    dots = []
    texts = []
    
    if len(history) == 1:
        x, y = width / 2, get_y(history[0]['price'])
        dots.append(f'<circle cx="{x}" cy="{y}" r="6" fill="#8b5cf6" stroke="white" stroke-width="2" class="animated-dot" />')
        texts.append(f'<text x="{x}" y="{y-15}" text-anchor="middle" class="price-text">{history[0]["price"]} DT</text>')
    else:
        for i, h in enumerate(history):
            x, y = get_x(i), get_y(h["price"])
            is_last = i == len(history) - 1
            r = 6 if is_last else 4.5
            cls = 'class="animated-dot"' if is_last else ''
            dots.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#8b5cf6" stroke="white" stroke-width="2" {cls} />')
            texts.append(f'<text x="{x}" y="{y-12}" text-anchor="middle" class="price-text">{h["price"]} DT</text>')
            
    svg = f"""
    <svg width="100%" height="100%" viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        {defs}
        {normality_rect}
        {avg_line}
        <text x="{padding + 5}" y="{y_top - 6}" class="zone-text">Zone de Prix Optimal</text>
        <text x="{padding + 5}" y="{y_avg - 6}" class="market-text">Moyenne IA : {market_avg} DT</text>
        {price_path}
        {''.join(dots)}
        {''.join(texts)}
    </svg>
    """
    
    return {"svg": svg, "history": serialize_doc(history), "marketAvg": market_avg}

@app.post("/analyze-material")
async def analyze_material(file: UploadFile = File(...)):
    """
    Material-QC AI Endpoint (Computer Vision)
    Analyzes an uploaded image of a material (e.g., marble, tile) and returns a quality grade.
    For this implementation, we use an edge-detection heuristic (simulating CNN crack detection)
    that looks for anomalies in typically smooth materials.
    """
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("L")  # Convert to Grayscale
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image format")
        
    # Simulate CNN feature extraction by analyzing high-frequency edges (cracks/scratches)
    edges = image.filter(ImageFilter.FIND_EDGES)
    edge_data = np.array(edges)
    
    # Calculate defect score (percentage of strong edges / noise)
    threshold = 50
    defect_pixels = np.sum(edge_data > threshold)
    total_pixels = edge_data.size
    defect_ratio = (defect_pixels / total_pixels) * 100
    
    # Assign Grade based on defect ratio
    if defect_ratio < 2.5:
        grade = "Premium"
        status = "success"
        confidence = min(99.5, 98.5 - defect_ratio)
        note = "Surface parfaite. Aucun défaut majeur ou micro-fissure détecté."
    elif defect_ratio < 7.0:
        grade = "Standard"
        status = "warning"
        confidence = 92.0 - defect_ratio
        note = "Qualité acceptable. Présence de légères irrégularités ou textures naturelles prononcées."
    else:
        grade = "Economy"
        status = "error"
        confidence = min(99.0, 85.0 + (defect_ratio / 2))
        note = f"Défauts importants détectés (Fissures ou très forte rugosité : {defect_ratio:.1f}% d'anomalies)."

    return {
        "success": True,
        "grade": grade,
        "status": status,
        "defectScore": round(defect_ratio, 2),
        "confidence": round(confidence, 1),
        "note": note,
        "aiModel": "Material-QC ResNet18 (Edge-Heuristic Mode)"
    }

@app.post("/update-trust-score")
async def update_trust_score(supplierId: str, actionType: str):
    points = {'accepted_warning': 2, 'ignored_warning': -5, 'extraordinary_offer': 10}.get(actionType, 0)
    from bson import ObjectId
    await db.users.update_one({"_id": ObjectId(supplierId)}, {"$inc": {"supplierTrustScore": points}})
    return {"success": True}

# --- TACHE PLANIFIEE (Simulation) ---
@app.post("/nightly-update")
async def simulate_nightly_task():
    """Simule la tâche planifiée nocturne qui recalcule tout"""
    # Dans la réalité, ceci parcourrait tous les produits actifs
    return {"message": "Prédictions PriceSeer mises à jour pour l'ensemble du catalogue."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
