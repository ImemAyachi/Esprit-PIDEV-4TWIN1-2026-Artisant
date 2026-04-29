import { callLocalLLM } from "../utils/aiClient.js";
import { callCloudAI } from "../utils/cloudAiClient.js";
import Product from "../models/Product.model.js";

export const recommendProducts = async (req, res) => {
  console.log(`[AI] Recommend request received: "${req.body?.need}"`);
  try {
    const { need, nlp } = req.body;
    if (!need) return res.status(400).json({ success: false, message: "Le besoin est requis" });

    const normalizeText = (s) =>
      String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const canonicalizeNeed = (raw) => {
      const t = normalizeText(raw);
      const replacements = [
        [/\br5am\b/g, 'marbre'],
        [/\brkham\b/g, 'marbre'],
        [/\bfayones\b/g, 'faience'],
        [/\bfayence\b/g, 'faience'],
        [/\bfaiences\b/g, 'faience'],
        [/\bkoujina\b/g, 'cuisine'],
        [/\bkawjina\b/g, 'cuisine'],
        [/\b7ammem\b/g, 'salle de bain'],
        [/\bhammem\b/g, 'salle de bain'],
        [/\btoilette\b/g, 'salle de bain'],
        [/\btoilet\b/g, 'salle de bain'],
        [/\btwalet\b/g, 'salle de bain'],
        [/\btwilet\b/g, 'salle de bain'],
        [/\bwc\b/g, 'salle de bain'],
        [/\barkhes\b/g, 'pas cher'],
        [/\barkhess\b/g, 'pas cher'],
        [/\brkhis\b/g, 'pas cher'],
        [/\baghla\b/g, 'cher'],
        [/\bghali\b/g, 'cher'],
        [/\bjnina\b/g, 'jardin'],
        [/\bgardin\b/g, 'jardin'],
        [/\bdar\b/g, 'maison'],
        [/\bnbni\b/g, 'construction'],
        [/\bbina\b/g, 'construction'],
        [/\btabni\b/g, 'construction'],
      ];
      let out = t;
      for (const [pattern, value] of replacements) {
        out = out.replace(pattern, value);
      }
      return out;
    };

    const intentProfiles = {
      garden: {
        triggers: ['jardin', 'terrasse', 'exterieur', 'extérieur', 'amenagement', 'amenagement exterieur'],
        // Keep exterior-oriented materials first for "jnina/terrasse" use-cases.
        categories: ['ciment', 'sable', 'brique', 'acier'],
        positiveTerms: ['terrasse', 'dalle', 'sol', 'bordure', 'facade', 'jardin', 'exterieur', 'gravier', 'pave', 'beton'],
        negativeTerms: ['robinet', 'evier', 'mitigeur', 'wc', 'lavabo', 'mdf', 'interieur', 'murale', 'satin'],
      },
      house_build: {
        triggers: ['construction maison', 'construction', 'maison', 'fondation', 'beton', 'béton', 'dalle', 'gros oeuvre', 'gros œuvre'],
        categories: ['ciment', 'sable', 'brique', 'acier', 'bois', 'peinture'],
        positiveTerms: ['fondation', 'beton', 'dalle', 'mur', 'maison', 'construction'],
        negativeTerms: ['robinet', 'evier', 'mitigeur'],
      },
      kitchen: {
        triggers: ['cuisine', 'kitchen', 'koujina', 'kawjina', 'evier', 'évier', 'robinet', 'mitigeur'],
        categories: ['plomberie', 'électricité', 'carrelage', 'bois', 'peinture', 'autre'],
        positiveTerms: ['cuisine', 'evier', 'mitigeur', 'carrelage', 'meuble'],
        negativeTerms: [],
      },
      bathroom: {
        triggers: ['salle de bain', 'bathroom', 'hammem', '7ammem', 'douche', 'wc'],
        categories: ['plomberie', 'carrelage', 'peinture', 'verre', 'autre'],
        positiveTerms: ['douche', 'wc', 'lavabo', 'carrelage', 'salle de bain'],
        negativeTerms: [],
      },
      tools: {
        triggers: ['outil', 'outils', 'tools', 'materiel', 'matériel', 'hardware'],
        categories: ['plomberie', 'électricité', 'autre', 'bois'],
        positiveTerms: ['outil', 'materiel', 'equipement'],
        negativeTerms: [],
      },
      cheap: {
        triggers: ['pas cher', 'cheap', 'economique', 'économique', 'bon prix', 'prix bas', 'budget', 'arkhess', 'arkhes', 'rkhis', '9lil soum'],
        categories: [],
        positiveTerms: ['pas cher', 'cheap', 'economique', 'budget', 'prix'],
        negativeTerms: [],
      },
      expensive: {
        triggers: ['cher', 'premium', 'haut de gamme', 'luxury', 'aghla', 'ghali'],
        categories: [],
        positiveTerms: ['cher', 'premium', 'haut de gamme', 'luxury'],
        negativeTerms: [],
      },
      marbre: {
        triggers: ['marbre', 'r5am', 'rkham', 'granite'],
        categories: ['marbre', 'carrelage', 'verre'],
        positiveTerms: ['marbre', 'granite', 'carrare', 'slab', 'faience'],
        negativeTerms: ['robinet', 'evier', 'mitigeur'],
      },
      faience: {
        triggers: ['faience', 'fayones', 'carrelage', 'carreler'],
        categories: ['carrelage', 'marbre', 'verre'],
        positiveTerms: ['faience', 'carrelage', 'gres', 'cerame', 'murale', 'sol'],
        negativeTerms: ['robinet', 'mitigeur'],
      },
    };

    const inferIntentProfile = (text) => {
      const t = canonicalizeNeed(text);
      const has = (arr) => arr.some((x) => t.includes(normalizeText(x)));

      for (const [key, profile] of Object.entries(intentProfiles)) {
        if (has(profile.triggers)) {
          return { key, ...profile };
        }
      }
      return null;
    };

    const dedupeProducts = (products) => {
      const map = new Map();
      for (const p of products || []) {
        const key = `${normalizeText(p?.name)}|${normalizeText(p?.category)}`;
        const prev = map.get(key);
        // Keep the cheaper product when duplicate titles exist
        if (!prev || Number(p?.price || Infinity) < Number(prev?.price || Infinity)) {
          map.set(key, p);
        }
      }
      return Array.from(map.values());
    };

    const enrichProduct = (p) => ({
      ...p,
      mainImage: p.media?.[0]?.url || 'https://loremflickr.com/800/600/construction'
    });

    const toGroupedResponse = (products, advice) => {
      const grouped = {};
      for (const p of products || []) {
        const cat = p.category || 'Autre';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(enrichProduct(p));
      }
      return Object.entries(grouped).map(([cat, items]) => ({
        title: cat.charAt(0).toUpperCase() + cat.slice(1),
        advice,
        products: items,
      }));
    };

    const effectiveNeed = (
      nlp &&
      typeof nlp.corrected_text === 'string' &&
      nlp.corrected_text.trim()
    ) ? nlp.corrected_text.trim() : need;
    const activeIntent = inferIntentProfile(effectiveNeed);
    const preferredCategories = activeIntent?.categories || [];
    const normalizedNeed = canonicalizeNeed(effectiveNeed);
    const cheapMode = activeIntent?.key === 'cheap' || /\b(pas cher|cheap|economique|budget|arkhess|rkhis)\b/.test(normalizedNeed);
    const expensiveMode = activeIntent?.key === 'expensive' || /\b(cher|premium|haut de gamme|luxury|aghla|ghali)\b/.test(normalizedNeed);
    const stopwords = new Set([
      'nhb', 'nheb', 'bch', 'na3mel', 'naamel', 'mtaa', 'mta3', '3la', 'fi', 'el', 'le', 'la', 'de', 'des', 'pour', 'to'
    ]);

    // Récupérer les produits disponibles
    const existingProducts = await Product.find({ isAvailable: true })
      .select('name description category price priceUnit specifications unit tags media')
      .maxTimeMS(10000)
      .lean();

    console.log(`[AI] Produits trouvés: ${existingProducts?.length || 0}`);

    if (!existingProducts || existingProducts.length === 0) {
      return res.status(200).json({ success: true, data: [], message: "Catalogue vide ou inaccessible" });
    }

    const productsForPreferredContext = preferredCategories.length
      ? existingProducts.filter((p) => preferredCategories.includes(p.category))
      : existingProducts;
    const candidateProducts = dedupeProducts(
      productsForPreferredContext.length ? productsForPreferredContext : existingProducts
    );

    // Deterministic first-pass retrieval: stable and intent-aware.
    const needForRules = canonicalizeNeed(effectiveNeed);
    const terms = needForRules
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !stopwords.has(w));
    let deterministic = candidateProducts
      .map((p) => {
        const haystack = `${p.name} ${p.category} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        let score = terms.filter((k) => haystack.includes(k)).length;
        if (activeIntent) {
          if (preferredCategories.includes(p.category)) score += 3;
          score += (activeIntent.positiveTerms || []).filter((t) => haystack.includes(normalizeText(t))).length * 2;
          score -= (activeIntent.negativeTerms || []).filter((t) => haystack.includes(normalizeText(t))).length * 3;
        }
        return { ...p, _score: score };
      })
      .filter((p) => p._score > 0);

    if (cheapMode) {
      deterministic = deterministic
        .sort((a, b) => Number(a?.price || Infinity) - Number(b?.price || Infinity))
        .slice(0, 8);
    } else if (expensiveMode) {
      deterministic = deterministic
        .sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0))
        .slice(0, 8);
    } else {
      deterministic = deterministic
        .sort((a, b) => b._score - a._score)
        .slice(0, 8);
    }

    if (deterministic.length >= 3) {
      const deterministicData = toGroupedResponse(
        deterministic,
        cheapMode
          ? `Sélection économique pour « ${effectiveNeed} »`
          : `Sélection basée sur votre recherche « ${effectiveNeed} »`
      );
      if (deterministicData.length > 0) {
        return res.status(200).json({ success: true, data: deterministicData });
      }
    }

    const catalogContext = candidateProducts.map(p =>
      `[ID: ${p._id}] ${p.name} (Catégorie: ${p.category}, Prix: ${p.price} ${p.priceUnit})`
    ).join('\n');

    // ─── Fallback local intelligent (uniquement si pertinent) ───
    const performLocalFallback = (reason, isIrrelevant = false) => {
      console.log(`[AI] Fallback local activé. Raison: ${reason}`);
      
      if (isIrrelevant) {
        return res.status(200).json({ 
          success: true, 
          data: [], 
          message: "Je suis BatiBot, spécialisé uniquement dans la recommandation de matériaux. N'hésitez pas à me décrire vos travaux !" 
        });
      }

      const normalizedNeedForMatch = canonicalizeNeed(effectiveNeed);
      const keywords = normalizedNeedForMatch
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 2 && !stopwords.has(w));
      let matched = candidateProducts.filter(p => {
        const haystack = `${p.name} ${p.category} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        return keywords.some(k => haystack.includes(k));
      });

      if (preferredCategories.length) {
        const preferredMatched = matched.filter((p) => preferredCategories.includes(p.category));
        if (preferredMatched.length > 0) matched = preferredMatched;
      }

      if (matched.length === 0) {
        let topFallback = candidateProducts
          .filter((p) => !preferredCategories.length || preferredCategories.includes(p.category))
          .sort((a, b) => (b?.rating?.average || 0) - (a?.rating?.average || 0));

        if (cheapMode) {
          topFallback = topFallback
            .sort((a, b) => Number(a?.price || Infinity) - Number(b?.price || Infinity))
            .slice(0, 6);
        } else if (expensiveMode) {
          topFallback = topFallback
            .sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0))
            .slice(0, 6);
        } else {
          topFallback = topFallback.slice(0, 5);
        }

        const groupedFallback = {};
        topFallback.forEach((p) => {
          const cat = p.category || 'Autre';
          if (!groupedFallback[cat]) groupedFallback[cat] = [];
          groupedFallback[cat].push(enrichProduct(p));
        });

        const data = Object.entries(groupedFallback).map(([cat, products]) => ({
          title: cat.charAt(0).toUpperCase() + cat.slice(1),
          advice: `Sélection recommandée pour "${effectiveNeed}"`,
          products
        }));

        return res.status(200).json({
          success: true,
          data,
          message: "Aucune correspondance exacte, voici les produits les plus pertinents."
        });
      }

      // Trier par pertinence (nombre de mots clés matchés)
      matched = matched
        .map(p => {
          const haystack = `${p.name} ${p.category} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
          let score = keywords.filter(k => haystack.includes(k)).length;

          if (activeIntent) {
            const posHits = (activeIntent.positiveTerms || []).filter((term) => haystack.includes(normalizeText(term))).length;
            const negHits = (activeIntent.negativeTerms || []).filter((term) => haystack.includes(normalizeText(term))).length;
            if (preferredCategories.includes(p.category)) score += 3;
            score += posHits * 2;
            score -= negHits * 3;
          }

          return { ...p, _score: score };
        })
        .sort((a, b) => b._score - a._score)
        .filter((p) => p._score > 0)
        .slice(0, 6);

      if (cheapMode && matched.length > 0) {
        matched = [...matched]
          .sort((a, b) => Number(a?.price || Infinity) - Number(b?.price || Infinity))
          .slice(0, 6);
      }

      const grouped = {};
      matched.forEach(p => {
        const cat = p.category || 'Autre';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p);
      });

      const enrichedData = Object.entries(grouped).map(([cat, products]) => ({
        title: cat.charAt(0).toUpperCase() + cat.slice(1),
        advice: `Sélection basée sur votre recherche « ${effectiveNeed} »`,
        products: products.map(enrichProduct)
      }));

      return res.status(200).json({ success: true, data: enrichedData });
    };

    // ─── Local LLM Logic ───
    try {
      const prompt = `Tu es BatiBot, un assistant qui recommande UNIQUEMENT des MATÉRIAUX DE CONSTRUCTION du catalogue.
      Tu dois comprendre les requêtes en français, anglais, derija tunisienne et arabizi.
      Interprète les variantes de mots (ex: koujina/cuisine, 7ammem/salle de bain, materiel/matériel).
      
      RÈGLES STRICTES :
      1. Si l'utilisateur pose une question sur le fonctionnement du site, sur son compte, ou toute question générale qui n'est pas une recherche de matériaux, retourne EXCLUSIVEMENT un tableau VIDE : [].
      2. Ne réponds jamais par du texte en dehors du JSON.
      3. Si l'utilisateur cherche des matériaux, propose les meilleurs IDs du catalogue.

      Besoin utilisateur : "${effectiveNeed}"
      Intent détecté : "${activeIntent?.key || 'general'}"
      Catégories prioritaires : "${preferredCategories.join(', ') || 'aucune'}"
      Priorité prix bas : "${cheapMode ? 'oui' : 'non'}"
      
      CATALOGUE DISPONIBLE :
      ${catalogContext}

      Format de réponse attendu :
      [
        {
          "title": "Nom de la sélection (ex: Fondations)",
          "advice": "Un conseil court et expert",
          "matchedProductIds": ["ID1", "ID2"]
        }
      ]`;

      console.log(`[AI] Envoi requête au Cloud AI pour: "${effectiveNeed}"...`);
      let responseText = "";
      try {
        responseText = await callCloudAI([
          { role: 'system', content: prompt }
        ], { temperature: 0.1 });
      } catch (cloudErr) {
        console.error("[AI] Cloud AI failed for recommendation, trying local:", cloudErr.message);
        responseText = await callLocalLLM([
          { role: 'system', content: prompt }
        ], { temperature: 0.1 });
      }

      if (!responseText) {
        return performLocalFallback("Pas de réponse des LLMs (Cloud/Local)");
      }

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      // Si le LLM retourne [] ou rien du tout, on considère que c'est hors-sujet ou sans résultat
      if (!jsonMatch || jsonMatch[0] === "[]") {
        return performLocalFallback("Requête hors-sujet ou sans produits", true);
      }

      const recommendation = JSON.parse(jsonMatch[0]);
      const normalizedRec = Array.isArray(recommendation) ? recommendation : [recommendation];

      let enrichedData = normalizedRec.map(item => {
        const products = candidateProducts.filter(p =>
          item.matchedProductIds?.some(id => id.toString() === p._id.toString())
        ).map(enrichProduct);
        return {
          title: item.title || "Recommandation",
          advice: item.advice || "",
          products
        };
      }).filter(item => item.products.length > 0);

      // Strict gate: if we inferred preferred categories from user intent,
      // keep only products within those categories (prevents noisy "Autre"/off-topic results).
      if (preferredCategories.length > 0) {
        enrichedData = enrichedData
          .map((group) => ({
            ...group,
            products: (group.products || []).filter((p) => preferredCategories.includes(p.category)),
          }))
          .filter((group) => group.products.length > 0);
      }

      if (activeIntent?.negativeTerms?.length) {
        enrichedData = enrichedData
          .map((group) => ({
            ...group,
            products: (group.products || []).filter((p) => {
              const haystack = `${p.name} ${p.category} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
              return !activeIntent.negativeTerms.some((term) => haystack.includes(normalizeText(term)));
            }),
          }))
          .filter((group) => group.products.length > 0);
      }

      if (cheapMode) {
        enrichedData = enrichedData
          .map((group) => ({
            ...group,
            products: [...(group.products || [])]
              .sort((a, b) => Number(a?.price || Infinity) - Number(b?.price || Infinity))
              .slice(0, 4),
          }))
          .filter((group) => group.products.length > 0);
      } else if (expensiveMode) {
        enrichedData = enrichedData
          .map((group) => ({
            ...group,
            products: [...(group.products || [])]
              .sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0))
              .slice(0, 4),
          }))
          .filter((group) => group.products.length > 0);
      }

      if (enrichedData.length === 0) {
        return performLocalFallback("Le LLM n'a trouvé aucun produit correspondant");
      }

      return res.status(200).json({ success: true, data: enrichedData });

    } catch (llmError) {
      console.error("[AI] Erreur LLM Local:", llmError.message);
      return performLocalFallback(llmError.message);
    }

  } catch (error) {
    console.error("ERREUR CRITIQUE:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur BatiBot.",
      error: error.message
    });
  }
};
