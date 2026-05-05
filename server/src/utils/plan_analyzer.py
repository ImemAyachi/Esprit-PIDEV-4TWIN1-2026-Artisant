import sys
import json
import cv2
import numpy as np
import math

# Fix encoding for Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def analyze_plan(image_path):
    """
    Analyze a hand-drawn or digital floor plan image using OpenCV.
    Returns structured JSON with rooms and walls for a 3D renderer.
    
    Strategy:
      1. Aggressive preprocessing to get clean binary walls
      2. Find rooms via connected-component flood-fill on the INVERSE (white areas = rooms)
      3. Fit bounding rectangles to each room region
      4. Snap edges to a grid to eliminate tiny gaps
      5. Detect wall segments via Hough lines for additional detail
    """
    img = cv2.imread(image_path)
    if img is None:
        return {"error": "Could not load image"}

    h, w = img.shape[:2]
    aspect = w / h

    # ─── Step 1: Aggressive preprocessing ─────────────────────────────────────
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Auto-detect if we need to invert (dark bg vs light bg)
    mean_val = np.mean(gray)
    if mean_val < 128:
        gray = cv2.bitwise_not(gray)

    # Bilateral filter: smooths noise but preserves edges (great for hand-drawn)
    smooth = cv2.bilateralFilter(gray, 9, 75, 75)

    # Combine Otsu + adaptive thresholding for robust binarization
    _, otsu = cv2.threshold(smooth, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    adaptive = cv2.adaptiveThreshold(
        smooth, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 15, 5
    )
    # Union of both methods — catches both thick and thin lines
    binary = cv2.bitwise_or(otsu, adaptive)

    # Heavy morphological closing to bridge gaps in hand-drawn lines
    close_size = max(5, int(min(w, h) * 0.035))
    kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (close_size, close_size))
    closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_close, iterations=4)

    # Dilate walls slightly to ensure they form closed boundaries
    dilate_size = max(3, int(min(w, h) * 0.015))
    kernel_dilate = cv2.getStructuringElement(cv2.MORPH_RECT, (dilate_size, dilate_size))
    walls_mask = cv2.dilate(closed, kernel_dilate, iterations=2)

    # ─── Step 2: Find rooms via connected components on INVERSE ───────────────
    # Invert: white = room interiors, black = walls
    room_mask = cv2.bitwise_not(walls_mask)

    # Connected component labeling
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        room_mask, connectivity=4
    )

    min_room_area = (w * h) * 0.008   # at least 0.8% of image
    max_room_area = (w * h) * 0.85    # skip background (whole image)

    raw_rooms = []
    for i in range(1, num_labels):  # skip label 0 (background)
        area = stats[i, cv2.CC_STAT_AREA]
        if min_room_area < area < max_room_area:
            rx = stats[i, cv2.CC_STAT_LEFT]
            ry = stats[i, cv2.CC_STAT_TOP]
            rw = stats[i, cv2.CC_STAT_WIDTH]
            rh = stats[i, cv2.CC_STAT_HEIGHT]

            # Filter by aspect ratio — rooms should be roughly rectangular
            room_aspect = max(rw, rh) / max(min(rw, rh), 1)
            if room_aspect > 8:
                continue  # too elongated — probably a corridor artifact

            # Filter by solidity: actual area vs bounding box area
            solidity = area / max(rw * rh, 1)
            if solidity < 0.3:
                continue  # too irregular — not a room

            raw_rooms.append({
                "x": rx, "y": ry, "w": rw, "h": rh,
                "area": area, "cx": centroids[i][0], "cy": centroids[i][1]
            })

    # Sort by area descending
    raw_rooms.sort(key=lambda r: r["area"], reverse=True)

    # ─── Step 3: Merge overlapping rooms ──────────────────────────────────────
    def overlap_ratio(a, b):
        x1 = max(a["x"], b["x"])
        y1 = max(a["y"], b["y"])
        x2 = min(a["x"] + a["w"], b["x"] + b["w"])
        y2 = min(a["y"] + a["h"], b["y"] + b["h"])
        if x2 <= x1 or y2 <= y1:
            return 0
        inter = (x2 - x1) * (y2 - y1)
        smaller = min(a["area"], b["area"])
        return inter / max(smaller, 1)

    merged = []
    used = set()
    for i, a in enumerate(raw_rooms):
        if i in used:
            continue
        best = a
        for j, b in enumerate(raw_rooms):
            if j <= i or j in used:
                continue
            if overlap_ratio(best, b) > 0.4:
                # Merge: take the union bounding box
                nx = min(best["x"], b["x"])
                ny = min(best["y"], b["y"])
                nx2 = max(best["x"] + best["w"], b["x"] + b["w"])
                ny2 = max(best["y"] + best["h"], b["y"] + b["h"])
                best = {
                    "x": nx, "y": ny, "w": nx2 - nx, "h": ny2 - ny,
                    "area": best["area"] + b["area"],
                    "cx": (nx + nx2) / 2, "cy": (ny + ny2) / 2
                }
                used.add(j)
        merged.append(best)
        used.add(i)

    # Limit to reasonable number
    merged = merged[:15]

    # ─── Step 4: Snap edges to grid to eliminate tiny gaps ────────────────────
    grid_snap = max(5, int(min(w, h) * 0.02))  # snap to ~2% grid

    def snap(val, grid):
        return round(val / grid) * grid

    for room in merged:
        room["x"] = snap(room["x"], grid_snap)
        room["y"] = snap(room["y"], grid_snap)
        room["w"] = max(grid_snap, snap(room["w"], grid_snap))
        room["h"] = max(grid_snap, snap(room["h"], grid_snap))

    # ─── Step 5: Detect wall lines via Hough Transform ────────────────────────
    edges = cv2.Canny(closed, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(
        edges, rho=1, theta=np.pi / 180, threshold=50,
        minLineLength=int(min(w, h) * 0.06),
        maxLineGap=int(min(w, h) * 0.04)
    )

    walls = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            length = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            angle = math.degrees(math.atan2(y2 - y1, x2 - x1))

            is_h = abs(angle) < 15 or abs(angle) > 165
            is_v = 75 < abs(angle) < 105

            if not (is_h or is_v):
                continue  # skip diagonal lines

            # Snap to grid to fix gaps and ensure perfectly straight lines
            if is_h:
                y_snap = snap((y1 + y2) / 2, grid_snap)
                y1 = y2 = y_snap
                x1 = snap(x1, grid_snap)
                x2 = snap(x2, grid_snap)
            if is_v:
                x_snap = snap((x1 + x2) / 2, grid_snap)
                x1 = x2 = x_snap
                y1 = snap(y1, grid_snap)
                y2 = snap(y2, grid_snap)

            # Recompute length after snapping
            length = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            if length < grid_snap:
                continue

            walls.append({
                "x1": round(x1 / w, 4), "y1": round(y1 / h, 4),
                "x2": round(x2 / w, 4), "y2": round(y2 / h, 4),
                "length_px": round(length, 1),
                "is_horizontal": is_h,
                "is_vertical": is_v
            })

    # ─── Step 6: Build output ─────────────────────────────────────────────────
    room_names = [
        "Salon", "Cuisine", "Chambre", "Chambre 2", "Salle de bain",
        "Couloir", "Bureau", "Salle à manger", "WC", "Terrasse",
        "Entrée", "Dressing", "Garage", "Buanderie", "Rangement"
    ]
    room_colors = [
        "#4a9e6e", "#d4843e", "#3b82f6", "#6366f1", "#06b6d4",
        "#8b5cf6", "#ec4899", "#14b8a6", "#a78bfa", "#84cc16",
        "#f59e0b", "#fb923c", "#64748b", "#10b981", "#78716c"
    ]

    # Estimate scale: assume the plan's longest axis represents ~12-15m
    max_dim = max(w, h)
    scale_factor = 14.0

    rooms_output = []
    for i, room in enumerate(merged):
        name_idx = i % len(room_names)
        color_idx = i % len(room_colors)

        real_w = round((room["w"] / max_dim) * scale_factor, 2)
        real_d = round((room["h"] / max_dim) * scale_factor, 2)

        rooms_output.append({
            "name": room_names[name_idx],
            "x": round(room["x"] / w, 4),
            "y": round(room["y"] / h, 4),
            "width": round(room["w"] / w, 4),
            "height": round(room["h"] / h, 4),
            "color": room_colors[color_idx],
            "real_width_m": max(1.2, real_w),
            "real_depth_m": max(1.2, real_d),
            "wall_height_m": 2.8
        })

    result = {
        "image_size": {"width": w, "height": h},
        "image_aspect": round(aspect, 4),
        "scale_meters": scale_factor,
        "rooms": rooms_output,
        "walls": walls[:60],
        "stats": {
            "total_rooms": len(rooms_output),
            "total_walls": len(walls),
        }
    }
    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]
    result = analyze_plan(image_path)
    print(json.dumps(result, ensure_ascii=False))
