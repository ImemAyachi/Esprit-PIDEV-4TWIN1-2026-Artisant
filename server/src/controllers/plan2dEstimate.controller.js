import { asyncHandler, AppError } from '../middleware/error.middleware.js';

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : NaN;
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function round2(x) {
  return Math.round(Number(x) * 100) / 100;
}

function safeName(name, idx) {
  const s = String(name || '').trim();
  return s || `Pièce ${idx + 1}`;
}

function roomType(name) {
  const s = String(name || '').toLowerCase();
  if (s.includes('séjour') || s.includes('sejour') || s.includes('salon') || s.includes('living')) return 'living';
  if (s.includes('cuisine') || s.includes('kitchen')) return 'kitchen';
  if (s.includes('salle à manger') || s.includes('salle a manger') || s.includes('dining')) return 'dining';
  if (s.includes('chambre') || s.includes('bed')) return 'bedroom';
  if (s.includes('suite')) return 'bedroom';
  if (s.includes('salle de bain') || s.includes('bain') || s.includes('bath')) return 'bathroom';
  if (/\bwc\b/.test(s) || s.includes('toilet')) return 'wc';
  if (s.includes('entrée') || s.includes('entree') || s.includes('hall') || s.includes('dégagement') || s.includes('degagement')) return 'circulation';
  if (s.includes('buanderie') || s.includes('laundry')) return 'laundry';
  if (s.includes('cellier') || s.includes('rangement') || s.includes('storage') || s.includes('pantry') || s.includes('placard'))
    return 'storage';
  if (s.includes('bureau') || s.includes('office')) return 'office';
  if (s.includes('garage')) return 'garage';
  return 'other';
}

function defaultPricesTnd() {
  return {
    currency: 'TND',
    floor_m2: { low: 45, mid: 70, high: 110 }, // carrelage/parquet (pose incluse ~ ordre de grandeur)
    paint_m2: { low: 10, mid: 16, high: 26 }, // peinture murs
    skirting_ml: { low: 6, mid: 9, high: 14 }, // plinthes
    partitions_ml: { low: 75, mid: 105, high: 150 }, // cloisons intérieures (BA13/maçonnerie légère)
    doors_unit: { low: 220, mid: 320, high: 520 }, // bloc-porte intérieur
  };
}

function mergePrices(base, custom) {
  if (!custom || typeof custom !== 'object') return base;
  const out = { ...base };
  for (const k of Object.keys(base)) {
    if (k === 'currency') continue;
    const v = custom[k];
    if (!v || typeof v !== 'object') continue;
    out[k] = {
      low: Number.isFinite(Number(v.low)) ? Number(v.low) : base[k].low,
      mid: Number.isFinite(Number(v.mid)) ? Number(v.mid) : base[k].mid,
      high: Number.isFinite(Number(v.high)) ? Number(v.high) : base[k].high,
    };
  }
  return out;
}

function priceRange(qty, unit) {
  const q = Number(qty) || 0;
  return {
    low: round2(q * unit.low),
    mid: round2(q * unit.mid),
    high: round2(q * unit.high),
  };
}

function addRanges(a, b) {
  return {
    low: round2((a?.low || 0) + (b?.low || 0)),
    mid: round2((a?.mid || 0) + (b?.mid || 0)),
    high: round2((a?.high || 0) + (b?.high || 0)),
  };
}

export const estimatePlan2dTnd = asyncHandler(async (req, res) => {
  const plan = req.body?.plan && typeof req.body.plan === 'object' ? req.body.plan : null;
  if (!plan) throw new AppError('plan manquant.', 400);

  const W = n(plan.width_m);
  const H = n(plan.height_m);
  if (!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) throw new AppError('Enveloppe invalide (width_m/height_m).', 400);

  const rooms = Array.isArray(plan.rooms) ? plan.rooms : [];
  if (rooms.length === 0) throw new AppError('Aucune pièce dans le plan.', 400);

  const wallHeightM = clamp(n(req.body?.wallHeightM ?? req.body?.wall_height_m ?? 2.8) || 2.8, 2.2, 3.4);
  const wastePct = clamp(n(req.body?.wastePct ?? 7) || 7, 0, 18);
  const includeDoors = Boolean(req.body?.includeDoors ?? true);
  const doorCountFromPlan = Array.isArray(plan.doorsSegments) ? plan.doorsSegments.length : 0;
  const doorsCount = includeDoors ? clamp(n(req.body?.doorsCount ?? doorCountFromPlan) || doorCountFromPlan, 0, 40) : 0;

  const prices = mergePrices(defaultPricesTnd(), req.body?.prices);

  let totalFloor = 0;
  let totalPerimeter = 0;
  let totalPaint = 0;
  let totalSkirting = 0;

  const perRoom = rooms
    .map((r, idx) => {
      const w = n(r.w);
      const h = n(r.h);
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
      const area = w * h;
      const peri = 2 * (w + h);
      const paint = peri * wallHeightM;
      const name = safeName(r.name, idx);
      const type = roomType(name);
      totalFloor += area;
      totalPerimeter += peri;
      totalPaint += paint;
      totalSkirting += peri;
      return {
        name,
        type,
        w_m: round2(w),
        h_m: round2(h),
        area_m2: round2(area),
        perimeter_m: round2(peri),
        paint_m2: round2(paint),
      };
    })
    .filter(Boolean);

  totalFloor = round2(totalFloor);
  totalPaint = round2(totalPaint);
  totalSkirting = round2(totalSkirting);

  const wasteFactor = 1 + wastePct / 100;
  const floorWithWaste = round2(totalFloor * wasteFactor);
  const paintWithWaste = round2(totalPaint * wasteFactor);

  const exteriorPerimeter = round2(2 * (W + H));
  const partitionsApprox = round2(Math.max(0, (totalPerimeter - exteriorPerimeter) / 2));

  const costFloor = priceRange(floorWithWaste, prices.floor_m2);
  const costPaint = priceRange(paintWithWaste, prices.paint_m2);
  const costSkirting = priceRange(totalSkirting, prices.skirting_ml);
  const costPartitions = priceRange(partitionsApprox, prices.partitions_ml);
  const costDoors = doorsCount > 0 ? priceRange(doorsCount, prices.doors_unit) : { low: 0, mid: 0, high: 0 };

  let total = { low: 0, mid: 0, high: 0 };
  for (const part of [costFloor, costPaint, costSkirting, costPartitions, costDoors]) {
    total = addRanges(total, part);
  }

  const assumptions = [
    `Hauteur murs: ${wallHeightM} m`,
    `Perte matière: ${wastePct}%`,
    `Cloisons estimées ≈ (Σ périmètres pièces − périmètre extérieur)/2`,
    'Estimation indicative (ordre de grandeur) — prix variables selon région, qualité, main d’œuvre',
  ];
  if (includeDoors) assumptions.push(`Portes intérieures: ${doorsCount} (depuis plan/override)`);

  return res.status(200).json({
    success: true,
    data: {
      currency: prices.currency,
      quantities: {
        envelope_m: { width_m: round2(W), height_m: round2(H) },
        floor_m2: floorWithWaste,
        paint_m2: paintWithWaste,
        skirting_ml: totalSkirting,
        partitions_ml: partitionsApprox,
        doors_unit: doorsCount,
      },
      unit_prices_tnd: prices,
      breakdown_tnd: {
        floor: costFloor,
        paint: costPaint,
        skirting: costSkirting,
        partitions: costPartitions,
        doors: costDoors,
      },
      total_tnd: total,
      per_room: perRoom.slice(0, 50),
      assumptions,
    },
  });
});

