const DEFAULT_TIMEOUT_MS = 90_000;

function withTimeout(ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cleanup: () => clearTimeout(t) };
}

export async function callLocalDiffusionService({
  url,
  prompt,
  steps = 30,
  width = 512,
  height = 512,
  guidance = 7.5,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const base = String(url || '').replace(/\/$/, '');
  if (!base) throw new Error('diffusion_service_url_missing');
  const p = String(prompt || '').trim();
  if (!p) throw new Error('diffusion_prompt_missing');

  const { signal, cleanup } = withTimeout(timeoutMs);
  try {
    const res = await fetch(`${base}/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: p, steps, width, height, guidance_scale: guidance }),
      signal,
    });
    const j = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`diffusion_http_${res.status}:${String(j?.detail || j?.error || '').slice(0, 160)}`);
    if (!j?.image) throw new Error(`diffusion_invalid_response:${String(j?.error || '').slice(0, 160)}`);
    if (j?.error === 'pipeline_not_ready') throw new Error(`diffusion_pipeline_not_ready:${String(j?.detail || '').slice(0, 160)}`);
    return j;
  } finally {
    cleanup();
  }
}

export async function checkLocalDiffusionHealth({ url, timeoutMs = 10_000 }) {
  const base = String(url || '').replace(/\/$/, '');
  if (!base) return { ok: false };
  const { signal, cleanup } = withTimeout(timeoutMs);
  try {
    const res = await fetch(`${base}/health`, { signal });
    const j = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, body: j };
    return { ok: true, body: j };
  } finally {
    cleanup();
  }
}

