import Groq from 'groq-sdk';
import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { AGENT_PROMPTS } from '../utils/aiPrompts.js';

// --- Helpers & Utils ---

/**
 * Robust JSON parser — handles common AI output issues
 */
const safeParseJson = (raw) => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let str = match[0];
  try {
    return JSON.parse(str);
  } catch (_) {
    str = str
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
    try { return JSON.parse(str); } catch (_2) { return null; }
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callAgent = async (agentConfig, userContent, maxTokens = 1200) => {
  const { name, system } = agentConfig;
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      max_tokens: maxTokens,
    });

    const raw = res.choices[0]?.message?.content || '{}';
    const parsed = safeParseJson(raw);
    
    if (!parsed) {
      console.warn(`[${name}] JSON parse failed. Snippet:`, raw.substring(0, 150));
    }
    return parsed;
  } catch (error) {
    console.error(`[${name}] Execution failed:`, error.message);
    return null;
  }
};

// --- Specialized Agent Logic ---

const getArtisanTeam = async (craftsNeeded) => {
  try {
    return await User.find({ role: 'Artisan', isActive: true, craft: { $in: craftsNeeded } })
      .limit(6).select('firstName lastName craft rating location experience').lean();
  } catch (error) {
    console.error('Error fetching artisans:', error.message);
    return [];
  }
};

const getMarketplaceProducts = async (materials) => {
  try {
    const searchQuery = [...new Set(materials)].slice(0, 5).join(' ');
    if (!searchQuery) return [];
    return await Product.find({ $text: { $search: searchQuery } })
      .limit(5).select('name price category unit').lean();
  } catch (error) {
    console.error('Error fetching products:', error.message);
    return [];
  }
};

// --- Main Controller ---

export const runChantierBrain = asyncHandler(async (req, res) => {
  const { projectDescription, budget, location } = req.body;
  
  if (!projectDescription) throw new AppError('Description du projet requise.', 400);

  // Validation
  const desc = projectDescription.trim();
  if (desc.length < 8 || /(.)\1{4,}/.test(desc) || desc.toLowerCase() === 'test test') {
    throw new AppError('Description incohérente ou invalide.', 400);
  }

  const ctx = { projectDescription, budget, location: location || 'Tunisie' };

  // AGENT 1: Architect
  const architectResult = await callAgent(AGENT_PROMPTS.ARCHITECT, `Projet: ${ctx.projectDescription}\nBudget: ${ctx.budget || 'Non précisé'} DT`);
  if (architectResult?.isConsistent === false) {
    return res.status(200).json({ success: false, message: 'Description incohérente détectée par l\'IA.' });
  }
  const agent1 = architectResult || { projectType: 'Projet BTP', phases: [], complexity: 'Modéré' };

  await sleep(400);

  // AGENT 2: Cost
  const materials = agent1.phases.flatMap(p => p.keyMaterials || []);
  const products = await getMarketplaceProducts(materials);
  // On cache volontairement le budget au Cost Agent pour qu'il ne le copie pas !
  const agent2 = await callAgent(AGENT_PROMPTS.COST, `Projet: ${JSON.stringify(agent1)}\nProduits: ${JSON.stringify(products)}`) || {};

  await sleep(400);

  // AGENT 3: Risk
  // On donne le vrai budget et le coût estimé à l'Agent de Risque
  const agent3 = await callAgent(AGENT_PROMPTS.RISK, `Projet: ${agent1.projectType}\nCoût Estimé: ${agent2.totalEstimatedCost} DT\nBudget Client: ${ctx.budget} DT`) || {};

  await sleep(400);

  // AGENT 4: Team
  const craftMap = { 'maçon': ['mur', 'béton'], 'plombier': ['eau', 'wc'], 'électricien': ['électr', 'câble'] };
  const craftsNeeded = Object.entries(craftMap).filter(([, kws]) => kws.some(kw => desc.toLowerCase().includes(kw))).map(([c]) => c);
  const artisans = await getArtisanTeam(craftsNeeded.length ? craftsNeeded : ['maçon']);
  const agent4 = await callAgent(AGENT_PROMPTS.TEAM, `Phases: ${JSON.stringify(agent1.phases)}\nArtisans: ${JSON.stringify(artisans)}`) || {};

  await sleep(400);

  // AGENT 5: Timeline
  const agent5 = await callAgent(AGENT_PROMPTS.TIMELINE, `Type: ${agent1.projectType}\nPhases: ${JSON.stringify(agent1.phases)}`, 30000) || {};

  // Response
  res.status(200).json({
    success: true,
    report: {
      meta: { ...ctx, generatedAt: new Date().toISOString() },
      architectBrain: agent1,
      costIntelligence: { ...agent2, realProductsFound: products },
      riskAnalysis: agent3,
      teamBuilder: agent4,
      timeline: agent5,
    },
  });
});
