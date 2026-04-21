from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


ZoneName = Literal["day", "night", "service"]


class Envelope(BaseModel):
    width_m: float = Field(..., gt=0)
    height_m: float = Field(..., gt=0)


class Constraints(BaseModel):
    # Canonical constraints used by the geometry engine.
    living_south: bool = False
    bedrooms_grouped: bool = True
    bedrooms_private_zone: bool = True
    kitchen_connected_to_living: bool = True
    bathroom_near_bedrooms: bool = True
    wc_near_entrance: bool = True
    wc_not_visible: bool = True
    laundry_near_garage: bool = False


class RoomProgram(BaseModel):
    bedrooms: int = Field(3, ge=0, le=12)
    bathrooms: int = Field(1, ge=0, le=6)
    wc: int = Field(1, ge=0, le=6)
    kitchen: int = Field(1, ge=0, le=3)
    living: int = Field(1, ge=0, le=3)
    dining: int = Field(0, ge=0, le=3)
    office: int = Field(0, ge=0, le=2)
    garage: int = Field(0, ge=0, le=2)
    laundry: int = Field(0, ge=0, le=2)
    storage: int = Field(0, ge=0, le=3)
    entry: int = Field(1, ge=0, le=2)


class Intent(BaseModel):
    # We keep this minimal: the Node layer can pass the richer LLM intent in `raw`.
    building_type: Literal["house", "apartment", "unknown"] = "unknown"
    envelope: Envelope
    program: RoomProgram = RoomProgram()
    constraints: Constraints = Constraints()
    raw: Optional[dict[str, Any]] = None


class Segment(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class Door(BaseModel):
    from_room: str
    to_room: str
    width_m: float = 0.9
    segment: Segment


class Window(BaseModel):
    room: str
    width_m: float = 1.2
    segment: Segment


class RoomOut(BaseModel):
    id: str
    label: str
    zone: ZoneName
    x: float
    y: float
    w: float
    h: float
    connections: list[str] = []


class LayoutResponse(BaseModel):
    envelope: Envelope
    rooms: list[RoomOut]
    doors: list[Door] = []
    windows: list[Window] = []
    meta: dict[str, Any] = {}


class LayoutRequest(BaseModel):
    intent: Intent
    strict: bool = True
    max_iterations: int = Field(120, ge=1, le=2000)
