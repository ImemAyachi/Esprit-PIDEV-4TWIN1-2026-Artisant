import { callLocalLLM } from '../utils/aiClient.js';
import { callCloudAI } from '../utils/cloudAiClient.js';
import Product from '../models/Product.model.js';
import ChatSession from '../models/ChatSession.model.js';
import fs from 'fs';
import path from 'path';

// Load Expert BTP Knowledge (Safely)
let btpKnowledge = {};
try {
  const filePath = path.join(process.cwd(), '..', 'ml', 'dataset', 'btp_knowledge_tn.json');
  btpKnowledge = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (e) {
  console.error("Failed to load knowledge base:", e.message);
}

const SYSTEM_PROMPT = `You are ArtiChat, an ELITE construction AI expert for Artisanet BuildMarket (Tunisia).
KNOWLEDGE BASE:
${JSON.stringify(btpKnowledge, null, 2)}

CORE RULES:
1. You provide technical and financial advice for construction in Tunisia.
2. 1 Malyoun = 1000 TND. Budget 200 Malyoun = 200,000 TND.
3. For large budgets (like 200M), explain phases: Foundation, Gros Œuvre, Finition.
4. Always suggest relevant products from our Catalog.
5. Use natural Tunisian Arabizi/Darija (e.g., 'mrigla', 'bch', 'famma', 'lhne').

PLATFORM NAVIGATION:
- Catalog: Dashboard -> Catalog
- Quotes: Dashboard -> Quotes -> Add
- Projects: Dashboard -> Projects -> Add
- Artisans: Dashboard -> Artisans

Be precise, expert, and never repeat the same generic intro.`;

/**
 * Optimized Chat Controller
 */
export const chat = async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const userText = messages[messages.length - 1]?.parts?.[0]?.text || "";

    // 1. Contextual Product Retrieval
    let recommendations = [];
    try {
      recommendations = await Product.find({
        $text: { $search: userText },
        isAvailable: true
      }).limit(3).lean();
    } catch (e) { /* ignore search errors */ }

    const recContext = recommendations.length > 0
      ? `Catalog Highlights: ${recommendations.map(r => `${r.name} (${r.price} ${r.priceUnit})`).join(', ')}`
      : "No specific products found for this query in catalog.";

    // 2. Persistent Memory Management
    let session = await ChatSession.findOne({ user: userId });
    if (!session) {
      session = await ChatSession.create({
        user: userId,
        turns: [{ role: 'system', content: SYSTEM_PROMPT }]
      });
    }

    // 3. Prompt Construction
    const promptMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...session.turns.slice(-12).map(t => ({ role: t.role, content: t.content })),
      { role: 'user', content: `${userText} (Grounding Context: ${recContext})` }
    ];

    // 4. Multi-Provider AI Execution
    let reply = "";
    let provider = "cloud-ai";

    try {
      console.log(`[Chat] Calling Cloud AI for: ${userText.slice(0, 30)}...`);
      reply = await callCloudAI(promptMessages, { temperature: 0.7 });
    } catch (e) {
      console.error("[Chat] Cloud AI failed, falling back to local:", e.message);
      provider = "local-ai";
      try {
        reply = await callLocalLLM(promptMessages, { temperature: 0.6 });
      } catch (e2) {
        console.error("[Chat] Local AI also failed:", e2.message);
        provider = "fallback-expert";
        reply = "Sama7ni, famech mouchkla techinque sghira. Ama lel budget mte3ek, nenshek tatleb **Devis** mel les experts mte3na fi Dashboard -> Quotes.";
      }
    }

    if (!reply) reply = "Nnajem n3awnek fi ay 7aja tkhoss el chantiers walla el matériaux. Chnowa t7eb ta3ref?";

    // 5. Save and Return
    session.turns.push({ role: 'user', content: userText });
    session.turns.push({ role: 'assistant', content: reply });

    // Keep turns history bounded
    if (session.turns.length > 20) session.turns = session.turns.slice(-20);

    await session.save();

    return res.json({
      reply,
      provider,
      recommendations: recommendations.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        category: p.category
      }))
    });

  } catch (err) {
    console.error('[Chat Error]:', err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
