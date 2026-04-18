from __future__ import annotations

from dataclasses import dataclass

from shapely.geometry import Polygon, box


@dataclass(frozen=True)
class Zones:
    day: Polygon
    night: Polygon
    service: Polygon


def compute_zones(
    *,
    width_m: float,
    height_m: float,
    living_south: bool,
    service_strip_w: float,
    north_band_h: float,
    day_band_h: float,
) -> Zones:
    """
    Compute macro zoning polygons inside the fixed envelope.

    Convention: origin (0,0) is top-left; y grows downward.
    - service: east strip
    - day: south band (always; if living_south=False, still put day south by default)
    - night: remaining middle (private) band between north band and day band
    """
    W = float(width_m)
    H = float(height_m)
    sW = float(service_strip_w)

    x_service = max(0.0, W - sW)
    service = box(x_service, 0.0, W, H)

    # Available area excluding service strip.
    avail = box(0.0, 0.0, x_service, H)

    # Day zone placed in the south (matches most prompts; also satisfies living_south).
    day_h = min(H, max(2.5, float(day_band_h)))
    day = box(0.0, max(0.0, H - day_h), x_service, H)

    # North band reserved for entry/hall + guest WC buffer.
    nH = min(H - day_h, max(1.75, float(north_band_h)))
    north = box(0.0, 0.0, x_service, nH)

    # Night zone is the remainder between north and day.
    night = box(0.0, nH, x_service, max(nH, H - day_h))

    # Ensure containment inside available.
    day = day.intersection(avail)
    night = night.intersection(avail)
    return Zones(day=day, night=night, service=service)

