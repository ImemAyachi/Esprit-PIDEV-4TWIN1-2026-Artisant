const DEFAULT_PROCESS_URL = 'http://localhost:8000/api/v1/process';

function getProcessUrl() {
  return process.env.NLP_PROCESSOR_URL || DEFAULT_PROCESS_URL;
}

async function postJsonWithTimeout(url, body, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const msg =
        (data && (data.message || data.detail)) ||
        `NLP processor error (HTTP ${res.status})`;
      const err = new Error(msg);
      err.status = 502;
      err.upstream_status = res.status;
      err.upstream = data;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function processText(req, res, next) {
  try {
    const { text, hint_language, context, options } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, message: 'text is required' });
    }

    const payload = {
      text,
      hint_language,
      context: context && typeof context === 'object' ? context : undefined,
      options: {
        correct_errors: true,
        extract_entities: true,
        extract_sentiment: false,
        language_fallback: 'en',
        confidence_threshold: 0.6,
        ...(options && typeof options === 'object' ? options : {}),
      },
    };

    const data = await postJsonWithTimeout(getProcessUrl(), payload, 20000);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('NLP processor timeout');
      timeoutErr.status = 504;
      return next(timeoutErr);
    }
    return next(err);
  }
}

