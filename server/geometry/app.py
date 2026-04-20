from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .engine import generate_layout
from .schemas import LayoutRequest, LayoutResponse

app = FastAPI(title="BuildMarket Geometry Service", version="0.1.0")


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/layout", response_model=LayoutResponse)
def layout(req: LayoutRequest) -> LayoutResponse:
    try:
        return generate_layout(req)
    except Exception as e:
        return JSONResponse(status_code=422, content={"error": str(e)})

