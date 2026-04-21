from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Tuple

from shapely.geometry import LineString, Polygon

from ..schemas import Door, Segment


@dataclass(frozen=True)
class RoomRect:
    id: str
    x: float
    y: float
    w: float
    h: float

    def poly(self) -> Polygon:
        return Polygon([(self.x, self.y), (self.x + self.w, self.y), (self.x + self.w, self.y + self.h), (self.x, self.y + self.h)])


def _shared_boundary(a: RoomRect, b: RoomRect) -> LineString | None:
    inter = a.poly().boundary.intersection(b.poly().boundary)
    if inter.is_empty:
        return None
    if isinstance(inter, LineString):
        return inter
    # MultiLineString / GeometryCollection: pick longest line
    best = None
    best_len = 0.0
    for g in getattr(inter, "geoms", []):
        if isinstance(g, LineString) and g.length > best_len:
            best = g
            best_len = g.length
    return best


def derive_doors(
    rooms: Iterable[RoomRect],
    *,
    forbidden_pairs: set[tuple[str, str]] | None = None,
    door_width_m: float = 0.9,
) -> List[Door]:
    """
    Derive a simple door graph from adjacency (shared boundary).
    For now we create doors between core connections only; later we can refine per-room needs.
    """
    rs = list(rooms)
    by_id: Dict[str, RoomRect] = {r.id: r for r in rs}
    forbidden_pairs = forbidden_pairs or set()

    def is_forbidden(a: str, b: str) -> bool:
        return (a, b) in forbidden_pairs or (b, a) in forbidden_pairs

    doors: List[Door] = []
    ids = [r.id for r in rs]
    for i in range(len(rs)):
        for j in range(i + 1, len(rs)):
            a = rs[i]
            b = rs[j]
            if is_forbidden(a.id, b.id):
                continue
            shared = _shared_boundary(a, b)
            if not shared or shared.length < 0.2:
                continue
            # Place a door segment around the midpoint of the shared boundary.
            mid = shared.interpolate(0.5, normalized=True)
            # Determine orientation by boundary direction.
            # Use a small segment aligned with the boundary's local tangent by sampling nearby points.
            p1 = shared.interpolate(max(0.0, shared.length * 0.45))
            p2 = shared.interpolate(min(shared.length, shared.length * 0.55))
            dx = p2.x - p1.x
            dy = p2.y - p1.y
            # Normalize vector
            mag = (dx * dx + dy * dy) ** 0.5 or 1.0
            ux = dx / mag
            uy = dy / mag
            half = door_width_m / 2
            seg = Segment(x1=mid.x - ux * half, y1=mid.y - uy * half, x2=mid.x + ux * half, y2=mid.y + uy * half)
            doors.append(Door(from_room=a.id, to_room=b.id, width_m=door_width_m, segment=seg))

    return doors

