import OpenAI from 'openai';
import { generateLocalPlan } from '../utils/localProjectPlanner.js';

const MAX_INPUT_LENGTH = 8000;

const CACHE_TTL_MS = Number(process.env.AI_CACHE_TTL_MS) || 5 * 60_000;
const CACHE_MAX = Number(process.env.AI_CACHE_MAX) || 200;
/** @type {Map<string, { at: number, data: any }>} */
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key, data) {
  if (!key) return;
  cache.set(key, { at: Date.now(), data });
  if (cache.size <= CACHE_MAX) return;
  // Drop oldest entry (simple FIFO is good enough here).
  const firstKey = cache.keys().next().value;
  if (firstKey) cache.delete(firstKey);
}

const CONSULTANT_SYSTEM =
  'Tu es un consultant expert en production industrielle pour une plateforme artisanale (Tunisie, français). ' +
  'Chaque plan doit être spécifique à la demande—jamais de texte générique ou passe-partout. ' +
  'Raisonne comme un chef d’atelier ou un responsable de production: quantité, matériaux, complexité, export, personnalisation et main-d’œuvre fixent délais et coûts. ' +
  'Langue: français professionnel pour toutes les valeurs textuelles. ' +
  'Coûts: dinar tunisien uniquement, indiqué avec le suffixe « DT » (ex. « 2 500 – 3 800 DT »). ' +
  'Sortie: un seul objet JSON, sans blocs markdown, sans texte hors JSON.';

const JSON_ONLY_SYSTEM = `${CONSULTANT_SYSTEM}

Clés JSON obligatoires (noms en anglais pour le parsing): category, materials, experts, estimatedTime, estimatedCost, steps, reasoning, insights, risks, optimizations. ` +
  'Toutes les chaînes et éléments de listes sont en français; estimatedCost en DT.';

function buildUserMessage(input) {
  return `Tu es un consultant expert en production industrielle pour une plateforme artisanale.

LANGUE: tout le contenu des champs (catégorie, listes, délais, coût, étapes, raisonnement, etc.) doit être rédigé en français.
DEVISE: pour estimatedCost, utilise uniquement le dinar tunisien, avec le suffixe « DT » après les montants (ex. « 1 500 – 2 200 DT »). Pas de dollars ni d’euros sauf si l’utilisateur les demande explicitement.

IMPORTANT:
* Pas de réponses génériques ni de modèles figés
* Adapte tout à l’entrée: quantité, matériaux, complexité, objectif (export, sur-mesure, etc.)
* Raisonne comme un expert terrain
* Interdiction de boilerplate: ne donne PAS des conseils passe-partout réutilisables d’un projet à l’autre.

CONTRAINTES ANTI-RÉPÉTITION (très important):
- Les champs insights/risks/optimizations doivent être **spécifiques** à l’entrée et mentionner au moins un détail concret du projet (ex: surface, quantité, matériau, site, délai, finition, normes, logistique).
- Ne propose PAS automatiquement: "matériaux locaux", "systèmes solaires", "récupération d’eau", "gestion de projet", "fournisseurs locaux" sauf si l’entrée parle d’écologie, énergie, eau, local, budget transport, ou si c’est indispensable et justifié par un détail concret.
- Chaque item doit être actionnable et précis (si possible: chiffres, tolérances, délais, contrôles, outillage, effectifs).
- Aucune phrase générique de type "prendre en compte les conditions climatiques" sans préciser QUOI (ex: cure béton, plages de coulage, protection, planning).

ENTRÉE UTILISATEUR:
${input}

SORTIE:
Retourne UNIQUEMENT un JSON valide avec cette structure (les noms de clés restent en anglais pour l’application):

{
  "category": "",
  "materials": [],
  "experts": [],
  "estimatedTime": "",
  "estimatedCost": "",
  "steps": [],
  "reasoning": "",
  "insights": [],
  "risks": [],
  "optimizations": []
}

EXIGENCES DE CONTENU:
1) insights: 3–5 points très concrets, chacun doit se rattacher à une étape, un matériau, ou une contrainte du projet.
2) risks: 3–5 risques concrets avec cause + impact (délai/coût/qualité) + mitigation courte.
3) optimizations: 3–5 optimisations concrètes (batching, gabarits, organisation postes, contrôles qualité, alternatives matériaux/techniques) **justifiées** par l’entrée.
`;
}

function extractJsonPayload(content) {
  const s = String(content).trim();
  const m = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
  if (m) return m[1].trim();
  return s;
}

function normalizePlan(obj) {
  const asStrings = (arr) => (Array.isArray(arr) ? arr.map((x) => String(x).trim()).filter(Boolean) : []);
  return {
    category: String(obj?.category ?? '').trim() || 'Général',
    materials: asStrings(obj?.materials),
    experts: asStrings(obj?.experts),
    estimatedTime: String(obj?.estimatedTime ?? '').trim() || '—',
    estimatedCost: String(obj?.estimatedCost ?? '').trim() || '—',
    steps: asStrings(obj?.steps),
    reasoning: String(obj?.reasoning ?? '').trim() || '—',
    insights: asStrings(obj?.insights),
    risks: asStrings(obj?.risks),
    optimizations: asStrings(obj?.optimizations),
  };
}

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractContext(input) {
  const raw = String(input || '');
  const t = normalizeText(raw);

  const surface = /\b(\d{2,5})\s*(?:m2|m²)\b/i.exec(raw)?.[1];
  const qty = /\b(\d{1,6})\b/.exec(raw)?.[1];
  const budget = /\b(\d{1,3}(?:[ .]\d{3})*|\d{1,7})\s*(?:dt|dinar|dinars)\b/i.exec(raw)?.[1];
  const hasExport = /\bexport|douane|livraison internationale|incoterm|emballage\b/i.test(raw);
  const deadline =
    /\b(\d{1,3})\s*(jours?|semaines?|mois)\b/i.exec(raw)?.[0] ||
    /\bd[ée]lai\s*[:=]?\s*([^\n,;.]+)/i.exec(raw)?.[1]?.trim() ||
    '';

  const keywords = [
    'cuir',
    'ceramique',
    'céramique',
    'raku',
    'beton',
    'béton',
    'maison',
    'chantier',
    'toiture',
    'fondations',
    'carrelage',
    'marbre',
    'bois',
    'metal',
    'métal',
    'textile',
    'bijou',
    'bijouterie',
    'sac',
    'bol',
    'mug',
    'export',
  ];

  const present = keywords.filter((k) => t.includes(normalizeText(k)));
  const signals = {
    surface: surface ? `${surface} m²` : '',
    qty: qty ? `${qty}` : '',
    budget: budget ? `${String(budget).replace(/\s+/g, ' ').trim()} DT` : '',
    deadline: deadline ? String(deadline).slice(0, 40) : '',
    hasExport,
    present,
  };
  return signals;
}

function containsAny(hay, needles) {
  const h = normalizeText(hay);
  return needles.some((n) => n && h.includes(normalizeText(n)));
}

function isTooGeneric(line, ctx) {
  const n = normalizeText(line);
  if (!n) return true;

  // Generic phrases we want to avoid unless justified by input.
  const banned = [
    'materiaux locaux',
    'matériaux locaux',
    'fournisseurs locaux',
    'gestion de projet',
    'systeme de gestion de projet',
    'système de gestion de projet',
    'systeme de gestion',
    'système de gestion',
    'conditions climatiques',
    'prendre en compte les conditions climatiques',
    'installation de systemes solaires',
    "installation de systemes solaires ou de recuperation d'eau",
    "récupération d'eau",
    'recycl',
  ];

  const allowLocal = containsAny(ctx.present.join(' '), ['local', 'transport']);
  const allowEco = containsAny(ctx.present.join(' '), ['eco', 'ecolo', 'solaire', 'eau', 'recycl']);

  const hitsBanned = banned.some((b) => n.includes(normalizeText(b)));
  if (hitsBanned && !allowLocal && !allowEco) return true;

  // If it doesn’t mention any concrete signal, treat as generic.
  const anchors = [
    ctx.surface,
    ctx.qty,
    ctx.budget,
    ctx.deadline,
    ...(ctx.present || []).slice(0, 10),
    ctx.hasExport ? 'export' : '',
  ].filter(Boolean);

  return anchors.length > 0 ? !containsAny(line, anchors) : false;
}

function uniqKeepOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = normalizeText(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function genSpecificBullets(type, ctx, plan) {
  const cat = normalizeText(plan?.category || '');
  const bits = [];
  const surface = ctx.surface ? `(${ctx.surface})` : '';
  const qty = ctx.qty ? `(qté ${ctx.qty})` : '';
  const budget = ctx.budget ? `(budget ${ctx.budget})` : '';
  const deadline = ctx.deadline ? `(délai ${ctx.deadline})` : '';
  const exportBit = ctx.hasExport ? '(export/transport)' : '';

  const base = (s) => s.replace(/\s+/g, ' ').trim();

  if (type === 'insights') {
    if (cat.includes('maison') || ctx.present.includes('maison') || ctx.present.includes('chantier')) {
      bits.push(base(`Découper le planning en lots (gros œuvre → clos/couvert → second œuvre → finitions) ${surface} ${deadline}.`));
      bits.push(base(`Verrouiller le métré et la liste matériaux (béton/acier/maçonnerie) avant commande pour éviter les avenants ${budget}.`));
      bits.push(base(`Prévoir un contrôle qualité à chaque jalon (fondations, dalle, élévations, toiture, réseaux) avec PV de réception.`));
      bits.push(base(`Caler la disponibilité des corps d’état (élec/plomberie) avant fermeture des murs pour limiter les reprises et surcoûts.`));
    } else if (cat.includes('ceram') || ctx.present.includes('ceramique') || ctx.present.includes('raku')) {
      bits.push(base(`Standardiser la forme via gabarit/moule ${qty} pour stabiliser les dimensions et le taux de rebut.`));
      bits.push(base(`Planifier les temps incompressibles (séchage + biscuit + émaillage + raku) ${deadline}.`));
      bits.push(base(`Définir un protocole d’échantillonnage QC (craquelures, chocs, variation d’émail) avant emballage ${exportBit}.`));
      bits.push(base(`Préparer un packaging individuel (calage, intercalaires) pour réduire la casse ${exportBit}.`));
    } else if (cat.includes('cuir') || ctx.present.includes('cuir') || ctx.present.includes('sac')) {
      bits.push(base(`Valider le prototype + gamme de fabrication avant série ${qty} (coutures, tranches, quincaillerie).`));
      bits.push(base(`Batcher découpe/parage/couture/finition pour réduire les changements d’outillage et les temps morts.`));
      bits.push(base(`Sécuriser les consommables critiques (fermetures, boucles, fil) en 10–15% de marge pour éviter blocage.`));
      bits.push(base(`Prévoir contrôle fin de ligne (alignement, points, tranches) + emballage ${exportBit}.`));
    } else {
      bits.push(base(`Verrouiller cahier des charges + prototype avant lancement ${qty || surface || ''} ${deadline}.`));
      bits.push(base(`Planifier les postes en parallèle (préparation, production, finition, QC) pour tenir ${deadline || 'le délai'}.`));
      bits.push(base(`Définir un point QC à mi-parcours pour éviter la reproduction d’un défaut sur toute la série.`));
    }
  }

  if (type === 'risks') {
    if (cat.includes('maison') || ctx.present.includes('maison') || ctx.present.includes('chantier')) {
      bits.push(base(`Risque: dérive budget ${budget} via modifications en cours de chantier → mitigation: gel des plans + procédure d’avenant chiffré.`));
      bits.push(base(`Risque: retards sur clos/couvert ${deadline} → mitigation: planifier commandes longues (menuiseries, toiture) dès S1.`));
      bits.push(base(`Risque: non-conformité béton/ferraillage → mitigation: contrôle ferraillage + essais béton avant coulage.`));
      bits.push(base(`Risque: conflits entre corps d’état (élec/plomberie) → mitigation: réunion hebdo + plans de réservation.`));
    } else if (cat.includes('ceram') || ctx.present.includes('ceramique') || ctx.present.includes('raku')) {
      bits.push(base(`Risque: casse/fissures au séchage (qté ${ctx.qty || '120'}) → mitigation: séchage contrôlé + contrôle humidité.`));
      bits.push(base(`Risque: variations raku (température/atmosphère) → mitigation: courbe de cuisson + lot témoin à chaque fournée.`));
      bits.push(base(`Risque: casse transport ${exportBit} → mitigation: packaging individuel + test de chute.`));
      bits.push(base(`Risque: goulot d’étranglement au four ${deadline} → mitigation: planning fournées + capacité four documentée.`));
    } else if (cat.includes('cuir') || ctx.present.includes('cuir')) {
      bits.push(base(`Risque: rupture quincaillerie/fermetures sur série ${qty} → mitigation: double sourcing + stock tampon.`));
      bits.push(base(`Risque: variabilité cuir (teinte/épaisseur) → mitigation: contrôle réception + regroupement par lot.`));
      bits.push(base(`Risque: défauts couture/tranches → mitigation: checklists QC + reprise avant emballage ${exportBit}.`));
    } else {
      bits.push(base(`Risque: retard matière première ${deadline} → mitigation: commande anticipée + alternative validée.`));
      bits.push(base(`Risque: défaut qualité reproduit en série ${qty || ''} → mitigation: prototype + QC early.`));
      bits.push(base(`Risque: dépassement coût ${budget} → mitigation: suivi consommations + seuil d’alerte.`));
    }
  }

  if (type === 'optimizations') {
    if (cat.includes('maison') || ctx.present.includes('maison') || ctx.present.includes('chantier')) {
      bits.push(base(`Optimiser: phasage par zones (RDC/étage) pour paralléliser second œuvre et gagner sur ${deadline || 'le délai'}.`));
      bits.push(base(`Optimiser: pré-réservations et plans d’exécution (élec/plomberie) avant maçonnerie pour réduire reprises.`));
      bits.push(base(`Optimiser: standardiser finitions (carrelage/peinture) pour limiter références et tenir ${budget || 'le budget'}.`));
      bits.push(base(`Optimiser: checklists de réception par lot (fondations, élévations, réseaux) pour éviter rework.`));
    } else if (cat.includes('ceram') || ctx.present.includes('ceramique') || ctx.present.includes('raku')) {
      bits.push(base(`Optimiser: lots de production (façonnage → séchage → cuisson) pour réduire temps d’attente ${deadline}.`));
      bits.push(base(`Optimiser: gabarits + marquage pour accélérer façonnage ${qty}.`));
      bits.push(base(`Optimiser: standardiser le packaging export (dimensions, calage) pour réduire casse ${exportBit}.`));
      bits.push(base(`Optimiser: automatiser la traçabilité des fournées (températures, émaux) pour stabiliser raku.`));
    } else if (cat.includes('cuir') || ctx.present.includes('cuir')) {
      bits.push(base(`Optimiser: découpe groupée + nesting pour réduire chutes sur série ${qty}.`));
      bits.push(base(`Optimiser: postes dédiés (parage/couture/finition) pour améliorer cadence et qualité.`));
      bits.push(base(`Optimiser: gabarits de perçage + repères pour réduire erreurs et reprises.`));
    } else {
      bits.push(base(`Optimiser: batching par opération (prépa/production/finition/QC) pour tenir ${deadline || 'le délai'}.`));
      bits.push(base(`Optimiser: gabarits et checklists QC pour réduire rebut sur ${qty || 'la série'}.`));
      bits.push(base(`Optimiser: sécuriser 2 fournisseurs critiques pour éviter blocage.`));
    }
  }

  return uniqKeepOrder(bits).filter(Boolean);
}

function enforceSpecificity(input, plan) {
  const ctx = extractContext(input);

  const keepSpecific = (arr, type) => {
    const src = Array.isArray(arr) ? arr.map(String) : [];
    const kept = src.filter((x) => !isTooGeneric(x, ctx));
    const generated = genSpecificBullets(type, ctx, plan);
    const merged = uniqKeepOrder([...kept, ...generated]);
    // Keep 3–5 items.
    return merged.slice(0, 5).length >= 3 ? merged.slice(0, 5) : merged.slice(0, 3);
  };

  return {
    ...plan,
    insights: keepSpecific(plan.insights, 'insights'),
    risks: keepSpecific(plan.risks, 'risks'),
    optimizations: keepSpecific(plan.optimizations, 'optimizations'),
  };
}

function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: Number(process.env.LLM_TIMEOUT_MS) || 90_000,
    maxRetries: 2,
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getRetryAfterSeconds(err) {
  const h =
    err?.headers?.['retry-after'] ??
    err?.headers?.get?.('retry-after') ??
    err?.response?.headers?.['retry-after'];
  if (h == null) return 0;
  const n = parseInt(String(h), 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 60) : 0;
}

async function runWith429Retries(fn, maxAttempts) {
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.status ?? err?.statusCode;
      if (status !== 429 && err?.name !== 'RateLimitError') throw err;
      if (attempt >= maxAttempts - 1) throw err;
      const fromHeader = getRetryAfterSeconds(err);
      const backoffMs = fromHeader > 0 ? fromHeader * 1000 : Math.min(12_000, 1200 * 2 ** attempt);
      console.warn(`[ai/project-plan] 429 retry ${attempt + 2}/${maxAttempts} in ${Math.round(backoffMs / 1000)}s`);
      await sleep(backoffMs);
    }
  }
  throw lastErr;
}

async function generateWithGroq(input) {
  const client = createGroqClient();
  if (!client) {
    const err = new Error('GROQ_API_KEY is not set');
    err.statusCode = 503;
    throw err;
  }

  const model = process.env.GROQ_MODEL || process.env.LLM_MODEL || 'llama-3.3-70b-versatile';

  const maxAttempts = Math.min(6, Math.max(2, Number(process.env.LLM_429_MAX_ATTEMPTS) || 4));
  const completion = await runWith429Retries(
    () =>
      client.chat.completions.create({
        model,
        // Slightly higher temp to reduce repetitive phrasing,
        // while still keeping structured JSON stable.
        temperature: 0.7,
        messages: [
          { role: 'system', content: JSON_ONLY_SYSTEM },
          { role: 'user', content: buildUserMessage(input) },
        ],
        response_format: { type: 'json_object' },
      }),
    maxAttempts
  );

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error('Réponse vide du fournisseur LLM.');
    err.statusCode = 502;
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(extractJsonPayload(content));
  } catch {
    const err = new Error('JSON invalide reçu du fournisseur.');
    err.statusCode = 502;
    throw err;
  }

  return normalizePlan(parsed);
}

export async function createProjectPlan(req, res) {
  const raw =
    typeof req.body?.input === 'string'
      ? req.body.input
      : typeof req.body?.description === 'string'
        ? req.body.description
        : '';

  const input = String(raw || '').trim();
  if (!input) return res.status(400).json({ success: false, message: 'Champ "input" manquant ou vide.' });
  if (input.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ success: false, message: `Texte trop long (max ${MAX_INPUT_LENGTH} caractères).` });
  }

  try {
    const cacheKey = `groq:${(process.env.GROQ_MODEL || process.env.LLM_MODEL || 'llama-3.3-70b-versatile')}:${input}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: cached, meta: { cached: true } });
    }

    const data = enforceSpecificity(input, await generateWithGroq(input));
    cacheSet(cacheKey, data);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    // Clear message when key is missing; optional local fallback for dev.
    if (err?.statusCode === 503 && /GROQ_API_KEY/i.test(String(err?.message || ''))) {
      if (process.env.AI_FALLBACK_LOCAL === 'true') {
        const data = generateLocalPlan(input);
        return res.status(200).json({ success: true, data, meta: { fallback: 'local' } });
      }
      return res.status(503).json({
        success: false,
        message: 'LLM non configuré : renseignez GROQ_API_KEY dans server/.env (console.groq.com).',
      });
    }

    const status = err?.status || err?.statusCode;
    if (status === 429) {
      return res.status(429).json({
        success: false,
        code: 'rate_limit',
        message: 'Limite Groq (requêtes/tokens). Attendez 1–2 minutes puis réessayez.',
      });
    }

    return res.status(502).json({
      success: false,
      message: err?.message || 'Échec génération du plan.',
    });
  }
}

