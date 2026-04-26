import { callLocalLLM } from "../utils/aiClient.js";
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

    const inferPreferredCategories = (text) => {
      const t = normalizeText(text);
      const has = (arr) => arr.some((x) => t.includes(normalizeText(x)));

      if (has(['cuisine', 'kitchen', 'koujina', 'kawjina', 'evier', 'évier', 'robinet', 'mitigeur'])) {
        return ['plomberie', 'électricité', 'carrelage', 'bois', 'peinture', 'autre'];
      }
      if (has(['salle de bain', 'bathroom', 'hammem', '7ammem', 'douche', 'wc'])) {
        return ['plomberie', 'carrelage', 'peinture', 'verre', 'autre'];
      }
      if (has(['outil', 'outils', 'tools', 'materiel', 'matériel', 'hardware'])) {
        return ['plomberie', 'électricité', 'autre', 'bois'];
      }
      if (has(['construction', 'batiment', 'bâtiment', 'maison', 'fondation', 'beton', 'béton'])) {
        return ['ciment', 'sable', 'brique', 'acier', 'bois', 'autre'];
      }
      return [];
    };

    const effectiveNeed = (
      nlp &&
      typeof nlp.corrected_text === 'string' &&
      nlp.corrected_text.trim()
    ) ? nlp.corrected_text.trim() : need;
    const preferredCategories = inferPreferredCategories(effectiveNeed);

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

    const catalogContext = (productsForPreferredContext.length ? productsForPreferredContext : existingProducts).map(p =>
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

      const keywords = effectiveNeed.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      let matched = existingProducts.filter(p => {
        const haystack = `${p.name} ${p.category} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        return keywords.some(k => haystack.includes(k));
      });

      if (preferredCategories.length) {
        const preferredMatched = matched.filter((p) => preferredCategories.includes(p.category));
        if (preferredMatched.length > 0) matched = preferredMatched;
      }

      if (matched.length === 0) {
        const topFallback = existingProducts
          .filter((p) => !preferredCategories.length || preferredCategories.includes(p.category))
          .sort((a, b) => (b?.rating?.average || 0) - (a?.rating?.average || 0))
          .slice(0, 5);

        const groupedFallback = {};
        topFallback.forEach((p) => {
          const cat = p.category || 'Autre';
          if (!groupedFallback[cat]) groupedFallback[cat] = [];
          groupedFallback[cat].push({
            ...p,
            mainImage: p.media?.[0]?.url || 'https://loremflickr.com/800/600/construction'
          });
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
          const score = keywords.filter(k => haystack.includes(k)).length;
          return { ...p, _score: score };
        })
        .sort((a, b) => b._score - a._score)
        .slice(0, 5);

      const grouped = {};
      matched.forEach(p => {
        const cat = p.category || 'Autre';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p);
      });

      const enrichedData = Object.entries(grouped).map(([cat, products]) => ({
        title: cat.charAt(0).toUpperCase() + cat.slice(1),
        advice: `Sélection basée sur votre recherche « ${effectiveNeed} »`,
        products: products.map(p => ({
          ...p,
          mainImage: p.media?.[0]?.url || 'https://loremflickr.com/800/600/construction'
        }))
      }));

      return res.status(200).json({ success: true, data: enrichedData });
    };

    // ─── Local LLM Logic ───
    try {
      const prompt = `Tu es BatiBot, un assistant qui recommande UNIQUEMENT des MATÉRIAUX DE CONSTRUCTION du catalogue.
      
      RÈGLES STRICTES :
      1. Si l'utilisateur pose une question sur le fonctionnement du site, sur son compte, ou toute question générale qui n'est pas une recherche de matériaux, retourne EXCLUSIVEMENT un tableau VIDE : [].
      2. Ne réponds jamais par du texte en dehors du JSON.
      3. Si l'utilisateur cherche des matériaux, propose les meilleurs IDs du catalogue.

      Besoin utilisateur : "${effectiveNeed}"
      
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

      console.log(`[AI] Envoi requête au LLM Local pour: "${effectiveNeed}"...`);
      const responseText = await callLocalLLM([
        { role: 'system', content: prompt }
      ], { temperature: 0.1 });

      if (!responseText) {
        return performLocalFallback("Pas de réponse du LLM local");
      }

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      // Si le LLM retourne [] ou rien du tout, on considère que c'est hors-sujet ou sans résultat
      if (!jsonMatch || jsonMatch[0] === "[]") {
        return performLocalFallback("Requête hors-sujet ou sans produits", true);
      }

      const recommendation = JSON.parse(jsonMatch[0]);
      const normalizedRec = Array.isArray(recommendation) ? recommendation : [recommendation];

      const enrichedData = normalizedRec.map(item => {
        const products = existingProducts.filter(p =>
          item.matchedProductIds?.some(id => id.toString() === p._id.toString())
        ).map(p => ({
          ...p,
          mainImage: p.media?.[0]?.url || 'https://loremflickr.com/800/600/construction'
        }));
        return {
          title: item.title || "Recommandation",
          advice: item.advice || "",
          products
        };
      }).filter(item => item.products.length > 0);

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
