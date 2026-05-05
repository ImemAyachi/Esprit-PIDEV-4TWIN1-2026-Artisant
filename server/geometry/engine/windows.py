from __future__ import annotations

from typing import Iterable, List

from shapely.geometry import LineString, Polygon, box

from ..schemas import Segment, Window
from .doors import RoomRect


def _exterior_wall_segment(envelope: Polygon, room: RoomRect) -> LineString | None:
    """
    Return a boundary segment where the room touches the envelope exterior.
    """
    inter = envelope.boundary.intersection(room.poly().boundary)
    if inter.is_empty:
        return None
    if isinstance(inter, LineString) and inter.length > 0:
        return inter
    best = None
    best_len = 0.0
    for g in getattr(inter, "geoms", []):
        if isinstance(g, LineString) and g.length > best_len:
            best = g
            best_len = g.length
    return best


def place_windows(
    *,
    envelope_width_m: float,
    envelope_height_m: float,
    rooms: Iterable[RoomRect],
    habitable_ids: set[str],
    living_id: str = "living",
) -> List[Window]:
    """
    Place one window per habitable room along the exterior boundary where it touches.
    Living gets the largest opening (widest segment), others standard.
    """
    env = box(0.0, 0.0, float(envelope_width_m), float(envelope_height_m))
    out: List[Window] = []
    for r in rooms:
        if r.id not in habitable_ids:
            continue
        seg_line = _exterior_wall_segment(env, r)
        if not seg_line or seg_line.length < 0.4:
            continue
        width = 2.0 if r.id == living_id else 1.2
        width = min(width, max(0.6, seg_line.length * 0.8))
        mid = seg_line.interpolate(0.5, normalized=True)
        # determine axis (horizontal vs vertical)
        # approximate by bbox of segment
        minx, miny, maxx, maxy = seg_line.bounds
        horizontal = (maxx - minx) >= (maxy - miny)
        if horizontal:
            x1 = mid.x - width / 2
            x2 = mid.x + width / 2
            y = (miny + maxy) / 2
            seg = Segment(x1=x1, y1=y, x2=x2, y2=y)
        else:
            y1 = mid.y - width / 2
            y2 = mid.y + width / 2
            x = (minx + maxx) / 2
            seg = Segment(x1=x, y1=y1, x2=x, y2=y2)
        out.append(Window(room=r.id, width_m=width, segment=seg))
    return out

