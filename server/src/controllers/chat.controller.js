import { GoogleGenerativeAI } from '@google/generative-ai';
 
const SYSTEM_PROMPT = `You are BatiBot2, an interactive construction assistant for Tunisian users.

Your role is to help users with anything related to:
- Construction products and renovation decisions
- Artisanet/BuildMarket platform guidance
- Practical next steps for projects, materials and tools

Rules:
- Always answer with useful, actionable information.
- Never answer with a generic refusal like "give me more details" only.
- If the user query is broad, still provide a short concrete starter recommendation and then ask 1 follow-up question.
- Match the user language (Arabic/French/English/Tunisian derja when possible).
- Keep responses concise, natural, and interactive.`;

function buildGuaranteedFallback(userText) {
  const t = String(userText || '').trim();
  if (!t) {
    return 'Marhbe bik! Nnajjem n3awnek b choix produits, budget, w plan de travaux. Chnowa hachtek tawa?';
  }

  return `Fhemt 3lik 3la "${t}". Bch نبداو عمليًا: ikhtar catégorie (peinture, plomberie, carrelage, ciment) w na3tik options mli7a + budget tips مباشرة.`;
}

/**
 * POST /api/chat
 * Body: { messages: [{role: 'user'|'model', parts: [{text: string}]}] }
 */
export const chat = async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      const last = messages[messages.length - 1]?.parts?.[0]?.text || '';
      return res.json({ reply: buildGuaranteedFallback(last), provider: 'fallback_no_key' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    // Build chat history from UI messages
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role,
      parts: Array.isArray(msg.parts) ? msg.parts : [],
    }));

    const chatSession = model.startChat({ history });

    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.parts?.[0]?.text || '';
    if (!userText.trim()) {
      return res.json({ reply: buildGuaranteedFallback(userText), provider: 'fallback_empty' });
    }

    const result = await chatSession.sendMessage(userText);
    const responseText = String(result?.response?.text?.() || '').trim();

    if (!responseText) {
      return res.json({ reply: buildGuaranteedFallback(userText), provider: 'fallback_empty_ai' });
    }

    return res.json({ reply: responseText, provider: 'gemini' });
  } catch (err) {
    console.error('Chat error:', err.message);
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const last = messages[messages.length - 1]?.parts?.[0]?.text || '';
    return res.json({ reply: buildGuaranteedFallback(last), provider: 'fallback_error' });
  }
};
