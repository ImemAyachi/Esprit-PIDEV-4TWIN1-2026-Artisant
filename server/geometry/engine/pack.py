from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List, Tuple

from shapely.geometry import Polygon, box


@dataclass(frozen=True)
class PackedRoom:
    id: str
    label: str
    zone: str  # "day"|"night"|"service"
    x: float
    y: float
    w: float
    h: float

    def poly(self) -> Polygon:
        return box(self.x, self.y, self.x + self.w, self.y + self.h)


def _row_pack(zone: Polygon, items: List[Tuple[str, str, float, float]], pad: float = 0.0) -> List[PackedRoom]:
    """
    Simple deterministic packer: place rectangles left-to-right then wrap to next row.
    items: (id, label, w, h)
    """
    minx, miny, maxx, maxy = zone.bounds
    zx = minx + pad
    zy = miny + pad
    zW = max(0.0, (maxx - minx) - pad * 2)
    zH = max(0.0, (maxy - miny) - pad * 2)

    out: List[PackedRoom] = []
    cur_x = zx
    cur_y = zy
    row_h = 0.0

    for rid, label, w, h in items:
        w = float(w)
        h = float(h)
        if w > zW + 1e-6 or h > zH + 1e-6:
            # Can't fit even alone; still place clipped to bounds (validator/repair handles).
            w = min(w, zW)
            h = min(h, zH)

        if cur_x + w > zx + zW + 1e-6:
            # wrap row
            cur_x = zx
            cur_y = cur_y + row_h
            row_h = 0.0

        if cur_y + h > zy + zH + 1e-6:
            # no more space; stop
            break

        out.append(PackedRoom(id=rid, label=label, zone="unknown", x=cur_x, y=cur_y, w=w, h=h))
        cur_x = cur_x + w
        row_h = max(row_h, h)

    # Filter to rooms whose rectangle center lies inside zone (keeps coherence).
    kept: List[PackedRoom] = []
    for r in out:
        c = box(r.x + r.w * 0.5, r.y + r.h * 0.5, r.x + r.w * 0.5, r.y + r.h * 0.5)
        if zone.contains(c) or zone.touches(c):
            kept.append(r)
    return kept


def pack_day(zone: Polygon, *, living: bool, kitchen: bool) -> List[PackedRoom]:
    minx, miny, maxx, maxy = zone.bounds
    zW = maxx - minx
    zH = maxy - miny
    rooms: List[PackedRoom] = []
    if living:
        rooms.append(PackedRoom(id="living", label="Séjour", zone="day", x=minx, y=miny, w=zW * 0.62, h=zH))
    if kitchen:
        # Keep kitchen fully in the DAY band and share a full boundary with living (open plan).
        rooms.append(PackedRoom(id="kitchen", label="Cuisine", zone="day", x=minx + zW * 0.62, y=miny, w=zW * 0.38, h=zH))
    return rooms


def pack_night(zone: Polygon, bedroom_count: int, min_bed_w: float = 3.0, min_bed_h: float = 3.0) -> List[PackedRoom]:
    # Deterministic NIGHT pack with circulation:
    # - A couloir strip at the bottom of the night band (so people can walk and access rooms).
    # - Bedrooms grouped in the upper part, bathroom near them (if modeled elsewhere).
    bedroom_count = max(1, min(4, int(bedroom_count)))
    minx, miny, maxx, maxy = zone.bounds
    zW = maxx - minx
    zH = maxy - miny
    couloir_h = min(1.25, max(0.75, zH * 0.28))
    top_h = max(min_bed_h, zH - couloir_h)

    out: List[PackedRoom] = []

    if bedroom_count == 1:
        out.append(PackedRoom(id="bed1", label="Chambre 1", zone="night", x=minx, y=miny, w=zW, h=top_h))
        out.append(PackedRoom(id="corridor", label="Couloir", zone="night", x=minx, y=miny + top_h, w=zW, h=zH - top_h))
        return out

    if bedroom_count == 2:
        w = zW / 2
        out.append(PackedRoom(id="bed1", label="Chambre 1", zone="night", x=minx, y=miny, w=w, h=top_h))
        out.append(PackedRoom(id="bed2", label="Chambre 2", zone="night", x=minx + w, y=miny, w=zW - w, h=top_h))
        out.append(PackedRoom(id="corridor", label="Couloir", zone="night", x=minx, y=miny + top_h, w=zW, h=zH - top_h))
        return out

    # 3 or 4
    w_each = zW / bedroom_count
    if w_each >= min_bed_w and top_h >= min_bed_h:
        for i in range(bedroom_count):
            out.append(PackedRoom(id=f"bed{i+1}", label=f"Chambre {i+1}", zone="night", x=minx + i * w_each, y=miny, w=w_each, h=top_h))
        out.append(PackedRoom(id="corridor", label="Couloir", zone="night", x=minx, y=miny + top_h, w=zW, h=zH - top_h))
        return out

    # Two-row fallback: 2 beds on top row, remaining on bottom spanning.
    upper_h = max(min_bed_h, top_h * 0.5)
    lower_h = max(min_bed_h, top_h - upper_h)
    half_w = zW / 2
    out = []
    out.append(PackedRoom(id="bed1", label="Chambre 1", zone="night", x=minx, y=miny, w=half_w, h=upper_h))
    out.append(PackedRoom(id="bed2", label="Chambre 2", zone="night", x=minx + half_w, y=miny, w=zW - half_w, h=upper_h))
    out.append(PackedRoom(id="bed3", label="Chambre 3", zone="night", x=minx, y=miny + upper_h, w=zW, h=lower_h))
    if bedroom_count == 4:
        # split lower row
        out[-1] = PackedRoom(id="bed3", label="Chambre 3", zone="night", x=minx, y=miny + upper_h, w=half_w, h=lower_h)
        out.append(PackedRoom(id="bed4", label="Chambre 4", zone="night", x=minx + half_w, y=miny + upper_h, w=zW - half_w, h=lower_h))
    out.append(PackedRoom(id="corridor", label="Couloir", zone="night", x=minx, y=miny + top_h, w=zW, h=zH - top_h))
    return out


def pack_service(
    zone: Polygon,
    *,
    entry_h: float,
    has_garage: bool,
    has_bath: bool,
    wc_in_zone: bool,
    has_laundry: bool,
    wc_max_h: float = 2.0,
) -> List[PackedRoom]:
    minx, miny, maxx, maxy = zone.bounds
    zW = maxx - minx
    y = 0.0
    out: List[PackedRoom] = []

    if has_garage:
        out.append(PackedRoom(id="garage", label="Garage", zone="service", x=minx, y=0.0, w=zW, h=entry_h))
        y = entry_h

    if has_bath:
        out.append(PackedRoom(id="bathroom", label="Salle de bain", zone="service", x=minx, y=y, w=zW, h=2.2))
        y += 2.2

    if wc_in_zone:
        out.append(PackedRoom(id="wc", label="WC", zone="service", x=minx, y=y, w=min(1.5, zW), h=min(wc_max_h, 1.5)))
        y += min(wc_max_h, 1.5)

    if has_laundry:
        out.append(PackedRoom(id="laundry", label="Buanderie", zone="service", x=minx, y=y, w=zW, h=max(1.5, (maxy - miny) - y)))

    return out

