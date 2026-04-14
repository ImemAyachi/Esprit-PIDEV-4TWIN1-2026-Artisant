import mongoose from 'mongoose';
import User from '../models/User.model.js';

function normalizeText(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const CRAFTS = ['maçon', 'plombier', 'électricien', 'peintre', 'carreleur', 'menuisier', 'autre'];

function mapExpertsToCrafts(requiredExperts) {
  const raw = Array.isArray(requiredExperts) ? requiredExperts : [];
  const n = raw.map((x) => normalizeText(x)).filter(Boolean);
  const out = new Set();

  const add = (craft) => out.add(craft);

  for (const e of n) {
    if (/(electric|electri)/.test(e)) add('électricien');
    else if (/(plomb|sanitaire)/.test(e)) add('plombier');
    else if (/(macon|beton|gros oeuvre|gros-oeuvre)/.test(e)) add('maçon');
    else if (/(peint|enduit)/.test(e)) add('peintre');
    else if (/(carrel|faience|faiance|revetement)/.test(e)) add('carreleur');
    else if (/(menuis|bois|charpent)/.test(e)) add('menuisier');
  }

  // If we couldn't map, return empty => match all crafts.
  return Array.from(out).filter((c) => CRAFTS.includes(c));
}

function haversineKm(aLat, aLon, bLat, bLon) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function countryMatches(country, code) {
  const c = normalizeText(country);
  const cc = normalizeText(code);
  if (!cc) return true;
  if (cc === 'tn') return c === 'tunisie' || c === 'tunisia' || c.includes('tun');
  return c === cc || c.startsWith(cc);
}

export async function getWorkforceStats(req, res) {
  const connected = mongoose.connection?.readyState === 1;
  if (!connected) {
    return res.status(200).json({
      success: true,
      data: {
        connected: false,
        geolocatedArtisans: 0,
        artisanProfiles: 0,
        artisansMissingCoords: 0,
        message: 'MongoDB non connecté.',
        breakdown: { artisanProfiles: 0, geolocatedArtisans: 0, artisansMissingCoords: 0 },
      },
    });
  }

  const artisanProfiles = await User.countDocuments({ role: 'Artisan', isActive: true });
  const geolocatedArtisans = await User.countDocuments({
    role: 'Artisan',
    isActive: true,
    'location.lat': { $type: 'number' },
    'location.lng': { $type: 'number' },
  });
  const artisansMissingCoords = Math.max(0, artisanProfiles - geolocatedArtisans);

  return res.status(200).json({
    success: true,
    data: {
      connected: true,
      geolocatedArtisans,
      artisanProfiles,
      artisansMissingCoords,
      message:
        geolocatedArtisans > 0
          ? 'MongoDB connecté — matching basé sur les profils Artisan (craft + coordonnées).'
          : 'MongoDB connecté — aucun artisan avec coordonnées GPS (location.lat/lng).',
      breakdown: { artisanProfiles, geolocatedArtisans, artisansMissingCoords },
    },
  });
}

export async function matchWorkforce(req, res) {
  const connected = mongoose.connection?.readyState === 1;
  if (!connected) {
    return res.status(200).json({
      success: true,
      data: {
        matches: [],
        summaryExplanation: '',
        summaryExplanationEn: '',
        provinceFilterApplied: false,
        projectAdminArea: req.body?.projectAdminArea ?? null,
        projectCountryCode: req.body?.projectCountryCode ?? null,
        provinceFilterEmpty: false,
        provinceFilterMessage: null,
        noDbArtisans: true,
        dbArtisanCount: 0,
      },
    });
  }

  const requiredExperts = Array.isArray(req.body?.requiredExperts) ? req.body.requiredExperts : [];
  const crafts = mapExpertsToCrafts(requiredExperts);

  const lat = Number(req.body?.userLocation?.latitude);
  const lon = Number(req.body?.userLocation?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ success: false, message: 'userLocation.latitude/longitude requis et valides.' });
  }

  const projectAdminArea = String(req.body?.projectAdminArea || '').trim();
  const projectCountryCode = String(req.body?.projectCountryCode || '').trim();
  const adminNorm = normalizeText(projectAdminArea);

  const baseQuery = {
    role: 'Artisan',
    isActive: true,
    'location.lat': { $type: 'number' },
    'location.lng': { $type: 'number' },
    ...(crafts.length ? { craft: { $in: crafts } } : {}),
  };

  // Fetch candidates (limit to keep it fast).
  const candidates = await User.find(baseQuery)
    .select('firstName lastName phone craft location rating')
    .limit(600)
    .lean();

  const filtered = candidates.filter((u) => {
    if (!countryMatches(u.location?.country, projectCountryCode)) return false;
    if (!adminNorm) return true;
    const st = normalizeText(u.location?.state);
    const city = normalizeText(u.location?.city);
    return st === adminNorm || city === adminNorm || st.includes(adminNorm) || city.includes(adminNorm);
  });

  const provinceFilterApplied = Boolean(adminNorm);
  const provinceFilterEmpty = provinceFilterApplied && filtered.length === 0;
  const provinceFilterMessage =
    provinceFilterApplied
      ? provinceFilterEmpty
        ? `Aucun artisan trouvé pour le gouvernorat « ${projectAdminArea} ». Essayez sans filtre gouvernorat.`
        : `Filtre gouvernorat appliqué : « ${projectAdminArea} ».`
      : null;

  const scored = filtered
    .map((u) => {
      const uLat = Number(u.location?.lat);
      const uLng = Number(u.location?.lng);
      const dist = Number.isFinite(uLat) && Number.isFinite(uLng) ? haversineKm(lat, lon, uLat, uLng) : null;
      const rating = Number(u.rating?.average || 0);
      const distScore = dist == null ? 0 : Math.max(0, 35 - Math.min(35, dist)); // closer is better (0..35)
      const ratingScore = Math.min(5, Math.max(0, rating)) * 10; // 0..50
      const craftScore = crafts.length ? 25 : 10; // boost when matching a requested craft
      const score = Math.round(distScore + ratingScore + craftScore);

      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Artisan';
      const addressParts = [u.location?.address, u.location?.city, u.location?.state, u.location?.country]
        .map((x) => String(x || '').trim())
        .filter(Boolean);
      const address = addressParts.join(', ');
      const mapsUrl =
        Number.isFinite(uLat) && Number.isFinite(uLng)
          ? `https://www.google.com/maps?q=${encodeURIComponent(`${uLat},${uLng}`)}`
          : null;

      const matchedSkills = u.craft ? [u.craft] : [];
      const explanation = dist == null
        ? `Profil ${matchedSkills.length ? matchedSkills.join(', ') : 'artisan'} — distance inconnue.`
        : `Profil ${matchedSkills.length ? matchedSkills.join(', ') : 'artisan'} — à ~${Math.round(dist)} km.`;

      return {
        name: fullName,
        score,
        distance: dist == null ? null : Math.round(dist),
        rating: Math.round(rating * 10) / 10,
        phone: u.phone || null,
        address: address || null,
        mapsUrl,
        matchedSkills,
        explanation,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return res.status(200).json({
    success: true,
    data: {
      matches: scored,
      summaryExplanation:
        scored.length > 0
          ? `Sélection de ${scored.length} artisan(s) selon craft, distance et note.`
          : 'Aucun artisan trouvé avec les filtres actuels.',
      summaryExplanationEn:
        scored.length > 0
          ? `Selected ${scored.length} artisan(s) based on craft, distance and rating.`
          : 'No artisans found with current filters.',
      provinceFilterApplied,
      projectAdminArea: projectAdminArea || null,
      projectCountryCode: projectCountryCode || null,
      provinceFilterEmpty,
      provinceFilterMessage,
      noDbArtisans: false,
      dbArtisanCount: filtered.length,
    },
  });
}

