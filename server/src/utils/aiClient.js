import OpenAI from 'openai';

/**
 * Unified Local LLM Client
 * Supports:
 * - ollama (native /api/chat endpoint, no cloud API key)
 * - huggingface (HF router OpenAI-compatible chat endpoint)
 * - openai_compat (OpenAI-compatible local servers)
 */

const provider = String(process.env.LOCAL_LLM_PROVIDER || 'ollama').trim().toLowerCase();
const localBase = String(process.env.LOCAL_LLM_BASE_URL || 'http://127.0.0.1:11434').trim().replace(/\/$/, '');
const localModel = String(process.env.LOCAL_LLM_MODEL || 'qwen2.5:7b-instruct').trim();
const timeoutMs = Number(process.env.LOCAL_LLM_TIMEOUT_MS) || 60_000;
const hfBase = String(process.env.HF_LLM_BASE_URL || 'https://router.huggingface.co/v1').trim().replace(/\/$/, '');

const openAiCompatClient = new OpenAI({
  apiKey: process.env.LOCAL_LLM_API_KEY || 'local',
  baseURL: `${localBase}/v1`,
  timeout: timeoutMs,
  maxRetries: 1,
});

const huggingFaceClient = new OpenAI({
  apiKey: process.env.HF_LLM_API_KEY || process.env.LOCAL_LLM_API_KEY || '',
  baseURL: hfBase,
  timeout: timeoutMs,
  maxRetries: 1,
});

const toOllamaMessages = (messages = []) =>
  messages
    .map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : (m?.role || 'user'),
      content: String(m?.content || '').trim(),
    }))
    .filter((m) => m.content);

/**
 * Calls the local LLM with the given messages.
 * @param {Array} messages - Array of {role, content} objects.
 * @param {Object} options - Additional OpenAI completion options (temperature, max_tokens, etc.)
 */
export const callLocalLLM = async (messages, options = {}) => {
  try {
    if (provider === 'ollama') {
      const res = await fetch(`${localBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: localModel,
          messages: toOllamaMessages(messages),
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Ollama error (HTTP ${res.status})`);
      }

      return data?.message?.content?.trim() || null;
    }

    if (provider === 'huggingface') {
      const hfKey = process.env.HF_LLM_API_KEY || process.env.LOCAL_LLM_API_KEY;
      if (!hfKey) {
        throw new Error('HF_LLM_API_KEY is required when LOCAL_LLM_PROVIDER=huggingface');
      }

      const completion = await huggingFaceClient.chat.completions.create({
        model: localModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
        response_format: options.response_format,
      });
      return completion.choices?.[0]?.message?.content?.trim() || null;
    }

    const completion = await openAiCompatClient.chat.completions.create({
      model: localModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens,
      response_format: options.response_format,
    });

    return completion.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('[LocalLLM] Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('[LocalLLM] Local inference server not found. Is it running on', localBase, '?');
    }
    throw error;
  }
};

export default {
  callLocalLLM,
  model: localModel,
  provider,
};
