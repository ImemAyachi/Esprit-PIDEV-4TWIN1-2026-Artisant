import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateLocalPlan } from '../utils/localProjectPlanner.js';

const MAX_INPUT_LENGTH = 8000;

const CACHE_TTL_MS = Number(process.env.AI_CACHE_TTL_MS) || 5 * 60_000;
const CACHE_MAX = Number(process.env.AI_CACHE_MAX) || 200;
/** @type {Map<string, { at: number, data: any }>} */
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key, data) {
  if (!key) return;
  cache.set(key, { at: Date.now(), data });
  if (cache.size <= CACHE_MAX) return;
  const firstKey = cache.keys().next().value;
  if (firstKey) cache.delete(firstKey);
}

const CONSULTANT_SYSTEM =
  'Tu es un consultant expert en production industrielle pour une plateforme artisanale (Tunisie, français). ' +
  'Chaque plan doit être spécifique à la demande—jamais de texte générique ou passe-partout. ' +
  'Coûts: dinar tunisien uniquement (ex. « 2 500 – 3 800 DT »). ' +
  'Sortie: JSON pur uniquement.';

function buildUserPrompt(input) {
  return `${CONSULTANT_SYSTEM}
  
ENTRÉE UTILISATEUR:
${input}

RETOUNE UN OBJET JSON VALIDE AVEC CES CLÉS:
{
  "category": "catégorie du projet",
  "materials": ["liste des matériaux concrets"],
  "experts": ["liste des métiers requis"],
  "estimatedTime": "délai estimé (ex: 3 semaines)",
  "estimatedCost": "coût estimé en DT (ex: 1500 - 2000 DT)",
  "steps": ["étapes précises de fabrication"],
  "reasoning": "pourquoi ces choix",
  "insights": ["3-5 conseils techniques concrets"],
  "risks": ["3-5 risques avec solutions"],
  "optimizations": ["3-5 astuces productivité"]
}`;
}

// Configuration Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" }
});

export async function createProjectPlan(req, res) {
  const raw = req.body?.input || req.body?.description || '';
  const input = String(raw).trim();

  if (!input) return res.status(400).json({ success: false, message: 'Entrée vide.' });
  if (input.length > MAX_INPUT_LENGTH) return res.status(400).json({ success: false, message: 'Texte trop long.' });

  try {
    const cacheKey = `gemini:plan:${input}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached, meta: { cached: true } });

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY manquant');
    }

    const result = await model.generateContent(buildUserPrompt(input));
    const response = await result.response;
    const text = response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Gemini JSON parse error:", text);
      throw new Error("Réponse AI invalide");
    }

    cacheSet(cacheKey, data);
    return res.status(200).json({ success: true, data });

  } catch (err) {
    console.error("AI Project Plan Error:", err);
    
    // Fallback local en cas d'erreur API
    if (process.env.AI_FALLBACK_LOCAL === 'true') {
      const data = generateLocalPlan(input);
      return res.status(200).json({ success: true, data, meta: { fallback: 'local' } });
    }

    return res.status(502).json({
      success: false,
      message: err.message || 'Échec génération du plan par l\'IA.',
    });
  }
}
