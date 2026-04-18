import crypto from 'crypto';
import OpenAI from 'openai';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

function stableStringify(obj) {
  const seen = new Set();
  const replacer = (_, value) => {
    if (value && typeof value === 'object') {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
      if (Array.isArray(value)) return value;
      return Object.keys(value)
        .sort()
        .reduce((acc, k) => {
          acc[k] = value[k];
          return acc;
        }, {});
    }
    return value;
  };
  return JSON.stringify(obj, replacer);
}

function hashKey(s) {
  return crypto.createHash('sha256').update(String(s || '')).digest('hex').slice(0, 24);
}

function normalizeView(view) {
  const v = String(view || '').toLowerCase().trim();
  if (['facade', 'façade', 'extérieur', 'exterieur', 'exterior'].some((k) => v.includes(k))) return 'facade';
  if (['interieur', 'intérieur', 'interior'].some((k) => v.includes(k))) return 'interior';
  return '';
}

function pickRoom(planRooms, predicates) {
  if (!Array.isArray(planRooms)) return null;
  const rooms = planRooms
    .map((r) => ({ name: String(r?.name || ''), r }))
    .filter((x) => x.name);
  for (const pred of predicates) {
    const hit = rooms.find((x) => pred(x.name));
    if (hit) return hit.r;
  }
  return null;
}

function inferRelativeZonesFromRooms(plan) {
  const rooms = Array.isArray(plan?.rooms) ? plan.rooms : [];
  if (rooms.length === 0) return {};
  const xs = rooms.map((r) => Number(r.x) + Number(r.w) / 2).filter((n) => Number.isFinite(n));
  const ys = rooms.map((r) => Number(r.y) + Number(r.h) / 2).filter((n) => Number.isFinite(n));
  const W = Number(plan?.width_m) || 10;
  const H = Number(plan?.height_m) || 8;
  const medianX = xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? W / 2;
  const medianY = ys.sort((a, b) => a - b)[Math.floor(ys.length / 2)] ?? H / 2;
  return {
    W,
    H,
    centerLike: { x: medianX, y: medianY },
  };
}

function mapStyleToPromptBits(style) {
  const s = String(style || '').toLowerCase().trim();
  if (s.includes('mediterr') || s.includes('méditerr')) {
    return {
      styleLine:
        'Mediterranean modern architecture with white lime plaster, warm terracotta accents, natural stone, light wood, simple geometry, and subtle wrought-iron details.',
      materialLine: 'white stucco, terracotta, travertine-like stone, natural oak, matte finishes',
      decorLine: 'indoor plants, minimal decor, soft shadows, daylight, clean lines',
    };
  }
  if (s.includes('moderne')) {
    return {
      styleLine: 'Modern minimal Mediterranean vibe: clean contemporary lines, refined materials, balanced proportions, realistic textures.',
      materialLine: 'plaster, wood, neutral stone, matte paints, brushed metal',
      decorLine: 'contemporary furniture, warm lighting, natural textures, calm atmosphere',
    };
  }
  if (s.includes('minimal')) {
    return {
      styleLine: 'Minimal contemporary interior/exterior, neutral palette, high-end realistic materials.',
      materialLine: 'microcement, light wood, warm gray stone, matte textures',
      decorLine: 'few objects, strong composition, natural daylight',
    };
  }
  if (s.includes('scandin') || s.includes('scandinave')) {
    return {
      styleLine: 'Scandinavian interior/exterior, bright spaces, soft natural light, realistic wood and textiles.',
      materialLine: 'light oak, linen textiles, warm off-white walls',
      decorLine: 'simple Scandinavian decor, realistic textiles',
    };
  }
  return {
    styleLine: 'High-end photorealistic architectural visualization with refined contemporary style.',
    materialLine: 'realistic materials, warm lighting, natural textures',
    decorLine: 'clean composition, realistic furniture',
  };
}

function buildPrompt({ plan, style, view }) {
  const viewNorm = normalizeView(view);
  if (!viewNorm) throw new AppError('view invalide (interior|facade).', 400);
  const { styleLine, materialLine, decorLine } = mapStyleToPromptBits(style);
  const rooms = Array.isArray(plan?.rooms) ? plan.rooms : [];

  const kitchen = pickRoom(rooms, [(n) => /cuisine|kitchen/i.test(n)]);
  const living = pickRoom(rooms, [(n) => /sejour|séjour|salon|living/i.test(n)]);
  const hallway = pickRoom(rooms, [(n) => /couloir|hallway|hall|corridor/i.test(n)]);
  const beds = rooms.filter((r) => /chambre|bed/i.test(String(r?.name || '')));

  const infer = inferRelativeZonesFromRooms(plan);
  const W = infer.W || 10;
  const H = infer.H || 8;

  const kitchenSide = kitchen ? (Number(kitchen.x) + Number(kitchen.w) / 2 > W / 2 ? 'east side' : 'west side') : 'near the kitchen zone';
  const livingSide = living ? (Number(living.x) + Number(living.w) / 2 > W / 2 ? 'east/center' : 'center') : 'center';
  const bedsSide = beds.length ? (beds.every((b) => Number(b.y) + Number(b.h) / 2 > H * 0.6) ? 'south/private zone' : 'private zone') : 'private zone';

  const layoutLine = [
    `Layout constraints from the 2D plan:`,
    `- Entry + circulation leads to ${living ? 'the living room' : 'the main living area'}.`,
    `- Kitchen is on the ${kitchenSide} of the layout.`,
    `- Living room is positioned toward the ${livingSide}.`,
    `- Bedrooms are positioned in the ${bedsSide}.`,
    hallway ? `- A hallway/corridor (${hallway.name}) connects public and private zones.` : `- A hallway/corridor connects public and private zones.`,
  ].join('\n');

  if (viewNorm === 'interior') {
    return [
      `Photorealistic architectural interior render (wide-angle), ${styleLine}`,
      `Materials: ${materialLine}.`,
      `Decor: ${decorLine}.`,
      layoutLine,
      `Camera: eye-level, 24mm lens, natural daylight from windows, realistic shadows, no distortion.`,
      `Include visible flow: kitchen zone adjacent to living zone, circulation visible leading toward bedrooms.`,
    ].join('\n');
  }

  return [
    `Photorealistic architectural facade render (front exterior), ${styleLine}`,
    `Materials: ${materialLine}.`,
    `Decor: ${decorLine}.`,
    `Use the 2D plan to infer openings: large windows in living area, smaller windows in bedrooms, balanced facade composition.`,
    layoutLine,
    `Lighting: morning sunlight, clear sky, realistic ambience, high detail.`,
  ].join('\n');
}

function svgToDataUrl(svg) {
  const s = String(svg || '');
  if (!s) return '';
  const encoded = encodeURIComponent(s)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

async function generateWithHf({ hfToken, model, prompt, negativePrompt, width = 1024, height = 768 }) {
  
  
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: hfToken ? `Bearer ${hfToken}` : undefined,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          negative_prompt: negativePrompt,
          width,
          height,
          num_inference_steps: 35,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`HF Inference failed (${res.status}). ${text.slice(0, 300)}`);
      err.statusCode = 502;
      throw err;
    }

    const ct = String(res.headers.get('content-type') || '');
    if (ct.startsWith('image/')) {
      const buf = Buffer.from(await res.arrayBuffer());
      return buf;
    }

    
    const json = await res.json();
    const b64 =
      json?.image_base64 ||
      json?.images?.[0]?.base64 ||
      json?.generated_images?.[0]?.base64 ||
      json?.generated_images?.[0]?.image_base64;
    if (typeof b64 === 'string' && b64.length > 20) {
      return Buffer.from(b64, 'base64');
    }

    throw new Error('Réponse HF non reconnue (pas d’image).');
  } finally {
    clearTimeout(t);
  }
}

async function generateWithOpenAI({ openaiKey, prompt, negativePrompt }) {
  const client = new OpenAI({ apiKey: openaiKey });
  const model = process.env.TEXT2D_RENDER_OPENAI_MODEL || 'gpt-image-1';
  const size = process.env.TEXT2D_RENDER_OPENAI_SIZE || '1024x1024';

  
  if (!client.images?.generate) {
    throw new AppError('OpenAI images.generate indisponible dans ce SDK.', 503);
  }

  const fullPrompt = `${prompt}\n\nNegative prompt: ${negativePrompt}`;
  const out = await client.images.generate({
    model,
    prompt: fullPrompt,
    size,
  });

  const b64 = out?.data?.[0]?.b64_json || out?.data?.[0]?.b64;
  if (!b64) throw new AppError('Réponse OpenAI image invalide (b64 manquant).', 502);
  return Buffer.from(b64, 'base64');
}

const cache = new Map();
const CACHE_TTL_MS = Number(process.env.TEXT2D_RENDER_CACHE_TTL_MS) || 15 * 60_000;
const CACHE_MAX = Number(process.env.TEXT2D_RENDER_CACHE_MAX) || 100;

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
  const firstKey = cache.keys().next().value;
  if (firstKey) cache.delete(firstKey);
}

export const createPlan2dRender = asyncHandler(async (req, res) => {
  const plan = req.body?.plan && typeof req.body.plan === 'object' ? req.body.plan : null;
  const style = String(req.body?.style || '').trim();
  const view = req.body?.view;

  const viewNorm = normalizeView(view);
  if (!plan) throw new AppError('plan manquant.', 400);
  if (!style || style.length > 90) throw new AppError('style invalide.', 400);
  if (!viewNorm) throw new AppError('view invalide (interior|facade).', 400);

  const svg = String(req.body?.svg || '');
  const promptPlan = buildPrompt({ plan, style, view: viewNorm });

  const negativePrompt =
    'text, watermark, logo, messy lines, black blobs, low quality, artifacts, distorted geometry, unrealistic materials, overexposed, underexposed';

  const hfModelList = String(process.env.TEXT2D_RENDER_HF_MODEL || 'stabilityai/sdxl-turbo')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const cacheKey = hashKey(`${viewNorm}:${style}:${stableStringify(plan)}:${hfModelList.join('|')}`);
  const cached = cacheGet(cacheKey);
  if (cached) return res.status(200).json({ success: true, data: cached, meta: { cached: true } });

  const hfToken = String(process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || '').trim();
  const openaiKey = String(process.env.OPENAI_API_KEY || '').trim();

  let lastErr;
  let imgBuf = null;
  const canTryHf = Boolean(hfToken) && hfModelList.length > 0;

  
  if (canTryHf) {
    for (const model of hfModelList) {
      try {
        imgBuf = await generateWithHf({
          hfToken,
          model,
          prompt: promptPlan,
          negativePrompt,
        });
        break;
      } catch (err) {
        lastErr = err;
      }
    }
  }

  
  if (!imgBuf && openaiKey) {
    try {
      imgBuf = await generateWithOpenAI({
        openaiKey,
        prompt: promptPlan,
        negativePrompt,
      });
    } catch (err) {
      lastErr = err;
    }
  }

  
  if (!imgBuf) {
    const svgUrl = svg ? svgToDataUrl(svg) : '';
    if (svgUrl) {
      const data = { url: svgUrl, view: viewNorm, mode: 'fallback_svg' };
      cacheSet(cacheKey, data);
      return res.status(200).json({ success: true, data, meta: { fallback: 'svg' } });
    }
    throw lastErr instanceof AppError
      ? lastErr
      : new AppError(String(lastErr?.message || 'Erreur rendu'), 502);
  }

  const uploaded = await uploadBufferToCloudinary(imgBuf, {
    folder: 'buildmarket/ai2d/renders',
    publicId: `render_${viewNorm}_${Date.now()}`,
    resourceType: 'image',
    format: 'png',
  });

  const data = { url: uploaded.secure_url || uploaded.url, view: viewNorm, mode: 'photo' };
  cacheSet(cacheKey, data);
  return res.status(200).json({ success: true, data });
});

