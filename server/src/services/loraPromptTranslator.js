import { extractConstraintsHeuristic } from '../plan2d/constraintExtractor.js';

function clampChoice(v, a, b) {
  return v === a || v === b ? v : null;
}

function boolFromText(t, re) {
  return re.test(t);
}

function inferSmallBigFromText(t) {
  if (/\b(big|large|grand|grande)\b/.test(t)) return 'big';
  if (/\b(small|petit|petite|compact|studio)\b/.test(t)) return 'small';
  return null;
}

function inferApartmentSizeFromText(t) {
  if (/\bsmall\s+apartment\b|\bpetit\s+appartement\b|\bpetite\s+appartement\b/.test(t)) return 'small';
  if (/\bbig\s+apartment\b|\blarge\s+apartment\b|\bgrand\s+appartement\b|\bgrande\s+appartement\b/.test(t)) return 'big';
  return null;
}

function inferFewManyRoomsFromText(t) {
  if (/\bfew\s+rooms\b|\bpeu\s+de\s+pi(è|e)ces\b/.test(t)) return 'few';
  if (/\bmany\s+rooms\b|\bbeaucoup\s+de\s+pi(è|e)ces\b/.test(t)) return 'many';
  return null;
}

function inferFewManyFromCount(n, fewMax = 3) {
  return n >= fewMax + 1 ? 'many' : 'few';
}

function deriveFromConstraintsJson(constraintsJson, rawPrompt) {
  const t = String(rawPrompt || '').toLowerCase();
  const rooms = Array.isArray(constraintsJson?.rooms) ? constraintsJson.rooms : [];
  const layoutRules = Array.isArray(constraintsJson?.layout_rules) ? constraintsJson.layout_rules : [];
  const q = constraintsJson?.meta?.qualifiers || {};

  const countOf = (type, def = 0) => {
    const hit = rooms.find((r) => String(r?.type || '').toLowerCase() === String(type).toLowerCase());
    const n = Math.round(Number(hit?.count));
    return Number.isFinite(n) ? n : def;
  };

  const totalArea = Number(constraintsJson?.total_area);
  const size =
    inferApartmentSizeFromText(t) ||
    clampChoice(String(q?.sizeQ || '').toLowerCase(), 'small', 'big') ||
    (Number.isFinite(totalArea) ? (totalArea >= 80 ? 'big' : 'small') : inferSmallBigFromText(t) || 'small');

  const bedrooms = countOf('bedroom', 1);
  const roomsCountApprox = Math.max(1, bedrooms + countOf('bathroom', 1) + countOf('kitchen', 1) + countOf('living_room', 1));
  const roomQty =
    inferFewManyRoomsFromText(t) ||
    clampChoice(String(q?.roomsQ || '').toLowerCase(), 'few', 'many') ||
    inferFewManyFromCount(roomsCountApprox, 3);

  const bathrooms = countOf('bathroom', 1);
  const bathQty = bathrooms >= 2 ? 'multiple' : 'one';

  const kitchenFeat = rooms.find((r) => String(r?.type || '').toLowerCase() === 'kitchen');
  const kitchenFeatures = Array.isArray(kitchenFeat?.features) ? kitchenFeat.features.map((s) => String(s || '').toLowerCase()) : [];
  const kitchenSize =
    kitchenFeatures.includes('island') || kitchenFeatures.includes('open') || boolFromText(t, /\b(island|îlot|ilot|open)\b/)
      ? 'big'
      : inferSmallBigFromText(t) || 'small';

  const manyWindows =
    String(q?.windowsQ || '').toLowerCase() === 'big' ||
    layoutRules.map((s) => String(s || '').toLowerCase()).includes('many_windows') ||
    boolFromText(t, /\bmany windows|beaucoup de fen(ê|e)tres\b/);
  const windowsQty = manyWindows ? 'many' : 'few';

  return {
    size: clampChoice(size, 'small', 'big'),
    roomsQty: clampChoice(roomQty, 'few', 'many'),
    bathQty: clampChoice(bathQty, 'one', 'multiple'),
    kitchenSize: clampChoice(kitchenSize, 'small', 'big'),
    windowsQty: clampChoice(windowsQty, 'few', 'many'),
  };
}

function buildTriggerSentence({ size, roomsQty, bathQty, kitchenSize, windowsQty }) {
  const bathWord = bathQty === 'one' ? 'one bathroom' : 'multiple bathrooms';
  return `Floor plan of a ${size} apartment, ${roomsQty} rooms, ${bathWord}, ${kitchenSize} kitchen, ${windowsQty} windows`;
}

function buildSystemPrompt() {
  return `
You are a prompt translator for a floor plan image model.
Given a natural language house description, output ONLY a single sentence following EXACTLY this structure:

"Floor plan of a [small/big] apartment, [few/many] rooms, [one/multiple] bathrooms, [small/big] kitchen, [few/many] windows"

Rules:
- small = under 80m², big = 80m² or more (if area present)
- few rooms = 1-3, many rooms = 4+
- one bathroom = 1, multiple = 2+
- small kitchen = no island/closed, big kitchen = open/with island
- few windows = 1-3, many windows = 4+
- Output ONLY the sentence. No explanation. No quotes.
`;
}

/**
 * Translate any user prompt into the LoRA trigger sentence.
 * Uses LLM if available; falls back to heuristics (no LLM) so system is always ready.
 *
 * @param {{ client?: any, model?: string, userPrompt: string, constraintsJson?: any }} args
 */
export async function translateToLoraPrompt({ client, model, userPrompt, constraintsJson = null }) {
  const raw = String(userPrompt || '').trim();
  if (!raw) throw new Error('translateToLoraPrompt: userPrompt missing');

  // Preferred: use constraintsJson if provided (deterministic mapping).
  try {
    const c = constraintsJson || extractConstraintsHeuristic(raw);
    const bits = deriveFromConstraintsJson(c, raw);
    // If no client/model, return heuristic immediately.
    if (!client || !model) return buildTriggerSentence(bits);
  } catch {
    // ignore; may still use LLM below
  }

  // LLM translation (optional).
  if (client && model) {
    const completion = await client.chat.completions.create({
      model: String(model),
      temperature: 0.0,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: raw },
      ],
    });
    const out = String(completion?.choices?.[0]?.message?.content || '').trim();
    if (out) return out;
  }

  // Final deterministic fallback.
  const c = constraintsJson || extractConstraintsHeuristic(raw);
  const bits = deriveFromConstraintsJson(c, raw);
  return buildTriggerSentence(bits);
}

