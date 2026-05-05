from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from geometry.engine import generate_layout
from geometry.schemas import LayoutRequest, LayoutResponse

app = FastAPI(title="BuildMarket Geometry Service", version="0.1.0")

from geometry.ml_engine import init_ml, get_recommendations

@app.on_event("startup")
def startup_event():
    init_ml()

@app.get("/health")
def health():
    return {"ok": True}

from pydantic import BaseModel
class RecommendationRequest(BaseModel):
    query: str
    limit: int = 10

@app.post("/recommend")
def recommend_products(req: RecommendationRequest):
    try:
        return get_recommendations(req.query, req.limit)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

from geometry.ml_engine import predict_dynamic_score

class PredictScoreRequest(BaseModel):
    prix: float
    qualite_humaine: float
    popularite: int

@app.post("/predict-score")
def predict_score(req: PredictScoreRequest):
    try:
        score_ia = predict_dynamic_score(req.prix, req.qualite_humaine, req.popularite)
        return {"score_ia": score_ia}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/layout", response_model=LayoutResponse)
def layout(req: LayoutRequest) -> LayoutResponse:
    try:
        return generate_layout(req)
    except Exception as e:
        return JSONResponse(status_code=422, content={"error": str(e)})

