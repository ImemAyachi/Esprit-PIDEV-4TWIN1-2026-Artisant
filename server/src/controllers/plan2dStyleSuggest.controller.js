import OpenAI from 'openai';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
    timeout: Number(process.env.LLM_TIMEOUT_MS) || 60_000,
    maxRetries: 2,
  });
}

function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    timeout: Number(process.env.LLM_TIMEOUT_MS) || 60_000,
    maxRetries: 2,
  });
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function safeStr(s, max = 2000) {
  return String(s || '').trim().slice(0, max);
}

function roomTypeCounts(plan) {
  const rooms = Array.isArray(plan?.rooms) ? plan.rooms : [];
  const counts = {
    bedrooms: 0,
    bathrooms: 0,
    wc: 0,
    kitchen: 0,
    living: 0,
    other: 0,
  };
  for (const r of rooms) {
    const n = String(r?.name || '').toLowerCase();
    if (n.includes('chambre') || n.includes('bed')) counts.bedrooms++;
    else if (n.includes('salle de bain') || n.includes('bath')) counts.bathrooms++;
    else if (/\bwc\b/.test(n) || n.includes('toilet')) counts.wc++;
    else if (n.includes('cuisine') || n.includes('kitchen')) counts.kitchen++;
    else if (n.includes('séjour') || n.includes('sejour') || n.includes('salon') || n.includes('living')) counts.living++;
    else counts.other++;
  }
  return counts;
}

function baseStylePresets() {
  return [
    {
      id: 'modern_minimal',
      name: 'Modern Minimal',
      promptStyle: 'modern minimal',
      palette: ['#0b1220', '#f8fafc', '#e5e7eb', '#a1a1aa', '#111827'],
      highlights: ['lignes nettes', 'matières mates', 'lumière naturelle'],
    },
    {
      id: 'mediterranean_modern',
      name: 'Mediterranean',
      promptStyle: 'mediterranean modern',
      palette: ['#f8fafc', '#f59e0b', '#9a3412', '#0f172a', '#f1f5f9'],
      highlights: ['blanc chaux', 'terracotta', 'bois clair'],
    },
    {
      id: 'scandinavian',
      name: 'Scandinavian',
      promptStyle: 'scandinavian',
      palette: ['#ffffff', '#e2e8f0', '#94a3b8', '#0f172a', '#f8fafc'],
      highlights: ['chêne clair', 'textiles', 'ambiance douce'],
    },
    {
      id: 'industrial',
      name: 'Industrial',
      promptStyle: 'industrial loft',
      palette: ['#0f172a', '#334155', '#e2e8f0', '#b45309', '#111827'],
      highlights: ['métal', 'béton', 'contrastes'],
    },
    {
      id: 'classic_warm',
      name: 'Classic Warm',
      promptStyle: 'classic warm',
      palette: ['#fef3c7', '#92400e', '#111827', '#f8fafc', '#d1d5db'],
      highlights: ['boiseries', 'tons chauds', 'élégant'],
    },
    {
      id: 'japandi',
      name: 'Japandi',
      promptStyle: 'japandi',
      palette: ['#fafaf9', '#a8a29e', '#0f172a', '#d6d3d1', '#f5f5f4'],
      highlights: ['minimal chaud', 'bois naturel', 'zen'],
    },
  ];
}

function scorePresetFromText(preset, text) {
  const t = String(text || '').toLowerCase();
  let s = 0;
  const has = (re) => re.test(t);
  if (preset.id.includes('mediterr') && has(/\b(mediterr|méditerr|terracotta|blanc|chaux|arcades?)\b/i)) s += 6;
  if (preset.id.includes('scandinav') && has(/\b(scandin|scandinave|nordique|hygge|bois\s+clair)\b/i)) s += 6;
  if (preset.id.includes('industrial') && has(/\b(industriel|industrial|loft|béton|brique|acier|metal)\b/i)) s += 6;
  if (preset.id.includes('japandi') && has(/\b(japandi|wabi|zen|minimal\s+chaud)\b/i)) s += 6;
  if (preset.id.includes('modern') && has(/\b(modern|moderne|minimal|contemporain)\b/i)) s += 4;
  if (preset.id.includes('classic') && has(/\b(classic|classique|haussmann|moulure|boiserie)\b/i)) s += 5;
  if (has(/\b(cheap|pas\s+cher|éco|economy|budget)\b/i)) {
    if (preset.id.includes('modern_minimal') || preset.id.includes('scandinavian')) s += 2;
  }
  return s;
}

function normalizePresetsForUi(list) {
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    promptStyle: String(p.promptStyle || p.name).slice(0, 90),
    palette: Array.isArray(p.palette) ? p.palette.slice(0, 8) : [],
    highlights: Array.isArray(p.highlights) ? p.highlights.slice(0, 5) : [],
  }));
}

async function llmRefinePresets({ client, model, text, presets }) {
  const system =
    'You help choose interior/exterior design styles for a floor plan.\n' +
    'Return STRICT JSON only. No markdown.\n' +
    'You receive a user brief and 6 style presets.\n' +
    'Output schema:\n' +
    '{ "order": string[], "notes": { [id:string]: string } }\n' +
    '- order must include each preset id exactly once.\n' +
    '- notes: 1 short sentence per id.\n';

  const user = JSON.stringify(
    {
      brief: safeStr(text, 1400),
      presets,
    },
    null,
    2
  );

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
  });

  const content = completion?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(String(content));
    const order = Array.isArray(parsed?.order) ? parsed.order.map((x) => String(x)) : null;
    const notes = parsed?.notes && typeof parsed.notes === 'object' ? parsed.notes : {};
    if (!order || order.length !== presets.length) return null;
    const set = new Set(order);
    if (set.size !== presets.length) return null;
    const valid = presets.every((p) => set.has(p.id));
    if (!valid) return null;
    return { order, notes };
  } catch {
    return null;
  }
}

export const suggestPlan2dStyles = asyncHandler(async (req, res) => {
  const plan = req.body?.plan && typeof req.body.plan === 'object' ? req.body.plan : null;
  const input = safeStr(req.body?.input || '');
  if (!plan) throw new AppError('plan manquant.', 400);

  const W = Number(plan?.width_m);
  const H = Number(plan?.height_m);
  if (!Number.isFinite(W) || !Number.isFinite(H)) throw new AppError('plan invalide (width_m/height_m).', 400);

  const presets0 = baseStylePresets();
  const scored = presets0
    .map((p) => ({
      ...p,
      _score: scorePresetFromText(p, input),
    }))
    .sort((a, b) => b._score - a._score);

  const roomCounts = roomTypeCounts(plan);
  const density = (Number.isFinite(W) && Number.isFinite(H) && W > 0 && H > 0) ? (roomCounts.bedrooms + roomCounts.bathrooms + roomCounts.wc + roomCounts.kitchen + roomCounts.living) / (W * H) : 0;
  const allowLlm = String(process.env.TEXT2D_STYLE_SUGGEST_LLM || 'true').trim().toLowerCase() === 'true';

  const groqClient = createGroqClient();
  const openaiClient = groqClient ? null : createOpenAIClient();
  const client = allowLlm ? (groqClient || openaiClient) : null;
  const modelName = String(process.env.LLM_MODEL || process.env.GROQ_MODEL || 'llama-3.1-70b-versatile').trim();

  let ordered = scored;
  let notes = {};
  if (client && input) {
    const uiPresets = normalizePresetsForUi(scored);
    const refined = await llmRefinePresets({
      client,
      model: modelName,
      text: input,
      presets: uiPresets,
    }).catch(() => null);
    if (refined?.order) {
      const byId = new Map(scored.map((p) => [p.id, p]));
      ordered = refined.order.map((id) => byId.get(id)).filter(Boolean);
      notes = refined.notes || {};
    }
  }

  const out = normalizePresetsForUi(ordered).map((p) => ({
    ...p,
    note: typeof notes?.[p.id] === 'string' ? String(notes[p.id]).slice(0, 160) : '',
  }));

  return res.status(200).json({
    success: true,
    data: {
      presets: out,
      meta: {
        model: client ? modelName : null,
        roomCounts,
        density: roundTo3(density),
      },
    },
  });
});

function roundTo3(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1000) / 1000;
}

