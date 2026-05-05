import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { callHuggingFaceFloorplanLora } from '../services/huggingfaceFloorplanLora.js';
import { translateToLoraPrompt } from '../services/loraPromptTranslator.js';
import { callLocalDiffusionService, checkLocalDiffusionHealth } from '../services/localDiffusionClient.js';

function getHfToken() {
  return String(process.env.HUGGINGFACE_API_TOKEN || process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || '').trim();
}

export const generateVisualFloorplan = asyncHandler(async (req, res) => {
  const raw = typeof req.body?.input === 'string' ? req.body.input : '';
  const input = String(raw || '').trim();
  if (!input) throw new AppError('Champ "input" manquant ou vide.', 400);

  // Translate prompt into the LoRA trigger sentence (heuristic fallback if LLM is unavailable).
  const loraPrompt = await translateToLoraPrompt({ userPrompt: input });

  const steps = Number(req.body?.steps) || 30;
  const width = Number(req.body?.width) || 512;
  const height = Number(req.body?.height) || 512;
  const guidance = Number(req.body?.guidance_scale) || 7.5;

  // Priority:
  // 1) Local microservice (offline/private)
  // 2) HuggingFace endpoint (if configured)
  const localUrl = String(process.env.DIFFUSION_SERVICE_URL || '').trim();
  if (localUrl) {
    const health = await checkLocalDiffusionHealth({ url: localUrl }).catch(() => ({ ok: false }));
    if (health?.ok) {
      try {
        const out = await callLocalDiffusionService({ url: localUrl, prompt: loraPrompt, steps, width, height, guidance, timeoutMs: 90_000 });
        return res.status(200).json({
          success: true,
          data: { image: out.image, loraPrompt, provider: 'local_diffusion', device: out.device || null, model: 'maria26/Floor_Plan_LoRA' },
        });
      } catch (e) {
        // fall through to HF
      }
    }
  }

  const token = getHfToken();
  if (!token) {
    throw new AppError(
      'Génération visuelle indisponible. Configurez DIFFUSION_SERVICE_URL (local) ou HUGGINGFACE_API_TOKEN + HF_FLOORPLAN_ENDPOINT_URL (HF).',
      400
    );
  }
  try {
    const out = await callHuggingFaceFloorplanLora({ token, prompt: loraPrompt, steps, guidance, width, height, timeoutMs: 90_000 });
    return res.status(200).json({
      success: true,
      data: { image: out.image, loraPrompt, provider: 'huggingface_endpoint', model: 'maria26/Floor_Plan_LoRA' },
    });
  } catch (e) {
    const msg = String(e?.message || e);
    const isRate = msg.includes('hf_rate_limited_429') || msg.includes('429');
    const isLoading = msg.includes('hf_model_loading_503') || msg.includes('503');
    const status = isRate ? 429 : isLoading ? 503 : 502;
    throw new AppError(`Génération visuelle HF échouée: ${msg.slice(0, 220)}`, status);
  }
});

