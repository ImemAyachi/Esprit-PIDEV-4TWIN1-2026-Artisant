from __future__ import annotations

import base64
import os
from io import BytesIO

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="Floorplan Diffusion Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _pick_device() -> str:
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"


DEVICE = _pick_device()
STEPS_DEFAULT = 30 if DEVICE == "cuda" else 10
SIZE_DEFAULT = 512 if DEVICE == "cuda" else 256

# Optional env overrides
BASE_MODEL = os.getenv("DIFFUSION_BASE_MODEL", "runwayml/stable-diffusion-v1-5")
LORA_ID = os.getenv("DIFFUSION_LORA_ID", "maria26/Floor_Plan_LoRA")

pipeline = None


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    steps: int = Field(default=STEPS_DEFAULT, ge=1, le=80)
    width: int = Field(default=SIZE_DEFAULT, ge=128, le=1024)
    height: int = Field(default=SIZE_DEFAULT, ge=128, le=1024)
    guidance_scale: float = Field(default=7.5, ge=0.0, le=20.0)


@app.on_event("startup")
def _load_pipeline() -> None:
    global pipeline
    # Lazy import so the service can still start and give a readable error if deps are missing.
    try:
        import torch
        from diffusers import AutoPipelineForText2Image

        dtype = torch.float16 if DEVICE == "cuda" else torch.float32
        print(f"[diffusion] loading base={BASE_MODEL} device={DEVICE} dtype={dtype} ...")
        pipeline = AutoPipelineForText2Image.from_pretrained(BASE_MODEL, torch_dtype=dtype)
        pipeline = pipeline.to(DEVICE)
        print(f"[diffusion] loading LoRA={LORA_ID} ...")
        pipeline.load_lora_weights(LORA_ID)
        # Small speed win on cuda
        if DEVICE == "cuda":
            try:
                pipeline.enable_xformers_memory_efficient_attention()
            except Exception:
                pass
        print("[diffusion] pipeline ready")
    except Exception as e:
        pipeline = None
        print(f"[diffusion] failed to load pipeline: {e}")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": DEVICE,
        "base_model": BASE_MODEL,
        "lora_id": LORA_ID,
        "pipeline_ready": pipeline is not None,
    }


@app.post("/generate-image")
def generate(req: GenerateRequest):
    if pipeline is None:
        return {
            "error": "pipeline_not_ready",
            "detail": "Diffusion pipeline failed to load. Check server logs and dependencies.",
            "device": DEVICE,
        }

    image = pipeline(
        req.prompt,
        num_inference_steps=req.steps,
        guidance_scale=req.guidance_scale,
        width=req.width,
        height=req.height,
    ).images[0]

    buf = BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {"image": f"data:image/png;base64,{b64}", "device": DEVICE}

