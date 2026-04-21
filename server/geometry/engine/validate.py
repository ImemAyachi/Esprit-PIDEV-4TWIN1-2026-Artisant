from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Set

from shapely.geometry import box

from ..schemas import Constraints
from .doors import RoomRect


@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    errors: List[str]


def _overlaps(a: RoomRect, b: RoomRect) -> bool:
    pa = a.poly()
    pb = b.poly()
    inter = pa.intersection(pb)
    return inter.area > 1e-6


def validate_layout(
    *,
    width_m: float,
    height_m: float,
    rooms: Iterable[RoomRect],
    constraints: Constraints,
) -> ValidationResult:
    rs = list(rooms)
    errors: List[str] = []
    env = box(0.0, 0.0, float(width_m), float(height_m))

    # Inside envelope
    for r in rs:
        if not env.contains(r.poly()):
            errors.append(f"room_outside_envelope:{r.id}")

    # No overlaps
    for i in range(len(rs)):
        for j in range(i + 1, len(rs)):
            if _overlaps(rs[i], rs[j]):
                errors.append(f"overlap:{rs[i].id}:{rs[j].id}")

    # Required adjacency proxies (distance-based for now; doors will tighten these)
    by_id: Dict[str, RoomRect] = {r.id: r for r in rs}
    if constraints.kitchen_connected_to_living:
        if "kitchen" not in by_id or "living" not in by_id:
            errors.append("missing_kitchen_or_living")

    if constraints.wc_near_entrance:
        if "entry" not in by_id or "wc" not in by_id:
            errors.append("missing_entry_or_wc")
        else:
            # wc_not_visible proxy: not flush at y=0
            if constraints.wc_not_visible and by_id["wc"].y <= 0.01:
                errors.append("wc_visible_proxy")

    if constraints.laundry_near_garage:
        if "garage" not in by_id or ("laundry" not in by_id and "buanderie" not in by_id):
            errors.append("missing_garage_or_laundry")

    return ValidationResult(ok=len(errors) == 0, errors=errors)

