const HOUSING_PATTERNS = [
  { re: /\b\d{1,2}[.,]?\d*\s*[x×]\s*\d{1,2}[.,]?\d*\s*(?:m|mètres|metres)?\b/i, w: 3 },
  { re: /\b\d{1,3}[.,]?\d*\s*(?:m2|m²|sqm|m\s*\^\s*2)\b/i, w: 3 },
  { re: /\b(?:t|type)\s*[0-5]\b|\bt[1-5]\b/i, w: 2 },
  { re: /\b(?:studio|loft|duplex|triplex|penthouse)\b/i, w: 2 },
  { re: /\b(?:appartement|apartment|flat|logement|foyer|maison|house|villa|résidence)\b/i, w: 2 },
  { re: /\b(?:chambre|chambres|bedroom|bedrooms|dorm|suite\s+parentale)\b/i, w: 1 },
  { re: /\b(?:cuisine|kitchen)\b/i, w: 1 },
  { re: /\b(?:s[ée]jour|sejour|salon|living\s+room|\bliving\b)\b/i, w: 1 },
  { re: /\b(?:salle\s+de\s+bain|sdb|bathroom|bathrooms?)\b/i, w: 1 },
  { re: /\b(?:wc|toilettes?|toilet)\b/i, w: 1 },
  { re: /\b(?:garage|parking|box)\b/i, w: 1 },
  { re: /\b(?:entr[ée]e|entree|hall|couloir|corridor)\b/i, w: 1 },
  { re: /\b(?:buanderie|laundry|cellier|dressing|rangement|placard|storage)\b/i, w: 1 },
  { re: /\b(?:salle\s+à\s+manger|dining)\b/i, w: 1 },
  { re: /\b(?:bureau|office)\b/i, w: 1 },
  { re: /\b(?:terrasse|balcon|loggia|jardin)\b/i, w: 1 },
  { re: /\b(?:plan\s*2d|plan\s+d|étage|etage|disposition|agencement|implantation|surface\s+habitable)\b/i, w: 2 },
  { re: /\b(?:rénovation|renovation|extension|agrandissement|travaux|aménagement|amenagement)\b/i, w: 1 },
  { re: /\b(?:nord|sud|est|ouest|plein\s+sud|façade)\b/i, w: 1 },
  { re: /\b(?:pièce|piece|pieces|pièces)\b/i, w: 1 },
  { re: /\b(?:cuisine\s+ouverte|open\s+kitchen|ouverte\s+sur)\b/i, w: 1 },
];

const STRONG_NON_PLAN_PATTERNS = [
  { re: /\b(?:curriculum\s+vitae|cv\s+joint|cv\s+attaché|mon\s+cv)\b/i, w: 5 },
  { re: /\b(?:lettre\s+de\s+motivation|candidature\s+spontanée|postuler|recrutement)\b/i, w: 5 },
  { re: /\b(?:offre\s+d['’]?emploi|fiche\s+de\s+poste|profil\s+recherché|profil\s+recherche)\b/i, w: 5 },
  { re: /\b(?:compétences\s+requises|competences\s+requises|expérience\s+professionnelle|experience\s+professionnelle)\b/i, w: 4 },
  { re: /\b(?:salaire\s+(?:brut|net)|fourchette\s+salariale|rémunération|rémuneration)\b/i, w: 4 },
  { re: /\b(?:cdi|cdd|stage\s+de\s+\d|alternance)\b/i, w: 3 },
  { re: /\b(?:linkedin\.com|indeed\.|welcometothejungle|glassdoor)\b/i, w: 5 },
  { re: /\b(?:job\s+description|cover\s+letter|resume|years\s+of\s+experience)\b/i, w: 5 },
  { re: /\b(?:we\s+are\s+hiring|apply\s+now|must\s+have\s+\d+\+?\s*years)\b/i, w: 4 },
  { re: /\b(?:stack\s+technique|tech\s+stack|framework\s+:|technologies\s*:)\b/i, w: 3 },
  { re: /\b(?:responsabilités\s*:|missions\s*:|objectifs\s+du\s+poste)\b/i, w: 3 },
  { re: /\b(?:dear\s+hiring|to\s+whom\s+it\s+may\s+concern)\b/i, w: 4 },
  { re: /\b(?:lorem\s+ipsum)\b/i, w: 6 },
];

function housingScore(text) {
  const t = String(text || '');
  let s = 0;
  const seen = new Set();
  for (const { re, w } of HOUSING_PATTERNS) {
    if (re.test(t)) {
      const k = re.source.slice(0, 40);
      if (!seen.has(k)) {
        seen.add(k);
        s += w;
      }
    }
  }
  return Math.min(s, 14);
}

function nonPlanScore(text) {
  const t = String(text || '');
  let s = 0;
  for (const { re, w } of STRONG_NON_PLAN_PATTERNS) {
    if (re.test(t)) s += w;
  }
  const emails = t.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
  if (emails.length >= 2) s += 4;
  if (emails.length >= 4) s += 3;
  return s;
}

function longestCharRun(text) {
  const s = String(text || '');
  let best = 1;
  let run = 1;
  for (let i = 1; i < s.length; i++) {
    if (s[i] === s[i - 1]) {
      run++;
      if (run > best) best = run;
    } else run = 1;
  }
  return best;
}

function dominantCharShare(text) {
  const s = String(text || '').replace(/\s+/g, '');
  if (s.length < 8) return 0;
  const freq = {};
  for (const c of s) {
    freq[c] = (freq[c] || 0) + 1;
  }
  return Math.max(...Object.values(freq)) / s.length;
}

function uniqueNonSpaceChars(text) {
  return new Set(String(text || '').replace(/\s+/g, '')).size;
}

function letterRatio(text) {
  const s = String(text || '');
  if (!s.length) return 0;
  const letters = (s.match(/[a-zàâäéèêëïîôùûüçñ]/gi) || []).length;
  return letters / s.length;
}

function tokenCount(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean).length;
}

export function evaluateBriefInput(text) {
  const input = String(text || '').trim();
  const len = input.length;
  const h = housingScore(input);
  const n = nonPlanScore(input);
  const run = longestCharRun(input);
  const domShare = dominantCharShare(input);
  const uniqChars = uniqueNonSpaceChars(input);
  const lr = letterRatio(input);
  const tokens = tokenCount(input);

  if (String(process.env.TEXT2D_SKIP_INPUT_GUARD || '').trim() === '1') {
    return { ok: true, housingScore: h, nonPlanScore: n, skipped: true };
  }

  if (n >= 4 && h < 6) {
    return {
      ok: false,
      code: 'non_plan_job_like',
      message:
        'Ce texte ressemble à une offre d’emploi, un CV ou un document hors logement. Décrivez un logement (pièces, surface, disposition) pour générer un plan.',
    };
  }

  const looksLikeCharSpam =
    (run >= 10 && h < 3) ||
    (domShare >= 0.65 && len >= 8 && h < 2) ||
    (len >= 10 && uniqChars <= 2 && h < 2);

  if (looksLikeCharSpam) {
    return {
      ok: false,
      code: 'non_plan_gibberish',
      message:
        'Le texte ne ressemble pas à un brief de logement (répétitions ou trop peu de mots). Indiquez pièces, surface (m²) ou dimensions (ex. 10×8 m).',
    };
  }

  if (len > 25 && lr < 0.35) {
    return {
      ok: false,
      code: 'non_plan_symbols',
      message:
        'Le texte contient trop peu de lettres pour décrire un logement. Utilisez une description en phrases (pièces, surfaces, contraintes).',
    };
  }

  if (len > 80 && tokens < 8 && h < 3) {
    return {
      ok: false,
      code: 'non_plan_low_signal',
      message:
        'Le texte est long mais ne décrit pas clairement un logement (peu de mots utiles). Précisez pièces, surface (m²) ou dimensions.',
    };
  }

  if (h < 2 && len > 40) {
    return {
      ok: false,
      code: 'non_plan_weak',
      message:
        'Impossible d’identifier un programme de logement (chambres, cuisine, séjour, surface m², dimensions, type T2/T3, etc.). Reformulez votre brief architectural.',
    };
  }

  if (h === 0 && len > 12) {
    return {
      ok: false,
      code: 'non_plan_empty',
      message:
        'Décrivez un projet de plan : type de logement, nombre de pièces, surface ou dimensions, et souhaits (cuisine ouverte, etc.).',
    };
  }

  return { ok: true, housingScore: h, nonPlanScore: n };
}
