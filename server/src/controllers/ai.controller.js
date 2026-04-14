import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/Product.model.js";

export const recommendProducts = async (req, res) => {
  try {
    const { need } = req.body;
    if (!need) return res.status(400).json({ success: false, message: "Le besoin est requis" });

    // Récupérer les produits disponibles
    const existingProducts = await Product.find({ isAvailable: true })
      .select('name description category price priceUnit specifications unit tags media')
      .maxTimeMS(10000)
      .lean();

    console.log(`[AI] Produits trouvés: ${existingProducts?.length || 0}`);

    if (!existingProducts || existingProducts.length === 0) {
      return res.status(200).json({ success: true, data: [], message: "Catalogue vide ou inaccessible" });
    }

    const catalogContext = existingProducts.map(p =>
      `[ID: ${p._id}] ${p.name} (Catégorie: ${p.category}, Prix: ${p.price} ${p.priceUnit})`
    ).join('\n');

    const apiKey = process.env.GEMINI_API_KEY;

    // ─── Fallback local intelligent (sans limite) ───
    const performLocalFallback = (reason) => {
      console.log(`[AI] Fallback local activé. Raison: ${reason}`);
      const keywords = need.toLowerCase().split(/\s+/).filter(w => w.length > 2);

      let matched = existingProducts.filter(p => {
        const haystack = `${p.name} ${p.category} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        return keywords.some(k => haystack.includes(k));
      });

      // Si aucun mot clé ne matche, proposer des produits variés
      if (matched.length === 0) {
        const shuffled = [...existingProducts].sort(() => 0.5 - Math.random());
        matched = shuffled.slice(0, 4);
      } else {
        // Trier par pertinence (nombre de mots clés matchés)
        matched = matched
          .map(p => {
            const haystack = `${p.name} ${p.category} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
            const score = keywords.filter(k => haystack.includes(k)).length;
            return { ...p, _score: score };
          })
          .sort((a, b) => b._score - a._score)
          .slice(0, 5);
      }

      // Grouper par catégorie
      const grouped = {};
      matched.forEach(p => {
        const cat = p.category || 'Autre';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p);
      });

      const enrichedData = Object.entries(grouped).map(([cat, products]) => ({
        title: cat.charAt(0).toUpperCase() + cat.slice(1),
        advice: `Sélection basée sur votre recherche « ${need} »`,
        products: products.map(p => ({
          ...p,
          mainImage: p.media?.[0]?.url || 'https://loremflickr.com/800/600/construction'
        }))
      }));

      return res.status(200).json({ success: true, data: enrichedData });
    };

    // Si pas de clé API → fallback
    if (!apiKey) return performLocalFallback("Clé API manquante");

    // ─── Tentative Gemini ───
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

      const prompt = `Agis comme un conseiller expert en BTP.
      Besoin : "${need}"
      CATALOGUE :
      ${catalogContext}

      Réponds UNIQUEMENT en JSON :
      [
        {
          "title": "Catégorie",
          "advice": "Conseil",
          "matchedProductIds": ["ID1"]
        }
      ]`;

      console.log(`[AI] Envoi requête à Gemini...`);
      const result = await model.generateContent(prompt);

      if (!result || !result.response) {
        return performLocalFallback("Pas de réponse de l'IA");
      }

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        return performLocalFallback("Format de réponse invalide");
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

      // Si Gemini ne retourne rien d'utile → fallback
      if (enrichedData.length === 0) {
        return performLocalFallback("Gemini n'a trouvé aucun produit correspondant");
      }

      return res.status(200).json({ success: true, data: enrichedData });

    } catch (apiError) {
      // ⚡ Quota épuisé, 429, 404, ou toute erreur API → fallback silencieux
      console.error("[AI] Erreur API Gemini:", apiError.message);
      return performLocalFallback(apiError.message);
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
