const GENERAL_KEY = 'general';

const KB = {
  ceramic: {
    match: [
      'ceramic',
      'céramique',
      'ceramique',
      'argile',
      'poterie',
      'porcelaine',
      'grès',
      'terre cuite',
      'terracotta',
      'émail',
      'email',
      'four',
      'kiln',
      'mug',
      'tasse',
      'vase',
      'bol',
      'carrelage',
      'tuile',
      'raku',
    ],
    materials: ['Argile (pain)', 'Eau + barbotine', 'Émaux / pigments', 'Supports de cuisson (grilles, plaques)', 'Emballage (cartons, calage)'],
    experts: ['Céramiste', 'Opérateur four', 'Contrôle qualité / emballage'],
    steps: ['Préparation de la terre', 'Façonnage (tour / modelage)', 'Séchage', 'Finitions / retouches', 'Cuisson biscuit', 'Émaillage', 'Cuisson émail', 'Refroidissement + contrôle + emballage'],
    setupDays: [2, 4],
    extraDaysPerUnit: [0.05, 0.14],
    setupCost: [150, 400],
    unitCost: [8, 28],
  },
  wood: {
    match: [
      'wood',
      'bois',
      'menuiserie',
      'ébénisterie',
      'ebenisterie',
      'charpente',
      'carpentry',
      'joinery',
      'chêne',
      'chene',
      'pin',
      'noyer',
      'furniture',
      'meuble',
      'table',
      'chaise',
      'armoire',
      'placard',
      'ponçage',
      'poncage',
      'vernis',
    ],
    materials: ['Bois (essence adaptée)', 'Quincaillerie (vis, charnières)', 'Colle à bois', 'Abrasifs (papier)', 'Finition (huile/vernis)'],
    experts: ['Menuisier / ébéniste', 'Monteur', 'Finition / vernissage'],
    steps: ['Conception + débit', 'Mise à dimension', 'Assemblage', 'Ponçage', 'Finition', 'Montage quincaillerie', 'Contrôle + emballage'],
    setupDays: [1.5, 3.5],
    extraDaysPerUnit: [0.04, 0.11],
    setupCost: [100, 320],
    unitCost: [15, 55],
  },
  textile: {
    match: [
      'textile',
      'tissu',
      'fabric',
      'couture',
      'coudre',
      'weave',
      'tissage',
      'knit',
      'tricot',
      'cotton',
      'coton',
      'linen',
      'lin',
      'wool',
      'laine',
      'silk',
      'soie',
      'embroidery',
      'broderie',
      'scarf',
      'écharpe',
      'echarpe',
      'dress',
      'robe',
      'shirt',
      'chemise',
      'apparel',
      'vêtement',
      'vetement',
    ],
    materials: ['Tissu (métrage)', 'Fil', 'Aiguilles / épingles', 'Doublure / entoilage (si nécessaire)', 'Étiquettes / packaging'],
    experts: ['Patronnage / coupe', 'Couturier(ère)', 'Contrôle qualité'],
    steps: ['Patronage + gradation', 'Coupe', 'Assemblage', 'Essayage/ajustements', 'Repassage', 'Contrôle + étiquetage'],
    setupDays: [1, 2.5],
    extraDaysPerUnit: [0.03, 0.09],
    setupCost: [80, 220],
    unitCost: [12, 40],
  },
  leather: {
    match: [
      'leather',
      'cuir',
      'peau',
      'hide',
      'maroquinerie',
      'portefeuille',
      'wallet',
      'ceinture',
      'belt',
      'sac',
      'sacs',
      'bag',
      'tote',
      'pochette',
      'pochettes',
      'couture sellier',
      'sellier',
      'stitch',
      'stitching',
      'saddle',
      'cordovan',
    ],
    materials: ['Cuir (selon épaisseur)', 'Fil + aiguilles', 'Teinture / cire de finition', 'Boucles / rivets', 'Packaging'],
    experts: ['Maroquinier', 'Coupe / parage', 'Finition / contrôle'],
    steps: ['Patron + sélection cuir', 'Découpe + parage', 'Perçage / préparation', 'Assemblage + couture', 'Teinture / brunissage', 'Montage accessoires', 'Contrôle + emballage'],
    setupDays: [1, 2.5],
    extraDaysPerUnit: [0.035, 0.1],
    setupCost: [90, 250],
    unitCost: [18, 65],
  },
  metal: {
    match: [
      'metal',
      'métal',
      'metal',
      'acier',
      'steel',
      'fer',
      'iron',
      'laiton',
      'brass',
      'cuivre',
      'copper',
      'aluminium',
      'aluminum',
      'forge',
      'forgeron',
      'soudure',
      'souder',
      'weld',
      'welding',
      'tôle',
      'tole',
      'sheet',
      'usinage',
      'machining',
      'tour',
      'lathe',
    ],
    materials: ['Métal (barre/tôle)', 'Consommables (disques, baguettes)', 'Traitement / peinture', 'Fixations', 'PPE'],
    experts: ['Métallier / soudeur', 'Ajusteur', 'Contrôle qualité'],
    steps: ['Traçage + découpe', 'Mise en forme', 'Assemblage (soudure/rivet)', 'Ébavurage', 'Finition / protection', 'Contrôle + emballage'],
    setupDays: [1.5, 4],
    extraDaysPerUnit: [0.045, 0.12],
    setupCost: [180, 500],
    unitCost: [22, 85],
  },
  jewelry: {
    match: [
      'jewelry',
      'jewellery',
      'bijou',
      'bijoux',
      'bijouterie',
      'ring',
      'bague',
      'necklace',
      'collier',
      'bracelet',
      'earring',
      'boucle',
      'boucles',
      'pendant',
      'pendentif',
      'gem',
      'pierre',
      'pierres',
      'silver',
      'argent',
      'gold',
      'or',
      'solder',
      'soudure',
      'casting',
      'fonderie',
    ],
    materials: ['Métal précieux (selon titre)', 'Pierres (si applicable)', 'Soudure / flux', 'Abrasifs / polish', 'Boîtes / pochons'],
    experts: ['Bijoutier', 'Sertisseur (si pierres)', 'Polissage / finition'],
    steps: ['Design + gabarit', 'Fabrication / fonte', 'Assemblage', 'Sertissage (si besoin)', 'Polissage', 'Contrôle + emballage'],
    setupDays: [1, 3],
    extraDaysPerUnit: [0.06, 0.18],
    setupCost: [120, 380],
    unitCost: [25, 120],
  },
  [GENERAL_KEY]: {
    match: [],
    materials: ['Matières premières principales', 'Consommables', 'Packaging / étiquetage'],
    experts: ['Artisan responsable', 'Assistant production', 'Contrôle qualité'],
    steps: ['Cadrage du besoin', 'Approvisionnement', 'Prototype', 'Production en lot', 'Finitions', 'Contrôle + livraison'],
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

export function extractQuantity(text) {
  const t = String(text || '');
  const lower = t.toLowerCase();

  const labeled = lower.match(/\b(?:qty|quantity)\s*[-:]?\s*(\d{1,6})\b/i);
  if (labeled) return clampQuantity(parseInt(labeled[1], 10));

  const produceMake = lower.match(/\b(?:produire|fabriquer|make|produce)\s+(\d{1,6})\b/i);
  if (produceMake) return clampQuantity(parseInt(produceMake[1], 10));

  const withUnit = lower.match(/\b(\d{1,6})\s*(?:x\s*)?(?:unit(?:s)?|pcs?|pi[eè]ces?|items?|sacs?|bags?|wallets?|ceintures?|belts?|tables?|chairs?)\b/i);
  if (withUnit) return clampQuantity(parseInt(withUnit[1], 10));

  return 1;
}

function detectCategory(input) {
  const normalized = String(input || '').toLowerCase();
  for (const key of Object.keys(KB)) {
    if (key === GENERAL_KEY) continue;
    const hit = KB[key].match.some((kw) => normalized.includes(kw));
    if (hit) return key;
  }
  return GENERAL_KEY;
}

function formatRange(min, max, unit) {
  const a = Math.round(min);
  const b = Math.round(Math.max(min, max));
  return a === b ? `${a} ${unit}` : `${a} à ${b} ${unit}`;
}

export function generateLocalPlan(input) {
  const qty = extractQuantity(input);
  const key = detectCategory(input);
  const p = KB[key] || KB[GENERAL_KEY];

  const batch = Math.max(0, qty - 1);
  const setupMin = p.setupDays[0];
  const setupMax = p.setupDays[1];
  const extraMin = p.extraDaysPerUnit[0];
  const extraMax = p.extraDaysPerUnit[1];

  const daysMin = setupMin + batch * extraMin;
  const daysMax = setupMax + batch * extraMax;

  const costMin = p.setupCost[0] + batch * p.unitCost[0];
  const costMax = p.setupCost[1] + batch * p.unitCost[1];

  const categoryLabel =
    key === GENERAL_KEY
      ? 'Projet artisanal (général)'
      : key === 'ceramic'
        ? 'Production céramique'
        : key === 'wood'
          ? 'Production bois'
          : key === 'textile'
            ? 'Production textile'
            : key === 'leather'
              ? 'Production cuir (maroquinerie)'
              : key === 'metal'
                ? 'Production métal'
                : key === 'jewelry'
                  ? 'Production bijouterie'
                  : `Production ${key}`;

  return {
    category: categoryLabel,
    materials: p.materials,
    experts: p.experts,
    estimatedTime: formatRange(daysMin, daysMax, 'jours ouvrés'),
    estimatedCost: `${formatRange(costMin, costMax, 'DT')} (indicatif, quantité ${qty})`,
    steps: p.steps,
    reasoning:
      `Estimation basée sur une mise en route (gabarits, approvisionnement) puis une production en lot. ` +
      `La quantité détectée est ${qty}. Les délais et coûts varient selon la complexité, la finition et la disponibilité matière.`,
    insights: [
      'Prévoir un prototype/validation avant lancement du lot complet.',
      'Optimiser par lots (découpe, assemblage, finition) pour réduire les temps morts.',
      'Anticiper l’emballage dès le début (fournitures, dimensions, étiquetage).',
    ],
    risks: [
      'Rupture ou variabilité matière (qualité, couleur, épaisseur).',
      'Allongement des délais en cas de retouches/contrôle qualité renforcé.',
      'Sous-estimation si personnalisation importante ou finitions haut de gamme.',
    ],
    optimizations: [
      'Standardiser des gabarits et checklists qualité.',
      'Planifier les postes en parallèle (préparation, production, finition).',
      'Sécuriser 2 fournisseurs pour les matières critiques.',
    ],
  };
}

