const GENERAL_KEY = 'general';

export const ARTISAN_KNOWLEDGE_BASE = {
  ceramic: {
    match: [
      'ceramic',
      'clay',
      'pottery',
      'porcelain',
      'stoneware',
      'earthenware',
      'terracotta',
      'kiln',
      'glaze',
      'bisque',
      'throwing',
      'thrown',
      'handbuild',
      'hand-built',
      'mug',
      'mugs',
      'vase',
      'bowl',
      'bowls',
      'tile',
      'tiles',
      'raku',
    ],
    materials: ['Clay body', 'Water & slip', 'Glazes / stains', 'Kiln furniture (posts, shelves)', 'Wax or resist (optional)'],
    experts: ['Ceramic artisan', 'Kiln operator', 'Glaze technician'],
    steps: [
      'Clay prep & wedging',
      'Forming (wheel or hand-building)',
      'Drying to leather-hard',
      'Trimming, handles, surface work',
      'Bisque firing',
      'Glazing',
      'Glaze firing',
      'Cooling, QC, finishing & packing',
    ],
    setupDays: [2, 4],
    extraDaysPerUnit: [0.05, 0.14],
    setupCost: [150, 400],
    unitCost: [8, 28],
  },
  wood: {
    match: [
      'wood',
      'wooden',
      'timber',
      'lumber',
      'carpentry',
      'joinery',
      'oak',
      'pine',
      'walnut',
      'maple',
      'carve',
      'carving',
      'furniture',
      'shelf',
      'shelves',
      'table',
      'chair',
      'cabinet',
      'router',
      'planer',
      'sanding',
    ],
    materials: ['Dimensioned lumber / boards', 'Hardware (screws, hinges)', 'Wood glue', 'Sandpaper / abrasives', 'Finish (oil, varnish, wax)'],
    experts: ['Cabinet maker / joiner', 'CNC or pattern specialist (if needed)', 'Finishing specialist'],
    steps: ['Design & cut list', 'Milling & dimensioning', 'Joinery & assembly', 'Sanding sequence', 'Finish application', 'Hardware & QC', 'Packing'],
    setupDays: [1.5, 3.5],
    extraDaysPerUnit: [0.04, 0.11],
    setupCost: [100, 320],
    unitCost: [15, 55],
  },
  textile: {
    match: [
      'textile',
      'fabric',
      'weave',
      'weaving',
      'knit',
      'knitting',
      'sew',
      'sewing',
      'cotton',
      'linen',
      'wool',
      'silk',
      'thread',
      'yarn',
      'embroidery',
      'tapestry',
      'scarf',
      'dress',
      'shirt',
      'apparel',
    ],
    materials: ['Fabric / yarn', 'Thread', 'Needles, pins, markers', 'Interfacing / lining (if needed)', 'Labels & care tags'],
    experts: ['Pattern maker / cutter', 'Seamstress / tailor', 'Dye or print technician (if needed)'],
    steps: ['Pattern & sizing', 'Cutting & marking', 'Assembly / seams', 'Fittings & adjustments', 'Pressing & finishing', 'QC & labeling'],
    setupDays: [1, 2.5],
    extraDaysPerUnit: [0.03, 0.09],
    setupCost: [80, 220],
    unitCost: [12, 40],
  },
  leather: {
    match: [
      'leather',
      'hide',
      'tanning',
      'saddle',
      'stitch',
      'stitching',
      'wallet',
      'belt',
      'bag',
      'tote',
      'sheath',
      'holster',
      'cordovan',
    ],
    materials: ['Vegetable- or chrome-tanned leather', 'Thread & needles', 'Edge treatments & dyes', 'Hardware (rivets, buckles)', 'Conditioner / balm'],
    experts: ['Leatherworker', 'Die-cutting specialist (if tooling)', 'Edge finisher'],
    steps: ['Pattern & leather selection', 'Cutting & skiving', 'Punching & assembly', 'Saddle stitching or machine sew', 'Edge burnishing', 'Hardware & QC'],
    setupDays: [1, 2.5],
    extraDaysPerUnit: [0.035, 0.1],
    setupCost: [90, 250],
    unitCost: [18, 65],
  },
  metal: {
    match: [
      'metal',
      'steel',
      'iron',
      'brass',
      'copper',
      'aluminum',
      'aluminium',
      'forge',
      'forging',
      'weld',
      'welding',
      'blacksmith',
      'anvil',
      'sheet metal',
      'machining',
      'lathe',
    ],
    materials: ['Stock metal (bar, sheet, wire)', 'Consumables (rods, gas, flux)', 'Abrasives & patina', 'Fasteners', 'PPE & ventilation setup'],
    experts: ['Metal fabricator / welder', 'Machinist (if precision parts)', 'Heat-treat technician (if needed)'],
    steps: ['Layout & cutting', 'Forming / bending / forging', 'Joining (weld / rivet / braze)', 'Grinding & cleanup', 'Finish / coat / patina', 'QC & dimensional check'],
    setupDays: [1.5, 4],
    extraDaysPerUnit: [0.045, 0.12],
    setupCost: [180, 500],
    unitCost: [22, 85],
  },
  jewelry: {
    match: [
      'jewelry',
      'jewellery',
      'ring',
      'rings',
      'necklace',
      'bracelet',
      'earring',
      'earrings',
      'pendant',
      'gem',
      'gemstone',
      'setting',
      'silver',
      'gold',
      'solder',
      'lost wax',
      'casting',
    ],
    materials: ['Metal stock / findings', 'Stones & settings', 'Solder / flux', 'Polishing compounds', 'Ultrasonic / pickle supplies'],
    experts: ['Bench jeweler', 'Stone setter', 'Caster (if lost-wax)'],
    steps: ['Design & sourcing', 'Fabrication or casting cleanup', 'Soldering / assembly', 'Stone setting', 'Polishing & rhodium (if used)', 'QC & hallmarking (if applicable)'],
    setupDays: [1, 3],
    extraDaysPerUnit: [0.06, 0.18],
    setupCost: [120, 380],
    unitCost: [25, 120],
  },
  [GENERAL_KEY]: {
    match: [],
    materials: ['Core raw materials', 'Consumables & tooling wear', 'Packaging & labels'],
    experts: ['Lead artisan', 'Production assistant', 'QC reviewer'],
    steps: ['Brief & feasibility', 'Material sourcing', 'Prototype / first article', 'Batch production', 'Finishing', 'QC & delivery prep'],
    setupDays: [1.5, 3],
    extraDaysPerUnit: [0.05, 0.12],
    setupCost: [100, 280],
    unitCost: [15, 45],
  },
};

function clampQuantity(n) {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), 100_000);
}

export function extractQuantityFromDescription(text) {
  const t = text.toLowerCase();

  const labeled = t.match(/\b(?:qty|quantity)\s*[-:]?\s*(\d{1,6})\b/i);
  if (labeled) return clampQuantity(parseInt(labeled[1], 10));

  const batchOf = t.match(/\b(?:batch|run|order)\s+of\s+(\d{1,6})\b/i);
  if (batchOf) return clampQuantity(parseInt(batchOf[1], 10));

  const produceMake = t.match(/\b(?:produce|make)\s+(\d{1,6})\b/i);
  if (produceMake) return clampQuantity(parseInt(produceMake[1], 10));

  const withUnit = t.match(
    /\b(\d{1,6})\s*(?:x\s*)?(?:units?|pcs?|pieces?|items?|mugs?|bowls?|bags?|wallets?|rings?|necklaces?|chairs?|tables?|scarves?|shirts?|bracelets?|earrings?|pendants?|vases?|tiles?|belts?|totes?)\b/i
  );
  if (withUnit) return clampQuantity(parseInt(withUnit[1], 10));

  const handmade = t.match(/\b(\d{1,6})\s+(?:handmade|custom)\b/i);
  if (handmade) return clampQuantity(parseInt(handmade[1], 10));

  return 1;
}

function tokenize(normalized) {
  return normalized.split(/[^a-z0-9]+/).filter(Boolean);
}

export function detectCategories(normalized) {
  const tokens = new Set(tokenize(normalized));
  const haystack = normalized;
  /** @type {string[]} */
  const found = [];

  for (const key of Object.keys(ARTISAN_KNOWLEDGE_BASE)) {
    if (key === GENERAL_KEY) continue;
    const { match } = ARTISAN_KNOWLEDGE_BASE[key];
    const hit = match.some((kw) => {
      if (kw.length <= 3) return tokens.has(kw);
      return haystack.includes(kw);
    });
    if (hit) found.push(key);
  }

  return found;
}

function uniqueOrdered(items) {
  const seen = new Set();
  const out = [];
  for (const x of items) {
    const k = x.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatCategoryLabel(keys) {
  if (!keys.length) return 'general artisan project';
  if (keys.length === 1) return `${keys[0]} production`;
  return `multi-discipline (${keys.map(capitalize).join(' + ')})`;
}

function synergyFactor(categoryCount) {
  if (categoryCount <= 1) return 1;
  return 0.78 + 0.06 / categoryCount;
}

function formatDurationRange(daysMin, daysMax) {
  const a = Math.max(0.25, daysMin);
  const b = Math.max(a, daysMax);

  if (b <= 1.25) return 'About 1 day';
  if (b <= 6.5) return `${Math.ceil(a)}–${Math.ceil(b)} days`;
  if (b <= 21) return `${Math.max(1, Math.round(a / 7))}–${Math.round(b / 7)} weeks`;
  return `${Math.max(1, Math.round(a / 30))}–${Math.round(b / 30)} months`;
}

function formatCostRange(min, max, qty) {
  const lo = Math.round(min);
  const hi = Math.round(max);
  if (lo === hi) return `${lo} DT (indicative, qty ${qty})`;
  return `${lo}–${hi} DT (indicative, qty ${qty})`;
}

export function generateProjectPlan(userInput) {
  const empty = {
    category: 'general artisan project',
    materials: [...ARTISAN_KNOWLEDGE_BASE[GENERAL_KEY].materials],
    experts: [...ARTISAN_KNOWLEDGE_BASE[GENERAL_KEY].experts],
    estimatedTime: formatDurationRange(1.5, 3),
    estimatedCost: formatCostRange(100, 280, 1),
    steps: [...ARTISAN_KNOWLEDGE_BASE[GENERAL_KEY].steps],
  };

  if (typeof userInput !== 'string') return empty;

  const raw = userInput.trim();
  if (!raw) return empty;

  const normalized = raw.toLowerCase();
  const qty = extractQuantityFromDescription(raw);
  let keys = detectCategories(normalized);
  const usingGeneral = keys.length === 0;
  if (usingGeneral) keys = [GENERAL_KEY];

  const syn = synergyFactor(keys.filter((k) => k !== GENERAL_KEY).length || (usingGeneral ? 1 : keys.length));

  let materials = [];
  let experts = [];
  let steps = [];
  let setupMin = 0;
  let setupMax = 0;
  let extraMin = 0;
  let extraMax = 0;
  let costSetupMin = 0;
  let costSetupMax = 0;
  let costUnitMin = 0;
  let costUnitMax = 0;

  keys.forEach((k) => {
    const p = ARTISAN_KNOWLEDGE_BASE[k];
    materials.push(...p.materials);
    experts.push(...p.experts);
    steps.push(...p.steps);
    setupMin += p.setupDays[0];
    setupMax += p.setupDays[1];
    extraMin += p.extraDaysPerUnit[0];
    extraMax += p.extraDaysPerUnit[1];
    costSetupMin += p.setupCost[0];
    costSetupMax += p.setupCost[1];
    costUnitMin += p.unitCost[0];
    costUnitMax += p.unitCost[1];
  });

  const n = keys.length;
  if (n > 1) {
    steps.push('Cross-discipline integration & final assembly');
  }

  materials = uniqueOrdered(materials);
  experts = uniqueOrdered(experts);
  steps = uniqueOrdered(steps);

  const batch = Math.max(0, qty - 1);
  const avgExtraMin = extraMin / n;
  const avgExtraMax = extraMax / n;
  const batchEfficiency = qty >= 24 ? 0.82 : qty >= 8 ? 0.9 : 1;

  const daysMin = setupMin * syn + batch * avgExtraMin * batchEfficiency;
  const daysMax = setupMax * syn + batch * avgExtraMax * batchEfficiency;

  const costMin = costSetupMin * syn + batch * (costUnitMin / n) * batchEfficiency;
  const costMax = costSetupMax * syn + batch * (costUnitMax / n) * batchEfficiency;

  const categoryLabel = usingGeneral ? 'general artisan project' : formatCategoryLabel(keys.filter((k) => k !== GENERAL_KEY));

  return {
    category: categoryLabel,
    materials,
    experts,
    estimatedTime: formatDurationRange(daysMin, daysMax),
    estimatedCost: formatCostRange(costMin, costMax, qty),
    steps,
  };
}
