import Groq from 'groq-sdk';
import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

// Robust JSON parser — handles common AI output issues
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

// Small delay to avoid per-minute token rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


//utilisation de l'api groq
const callAgent = async (agentName, systemPrompt, userContent, maxTokens = 1200) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const res = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.1,
    max_tokens: maxTokens,
  });
  const raw = res.choices[0]?.message?.content || '{}';
  const parsed = safeParseJson(raw);
  if (!parsed) {
    console.warn(`[${agentName}] JSON parse failed. Snippet:`, raw.substring(0, 150));
  }
  return parsed;
};

/**
 * POST /api/ai/chantier-brain
 * Multi-Agent Construction Intelligence Engine — 5 specialized agents in chain
 * Every agent is non-fatal: if it fails, we use a sensible default and continue.
 */
export const runChantierBrain = asyncHandler(async (req, res) => {
  const { projectDescription, budget, location } = req.body;
  if (!projectDescription) throw new AppError('Description du projet requise.', 400);

  // STAGE 0: Robust Validation (Block repetitive nonsense or very short)
  const desc = projectDescription.trim();
  const repeatedRegex = /(.)\1{4,}/; // Blocks "aaaaa", ".....", etc.
  if (desc.length < 8 || repeatedRegex.test(desc) || desc.toLowerCase() === 'test test') {
    throw new AppError('Description incohérente ou trop répétitive. Veuillez fournir un projet réel.', 400);
  }

  const ctx = { projectDescription, budget, location: location || 'Tunisie' };

  // ── AGENT 1 — Architect Brain ─────────────────────────────────────────────
  console.log('[Brain] 🔍 Agent 1: Architect Brain running...');
  let agent1 = { projectType: 'Projet BTP', totalArea: 'N/A', phases: [], structuralNotes: '', complexity: 'Modéré', isConsistent: true };
  try {
    const a1 = await callAgent(
      'Architect Brain',
      `Tu es un architecte expert BTP tunisien. 
Évalue si la description du projet est techniquement logique et cohérente pour le domaine du BTP.
Si la description est du texte aléatoire, des mots sans rapport avec la construction (ex: "manger pomme"), ou trop vague pour être un projet (ex: "je veux faire un test"), réponds avec "isConsistent": false.

Réponds UNIQUEMENT en JSON valide:
{
  "isConsistent": true,
  "projectType": "Villa R+1",
  "totalArea": "180m²",
  "phases": [
    { "name": "Phase Name", "description": "...", "durationWeeks": 4, "order": 1, "keyMaterials": ["..."] }
  ],
  "structuralNotes": "Note...",
  "complexity": "Simple"
}`,
      `Projet: ${ctx.projectDescription}\nBudget: ${ctx.budget || 'Non précisé'} DT\nLocalisation: ${ctx.location}`
    );

    if (a1 && a1.isConsistent === false) {
      return res.status(200).json({
        success: false,
        message: 'L\'IA détecte une description incohérente ou hors contexte BTP. Veuillez préciser votre besoin technique.'
      });
    }

    if (a1 && Array.isArray(a1.phases) && a1.phases.length > 0) agent1 = a1;
  } catch (err) { console.error('[Brain] Agent 1 non-fatal:', err.message); }




  await sleep(800);

  // ── AGENT 2 — Cost Intelligence ───────────────────────────────────────────
  console.log('[Brain] 💰 Agent 2: Cost Intelligence running...');
  const allMaterials = agent1.phases.flatMap(p => p.keyMaterials || []);
  const searchQuery = [...new Set(allMaterials)].slice(0, 5).join(' ');
  let realProducts = [];
  try {
    if (searchQuery) {
      realProducts = await Product.find({ $text: { $search: searchQuery } })
        .limit(5).select('name price category unit').lean();
    }
  } catch (_) { }

  let agent2 = { totalEstimatedCost: 0, breakdown: [], budgetFeasibility: 'Non calculé', budgetGapDT: 0, savingsTips: [] };
  try {
    const a2 = await callAgent(
      'Cost Intelligence',
      `Tu es un économiste BTP tunisien. Estime les coûts en Dinars Tunisiens (DT).
RÈGLE: budgetGapDT = nombre calculé uniquement (ex: -28500). JAMAIS une expression mathématique.
Réponds UNIQUEMENT en JSON valide:
{
  "totalEstimatedCost": 125000,
  "breakdown": [
    { "category": "Gros Oeuvre", "items": [{ "name": "Béton", "qty": "15m³", "unitPrice": 280, "total": 4200 }], "subtotal": 4200 }
  ],
  "laborCostEstimate": 35000,
  "materialCostEstimate": 90000,
  "budgetFeasibility": "Réalisable",
  "budgetGapDT": -5000,
  "savingsTips": ["Conseil 1"]
}`,
      `Projet: ${JSON.stringify({ type: agent1.projectType, phases: agent1.phases.map(p => p.name), complexity: agent1.complexity })}
Budget client: ${ctx.budget || 'Non précisé'} DT
Produits marketplace: ${JSON.stringify(realProducts.map(p => ({ name: p.name, price: p.price })))}`
    );
    if (a2) agent2 = { ...agent2, ...a2 };
  } catch (err) { console.error('[Brain] Agent 2 non-fatal:', err.message); }

  await sleep(800);


  // ── AGENT 3 — Risk Predictor ──────────────────────────────────────────────
  console.log('[Brain] ⚠️  Agent 3: Risk Predictor running...');
  let agent3 = { riskScore: 50, riskLevel: 'Modéré', risks: [], regulatoryRequirements: [], criticalWarning: null };
  try {
    const a3 = await callAgent(
      'Risk Predictor',
      `Tu es un expert risques BTP en Tunisie. Identifie les risques du projet.
Réponds UNIQUEMENT en JSON valide:
{
  "riskScore": 72,
  "riskLevel": "Modéré",
  "risks": [
    { "category": "Financier", "title": "Titre", "description": "Desc", "severity": "Moyen", "probability": "Probable", "mitigation": "Action" }
  ],
  "regulatoryRequirements": ["Permis de construire requis"],
  "criticalWarning": null
}`,
      `Projet: ${agent1.projectType} — ${agent1.complexity}
Phases: ${agent1.phases.map(p => p.name).join(', ')}
Coût estimé: ${agent2.totalEstimatedCost} DT — Faisabilité: ${agent2.budgetFeasibility}
Localisation: ${ctx.location}`
    );
    if (a3) agent3 = { ...agent3, ...a3 };
  } catch (err) { console.error('[Brain] Agent 3 non-fatal:', err.message); }

  await sleep(800);


  // ── AGENT 4 — Smart Team Builder ──────────────────────────────────────────
  console.log('[Brain] 👷 Agent 4: Smart Team Builder running...');

  // Infer crafts from phases + project description (no extra API call)
  const fullText = (JSON.stringify(agent1.phases) + ' ' + projectDescription).toLowerCase();
  const craftMap = {
    'maçon': ['mur', 'béton', 'fondation', 'gros oeuvre', 'brique', 'extension', 'construction'],
    'plombier': ['plomb', 'tuyau', 'sanitaire', 'eau', 'salle de bain', 'wc', 'cuisine'],
    'électricien': ['électr', 'câble', 'tableau', 'prises', 'éclairage', 'spot', 'led', 'réseau', 'rj45', 'clim'],
    'peintre': ['peint', 'enduit', 'peinture'],
    'carreleur': ['carrelage', 'faïence', 'sol', 'grès', 'cérame'],
    'menuisier': ['porte', 'fenêtre', 'menuiserie', 'parquet', 'vitré'],
  };
  const craftsNeeded = Object.entries(craftMap)
    .filter(([, kws]) => kws.some(kw => fullText.includes(kw)))
    .map(([craft]) => craft);
  if (craftsNeeded.length === 0) craftsNeeded.push('maçon');

  let realArtisans = [];
  try {
    realArtisans = await User.find({ role: 'Artisan', isActive: true, craft: { $in: craftsNeeded } })
      .limit(6).select('firstName lastName craft rating location experience').lean();
  } catch (_) { }

  let agent4 = { teamStructure: [], totalLaborDays: 0, teamCoordination: '' };
  try {
    const a4 = await callAgent(
      'Team Builder',
      `Tu es un chef de projet BTP. Compose l'équipe idéale.
Réponds UNIQUEMENT en JSON valide:
{
  "teamStructure": [
    { "role": "Maçon Principal", "craft": "maçon", "quantity": 2, "estimatedDays": 30, "dailyRate": 120, "totalCost": 7200 }
  ],
  "totalLaborDays": 60,
  "teamCoordination": "Conseil de coordination"
}`,
      `Phases: ${agent1.phases.map(p => p.name).join(', ')}
Crafts nécessaires: ${JSON.stringify(craftsNeeded)}
Artisans dispo: ${JSON.stringify(realArtisans.map(a => ({ craft: a.craft, name: a.firstName })))}`
    );
    if (a4 && Array.isArray(a4.teamStructure)) agent4 = a4;
  } catch (err) { console.error('[Brain] Agent 4 non-fatal:', err.message); }

  await sleep(800);


  // Case-insensitive partial craft match (AI may return "Maçon Principal" vs DB "maçon")
  const matchCraft = (memberCraft, artisanCraft) => {
    if (!memberCraft || !artisanCraft) return false;
    const m = memberCraft.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const a = artisanCraft.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return m.includes(a) || a.includes(m);
  };
  const enrichedTeam = (agent4.teamStructure || []).map(member => ({
    ...member,
    realArtisan: realArtisans.find(a => matchCraft(member.craft, a.craft)) || null,
  }));

  // ── AGENT 5 — Timeline Architect ──────────────────────────────────────────
  console.log('[Brain] 📅 Agent 5: Timeline Architect running...');
  const phaseSummary = agent1.phases.map(p => `${p.order}:${p.name}(${p.durationWeeks}sem)`).join(', ');
  // Compute duration from agent1 phases as a reliable fallback
  const computedDurationWeeks = agent1.phases.reduce((s, p) => s + (p.durationWeeks || 0), 0);
  let agent5 = { totalDurationWeeks: computedDurationWeeks, startRecommendation: '', weeks: [], criticalPath: [] };

  try {
    const a5 = await callAgent(
      'Timeline Architect',
      `Tu es un planificateur BTP tunisien expert. Crée un planning spécifique au type de projet.
RÈGLES:
- N'utilise JAMAIS le mot "site" — utilise le vrai contexte (ex: "salle de bain", "appartement", "bureau", "villa"...)
- Tâches précises et adaptées au projet
- Exactement 5 semaines représentatives
- Chaque semaine : maximum 2 tâches courtes, 1 matériau max
JSON requis (compact):
{
  "totalDurationWeeks": 8,
  "startRecommendation": "Conseil court",
  "weeks": [
    { "weekNumber": 1, "phase": "Nom", "tasks": ["Tâche 1", "Tâche 2"], "materialsToOrder": ["Matériau"], "milestone": null }
  ],
  "criticalPath": ["Phase critique"]
}`,
      `Type de projet: ${agent1.projectType}
Phases: ${phaseSummary}
Durée totale: ${agent1.phases.reduce((s, p) => s + (p.durationWeeks || 0), 0) || 8} semaines`,
      2000  // Planning needs more tokens to generate full weekly breakdown
    );
    if (a5 && Array.isArray(a5.weeks) && a5.weeks.length > 0) agent5 = a5;
  } catch (err) { console.error('[Brain] Agent 5 non-fatal:', err.message); }

  // ── FINAL ASSEMBLY ────────────────────────────────────────────────────────
  console.log('[Brain] ✅ All agents complete. Sending report...');
  res.status(200).json({
    success: true,
    report: {
      meta: { projectDescription, location: ctx.location, budget: ctx.budget, generatedAt: new Date().toISOString() },
      architectBrain: agent1,
      costIntelligence: { ...agent2, realProductsFound: realProducts },
      riskAnalysis: agent3,
      teamBuilder: { ...agent4, teamStructure: enrichedTeam },
      timeline: agent5,
    },
  });
});
