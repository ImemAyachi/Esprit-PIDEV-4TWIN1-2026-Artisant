import { readFileSync, existsSync } from 'fs';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normBaseUrl(url) {
  return String(url || '').trim().replace(/\/$/, '');
}

function deepReplacePlaceholders(obj, replacements) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((x) => deepReplacePlaceholders(x, replacements));

  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      let s = v;
      for (const [ph, rep] of Object.entries(replacements)) {
        s = s.split(ph).join(rep);
      }
      out[k] = s;
    } else if (v && typeof v === 'object') {
      out[k] = deepReplacePlaceholders(v, replacements);
    } else out[k] = v;
  }
  return out;
}

function pickFirstImage(outputNode) {
  const imgs = outputNode?.images;
  if (!Array.isArray(imgs) || imgs.length === 0) return null;
  const img = imgs[0];
  const filename = String(img?.filename || '').trim();
  const subfolder = String(img?.subfolder || '').trim();
  const type = String(img?.type || 'output').trim();
  if (!filename) return null;
  return { filename, subfolder, type };
}

export async function comfyuiGenerateImage({
  url,
  workflowPath,
  prompt,
  negativePrompt = '',
  timeoutMs = 120_000,
  pollMs = 800,
}) {
  const base = normBaseUrl(url);
  if (!base) throw new Error('COMFYUI_URL missing');
  const p = String(workflowPath || '').trim();
  if (!p) throw new Error('COMFYUI_WORKFLOW_PATH missing');
  if (!existsSync(p)) throw new Error(`COMFYUI workflow not found: ${p}`);

  const raw = readFileSync(p, 'utf8');
  let wf;
  try {
    wf = JSON.parse(raw);
  } catch {
    throw new Error('COMFYUI workflow JSON invalid');
  }

  const wf2 = deepReplacePlaceholders(wf, {
    '{{PROMPT}}': String(prompt || ''),
    '{{NEGATIVE_PROMPT}}': String(negativePrompt || ''),
  });

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: wf2 }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`comfyui_http_${res.status}:${txt.slice(0, 180)}`);
    }
    const json = await res.json();
    const promptId = String(json?.prompt_id || '').trim();
    if (!promptId) throw new Error('comfyui_missing_prompt_id');

    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const hr = await fetch(`${base}/history/${encodeURIComponent(promptId)}`, { signal: ctrl.signal }).catch(() => null);
      if (hr && hr.ok) {
        const h = await hr.json().catch(() => null);
        const entry = h?.[promptId];
        const outputs = entry?.outputs;
        if (outputs && typeof outputs === 'object') {
          for (const nodeOut of Object.values(outputs)) {
            const img = pickFirstImage(nodeOut);
            if (img) {
              const qs = new URLSearchParams({
                filename: img.filename,
                subfolder: img.subfolder || '',
                type: img.type || 'output',
              });
              const imgRes = await fetch(`${base}/view?${qs.toString()}`, { signal: ctrl.signal });
              if (!imgRes.ok) {
                const txt = await imgRes.text().catch(() => '');
                throw new Error(`comfyui_view_${imgRes.status}:${txt.slice(0, 160)}`);
              }
              const buf = Buffer.from(await imgRes.arrayBuffer());
              if (!buf || buf.length < 1000) throw new Error('comfyui_empty_image');
              return buf;
            }
          }
        }
      }
      await sleep(pollMs);
    }

    throw new Error('comfyui_timeout');
  } finally {
    clearTimeout(t);
  }
}

