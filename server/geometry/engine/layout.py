from __future__ import annotations

from typing import List

from ..schemas import LayoutRequest, LayoutResponse, RoomOut
from .doors import RoomRect, derive_doors
from .pack import pack_day, pack_night, pack_service
from .validate import validate_layout
from .windows import place_windows
from .zoning import compute_zones


def generate_layout(req: LayoutRequest) -> LayoutResponse:
    """
    Deterministic house solver (no randomness):
    - Fixed zoning structure:
      - SOUTH: living + kitchen (DAY)
      - MIDDLE: entrance + WC + storage buffer (TRANSITION) (modeled as entry + optional closet)
      - NORTH: bedrooms + bathroom (NIGHT)
      - SERVICE: east strip (bath/garage/laundry)
    - Deterministic splits and placements only.
    """
    W = float(req.intent.envelope.width_m)
    H = float(req.intent.envelope.height_m)
    program = req.intent.program
    c = req.intent.constraints

    service_w = min(3.0, max(2.25, W * 0.22))
    transition_h = min(2.8, max(2.0, H * 0.25))
    day_h = min(4.8, max(3.0, H * 0.40))
    night_h = max(3.0, H - transition_h - day_h)
    # If envelope is tight, re-balance deterministically.
    if night_h < 3.0:
        night_h = 3.0
        day_h = max(3.0, H - transition_h - night_h)

    zones = compute_zones(
        width_m=W,
        height_m=H,
        living_south=True,  # fixed structure for houses
        service_strip_w=service_w,
        north_band_h=transition_h,
        day_band_h=day_h,
    )

    # Deterministic packing per zone
    packed = []
    packed.extend(pack_day(zones.day, living=program.living > 0, kitchen=program.kitchen > 0))
    packed.extend(pack_night(zones.night, bedroom_count=program.bedrooms))
    wc_in_service = (program.wc > 0) and not c.wc_near_entrance
    packed.extend(
        pack_service(
            zones.service,
            entry_h=transition_h,
            has_garage=program.garage > 0,
            has_bath=program.bathrooms > 0,
            wc_in_zone=wc_in_service,
            has_laundry=(program.laundry > 0 or c.laundry_near_garage) and program.garage > 0,
        )
    )

    entry_w = min(3.2, max(2.25, W * 0.22))
    rooms_rr: List[RoomRect] = [RoomRect(id="entry", x=0.0, y=0.0, w=entry_w, h=transition_h)]
    if program.wc > 0 and c.wc_near_entrance:
        wc_w = 1.5
        wc_h = 1.5
        # hidden WC: recess within the transition band
        wc_y = max(0.5, transition_h - wc_h) if c.wc_not_visible else 0.0
        rooms_rr.append(RoomRect(id="wc", x=entry_w, y=wc_y, w=wc_w, h=wc_h))

    for pr in packed:
        rooms_rr.append(RoomRect(id=pr.id, x=pr.x, y=pr.y, w=pr.w, h=pr.h))
    vr = validate_layout(width_m=W, height_m=H, rooms=rooms_rr, constraints=c)
    if req.strict and not vr.ok:
        # Fail hard so Node can regenerate or fall back explicitly.
        # The HTTP layer will translate this into a 500; Node catches and continues.
        raise RuntimeError("layout_invalid:" + "|".join(vr.errors[:8]))

    # Doors (derived from adjacency) with forbidden connections.
    forbidden = {("kitchen", "wc")}
    doors = derive_doors(rooms_rr, forbidden_pairs=forbidden)

    # Windows: all habitable rooms (living + bedrooms + kitchen)
    habitable = {r.id for r in rooms_rr if r.id in {"living", "kitchen"} or r.id.startswith("bed")}
    windows = place_windows(envelope_width_m=W, envelope_height_m=H, rooms=rooms_rr, habitable_ids=habitable, living_id="living")

    # Convert to response rooms (with connections from door list)
    conns: dict[str, set[str]] = {}
    for d in doors:
        conns.setdefault(d.from_room, set()).add(d.to_room)
        conns.setdefault(d.to_room, set()).add(d.from_room)

    rooms_out: List[RoomOut] = []
    for r in rooms_rr:
        # zone label heuristic by id
        if r.id in {"living", "kitchen"}:
            zone = "day"
        elif r.id.startswith("bed") or r.id in {"corridor"}:
            zone = "night"
        else:
            zone = "service"
        label = (
            "Entrée"
            if r.id == "entry"
            else "WC"
            if r.id == "wc"
            else "Séjour"
            if r.id == "living"
            else "Cuisine"
            if r.id == "kitchen"
            else "Salle de bain"
            if r.id == "bathroom"
            else "Garage"
            if r.id == "garage"
            else "Buanderie"
            if r.id in {"laundry", "buanderie"}
            else "Couloir"
            if r.id == "corridor"
            else f"Chambre {r.id[3:]}" if r.id.startswith("bed") else r.id
        )
        rooms_out.append(
            RoomOut(
                id=r.id,
                label=label,
                zone=zone,
                x=r.x,
                y=r.y,
                w=r.w,
                h=r.h,
                connections=sorted(list(conns.get(r.id, set()))),
            )
        )

    return LayoutResponse(
        envelope=req.intent.envelope,
        rooms=rooms_out,
        doors=doors,
        windows=windows,
        meta={
            "engine": "geometry_solver_house_v1",
            "valid": vr.ok,
            "errors": vr.errors,
        },
    )

