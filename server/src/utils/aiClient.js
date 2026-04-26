import OpenAI from 'openai';

/**
 * Unified Local LLM Client
 * Centralizes all AI calls to the local inference server (Ollama/llama.cpp).
 */

const localBase = String(process.env.LOCAL_LLM_BASE_URL || 'http://127.0.0.1:11434/v1').trim().replace(/\/$/, '');
const localModel = String(process.env.LOCAL_LLM_MODEL || 'artichat').trim();

const client = new OpenAI({
  apiKey: process.env.LOCAL_LLM_API_KEY || 'local',
  baseURL: localBase,
  timeout: Number(process.env.LOCAL_LLM_TIMEOUT_MS) || 60_000,
  maxRetries: 1,
});

/**
 * Calls the local LLM with the given messages.
 * @param {Array} messages - Array of {role, content} objects.
 * @param {Object} options - Additional OpenAI completion options (temperature, max_tokens, etc.)
 */
export const callLocalLLM = async (messages, options = {}) => {
  try {
    const completion = await client.chat.completions.create({
      model: localModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens,
      response_format: options.response_format,
    });

    return completion.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('[LocalLLM] Error:', error.message);
    // If it's a connection error, we might want to log more details
    if (error.code === 'ECONNREFUSED') {
      console.error('[LocalLLM] Local inference server not found. Is it running?');
    }
    throw error;
  }
};

export default {
  callLocalLLM,
  model: localModel,
};
