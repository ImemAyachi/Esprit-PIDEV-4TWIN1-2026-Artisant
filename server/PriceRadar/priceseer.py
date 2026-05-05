
import os
import json
import numpy as np
import re
import datetime
import pickle
import unicodedata

# ============================================================
#  PriceSeer 3.1 — Moteur IA BTP Tunisie
#  Architecture: modele par categorie + GBR global
#  Fix: zero feature leakage, prediction ancoree par categorie
# ============================================================

try:
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.preprocessing import LabelEncoder
    SKLEARN_OK = True
except ImportError:
    SKLEARN_OK = False

DATASET_PATH = os.path.join(os.path.dirname(__file__), "construction_showroom_tunisia.json")
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "priceseer_v3.pkl")
ENC_PATH     = os.path.join(os.path.dirname(__file__), "priceseer_enc.pkl")


# ------------------------------------------------------------------
# Mapping categories
# ------------------------------------------------------------------
CATEGORY_MAP = {
    # Noms longs (dataset BTP)
    "ciment et mortier":       "ciment",
    "granulats":               "sable",
    "briques et blocs":        "brique",
    "carrelage et faience":    "carrelage",
    "platrerie et isolation":  "platre",
    "peinture et revetement":  "peinture",
    "outillage":               "outillage",
    "fer et acier":            "acier",
    "electricite":             "electricite",
    "plomberie":               "plomberie",
    "menuiserie":              "menuiserie",
    "toiture et couverture":   "toiture",
    "bois et panneaux":        "bois",
    "fixation":                "fixation",
    # Noms courts (categories envoyees par le frontend)
    "brique":                  "brique",
    "ciment":                  "ciment",
    "sable":                   "sable",
    "marbre":                  "marbre",
    "granit":                  "granit",
    "carrelage":               "carrelage",
    "peinture":                "peinture",
    "acier":                   "acier",
    "bois":                    "bois",
    "plomberie":               "plomberie",
    "menuiserie":              "menuiserie",
    "toiture":                 "toiture",
    "platre":                  "platre",
    "autre":                   "autre",
}

# Prix médians réels par catégorie (dataset_btp.json)
CATEGORY_MEDIAN_PRICE = {
    "ciment":      16.0,
    "sable":       48.0,
    "brique":      1.05,
    "carrelage":   18.0,
    "marbre":      45.0,   # Thala (19-65), Foussana (45-85), Kadhel (90-120). Median ~45
    "granit":      85.0,   # Granit plus cher que marbre local
    "platre":      14.0,
    "peinture":    38.0,
    "acier":       45.0,
    "electricite": 30.0,
    "plomberie":   80.0,
    "menuiserie":  300.0,
    "toiture":     4.0,
    "bois":        120.0,
    "fixation":    6.0,
    "outillage":   55.0,
    "autre":       25.0,
}

SUPPLIER_MAP = {
    "usine": 1.0, "briqueterie": 0.9, "carriere": 0.85,
    "importateur": 1.15, "menuiserie": 1.05, "tuilerie": 0.95,
}


def _strip_accents(s: str) -> str:
    return ''.join(
        ch for ch in unicodedata.normalize('NFD', s)
        if unicodedata.category(ch) != 'Mn'
    )


def _normalize_category(cat: str) -> str:
    """Normalise une categorie (noms courts ou longs, avec/sans accents)."""
    c = _strip_accents(cat.lower().strip())

    # 1. Correspondance exacte d'abord (priorite aux noms courts)
    if c in CATEGORY_MAP:
        return CATEGORY_MAP[c]

    # 2. Chercher si la cle est contenue dans l'input (ex: 'briques et blocs' in 'briques et blocs tunisie')
    for k, v in CATEGORY_MAP.items():
        k_norm = _strip_accents(k)
        if k_norm in c:
            return v

    # 3. Chercher si l'input est contenu dans la cle (ex: 'brique' in 'briques et blocs')
    for k, v in CATEGORY_MAP.items():
        k_norm = _strip_accents(k)
        if c in k_norm:
            return v

    return "autre"


def _extract_features(product: dict) -> list:
    """
    Extrait 12 features NON-PRICE pour eviter le leakage.
    Features: qualite, popularite, fournisseur, dimensions, poids,
              longueur, flags semantiques, prix median de categorie.
    """
    name      = product.get("name", "")
    desc      = product.get("description", "")
    full_text = _strip_accents((name + " " + desc).lower())
    cat_norm  = _normalize_category(product.get("category", ""))

    quality       = float(product.get("quality_score", 3.5)) / 5.0
    popularity    = float(product.get("popularity_score", 7.0)) / 10.0
    supplier_coef = SUPPLIER_MAP.get(
        _strip_accents(product.get("supplier_type", "importateur").lower()), 1.0
    )

    # Surface (ex: 40x20, 100x100, 2.4x6)
    dims = re.findall(r"(\d+\.?\d*)\s*[x*x]\s*(\d+\.?\d*)", full_text)
    surface = 0.0
    if dims:
        try:
            vals = sorted([float(dims[0][0]), float(dims[0][1])], reverse=True)
            surface = vals[0] * vals[1] / 10000.0
        except Exception:
            pass

    # Epaisseur / diametre (mm, cm)
    thick_m = re.findall(r"(\d+)\s*(mm|cm)", full_text)
    thickness = 0.0
    if thick_m:
        try:
            val, unit = thick_m[0]
            thickness = float(val) / (10.0 if unit == "mm" else 1.0)
        except Exception:
            pass

    # Poids / volume
    weight_m = re.findall(r"(\d+\.?\d*)\s*(kg|l\b|m3|litres?)", full_text)
    weight = 0.0
    if weight_m:
        try:
            weight = float(weight_m[0][0])
        except Exception:
            pass

    # Longueur en metres
    length_m = re.findall(r"(\d+\.?\d*)\s*m\b", full_text)
    length = 0.0
    if length_m:
        try:
            length = max(float(v) for v in length_m)
        except Exception:
            pass

    # Flags semantiques (qualite relative)
    premium_flag   = 1.0 if any(w in full_text for w in [
        "premium", "luxe", "haute resistance", "certifie", "renforce",
        "double vitrage", "blindee", "motorisation", "soft-close", "ipe", "ipn"
    ]) else 0.0
    import_flag    = 1.0 if "import" in full_text else 0.0
    large_flag     = 1.0 if any(w in full_text for w in ["60x60", "80x80", "grand format", "150l", "200l"]) else 0.0

    # --- Features specifiques Briques ---
    # Nombre de trous (6T, 8T, 12T, 15T, 20T...)
    trous_m = re.findall(r"(\d+)\s*trous?", full_text)
    nb_trous = float(trous_m[0]) / 20.0 if trous_m else 0.0  # normalise sur 20 trous max

    # Brique pleine (prix plus stable ~1.2-1.3 DT)
    pleine_flag = 1.0 if "pleine" in full_text else 0.0

    # Brique creuse (prix selon nb trous, 0.75-2.20 DT)
    creuse_flag = 1.0 if "creuse" in full_text else 0.0

    # Volume 3D (ex: 30x15x15 = 6750 cm3 → normalise)
    vol_3d = 0.0
    if len(dims) >= 1:
        try:
            # Extraire toutes les dimensions du nom
            all_dims = re.findall(r"(\d+\.?\d*)\s*[x*x]\s*(\d+\.?\d*)\s*[x*x]\s*(\d+\.?\d*)", full_text)
            if all_dims:
                d = all_dims[0]
                vol_3d = float(d[0]) * float(d[1]) * float(d[2]) / 100000.0
            elif dims:
                vol_3d = float(dims[0][0]) * float(dims[0][1]) / 1000.0
        except Exception:
            pass

    # Ancre de categorie (prix median normalise) — feature cle!
    cat_median = CATEGORY_MEDIAN_PRICE.get(cat_norm, 25.0)

    return [
        quality,                         # 0
        popularity,                      # 1
        supplier_coef,                   # 2
        min(surface, 10.0),              # 3
        min(thickness, 50.0) / 50.0,     # 4
        min(weight, 500.0) / 500.0,      # 5
        min(length, 20.0) / 20.0,        # 6
        premium_flag,                    # 7
        import_flag,                     # 8
        large_flag,                      # 9
        cat_median / 1000.0,             # 10 — ancre prix categorie
        nb_trous,                        # 11 — nombre de trous (briques)
        pleine_flag,                     # 12 — brique pleine
        creuse_flag,                     # 13 — brique creuse
        min(vol_3d, 10.0),               # 14 — volume 3D
    ]


def _load_dataset():
    if not os.path.exists(DATASET_PATH):
        return []
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Ancien format (fallback)
    if isinstance(data, dict) and "products" in data:
        return data["products"]
        
    # Nouveau format (Showroom)
    products = []
    for i, item in enumerate(data):
        tp = str(item.get("type_produit", "")).lower()
        cat = str(item.get("categorie_produit", "")).lower()
        
        frontend_cat = "autre"
        if "brique" in tp or "parpaing" in tp: frontend_cat = "brique"
        elif "ciment" in tp: frontend_cat = "ciment"
        elif "sable" in tp or "gravier" in tp: frontend_cat = "sable"
        elif "marbre" in tp: frontend_cat = "marbre"
        elif "granit" in tp: frontend_cat = "granit"
        elif any(x in tp for x in ["carrelage", "gres", "faience", "colle", "joint"]): frontend_cat = "carrelage"
        elif "peinture" in tp or "enduit" in tp: frontend_cat = "peinture"
        elif cat == "plomberie": frontend_cat = "plomberie"
        elif cat == "menuiserie" or "bois" in tp or "porte" in tp or "fenetre" in tp: frontend_cat = "menuiserie"
        elif cat == "electricite": frontend_cat = "electricite"
        elif cat == "quincaillerie" or "acier" in tp or "fer" in tp: frontend_cat = "acier" if "acier" in tp or "fer" in tp else "fixation"
        elif cat == "isolation": frontend_cat = "platre"
        elif cat == "etancheite": frontend_cat = "toiture"
        
        # Generer une "description" virtuelle
        desc = f"{item.get('type_projet', '')} surface {item.get('surface_m2', 0)}m2 budget {item.get('budget', 0)}"

        products.append({
            "id": i,
            "name": f"{item.get('type_produit', '')} {item.get('marque', '')}",
            "description": desc,
            "category": frontend_cat,
            "price_tnd": float(item.get("prix_unitaire", 0)),
            "region": item.get("localisation", "Tunis"),
            "quality_score": float(item.get("qualite", 3.5)),
            "popularity_score": float(item.get("popularite", 7.0)),
            "supplier_type": "usine" # Défaut pour le nouveau dataset
        })
    return products


# ============================================================
#  SERVICE PRINCIPAL
# ============================================================

class PriceSeerService:
    def __init__(self):
        self.categories = list(CATEGORY_MAP.values()) + ["autre"]
        self.cities = [
            "Tunis", "Sousse", "Sfax", "Nabeul", "Bizerte",
            "Ariana", "Ben Arous", "Monastir", "Kairouan", "Gafsa",
            "Gabes", "Djerba", "Toute la Tunisie",
        ]

        # Un modele GLOBAL + une correction par categorie
        self.model        = None
        self.le_cat       = LabelEncoder() if SKLEARN_OK else None
        self.le_city      = LabelEncoder() if SKLEARN_OK else None
        # Modeles par categorie (plus precis pour les categories avec peu de variance)
        self.cat_models   = {}
        self.memory_buffer = []

        if SKLEARN_OK and os.path.exists(MODEL_PATH) and os.path.exists(ENC_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    saved = pickle.load(f)
                with open(ENC_PATH, "rb") as f:
                    enc = pickle.load(f)
                self.model      = saved.get("global")
                self.cat_models = saved.get("cat_models", {})
                self.le_cat     = enc["cat"]
                self.le_city    = enc["city"]
                print("[PriceSeer 3.1] Modele charge depuis le disque.")
            except Exception as e:
                print(f"[PriceSeer] Erreur chargement: {e}. Re-entrainement...")
                self._train_from_dataset()
        elif SKLEARN_OK:
            self._train_from_dataset()

    # ------------------------------------------------------------------
    def _encode_sample(self, cat_norm: str, city: str, features: list) -> list:
        try:
            cat_enc = int(self.le_cat.transform([cat_norm])[0])
        except Exception:
            cat_enc = 0
        try:
            city_clean = _strip_accents(city)
            city_enc = int(self.le_city.transform([city_clean])[0])
        except Exception:
            city_enc = 0

        now = datetime.datetime.now()
        month_sin = np.sin(2 * np.pi * now.month / 12)
        month_cos = np.cos(2 * np.pi * now.month / 12)

        return [cat_enc, city_enc, month_sin, month_cos] + features

    # ------------------------------------------------------------------
    def _train_from_dataset(self):
        products = _load_dataset()
        if not products:
            print("[PriceSeer] Dataset introuvable.")
            self.model = None
            return

        print(f"[PriceSeer] Entrainement sur {len(products)} produits...")

        # Fit encoders
        all_cats   = [_normalize_category(p.get("category", "")) for p in products]
        all_cities = []
        for p in products:
            city = p.get("region", "Tunis").split(",")[0].strip()
            all_cities.append(_strip_accents(city))
        extra_cities = [_strip_accents(c) for c in self.cities]

        self.le_cat.fit(list(set(all_cats)) + list(CATEGORY_MAP.values()) + ["autre"])
        self.le_city.fit(list(set(all_cities)) + extra_cities)

        # Construire X, y
        X, y = [], []
        for p in products:
            cat_norm = _normalize_category(p.get("category", ""))
            city = p.get("region", "Tunis").split(",")[0].strip()
            feats = _extract_features(p)
            row   = self._encode_sample(cat_norm, city, feats)
            X.append(row)
            y.append(float(p.get("price_tnd", 0)))

        X = np.array(X, dtype=np.float64)
        y = np.array(y, dtype=np.float64)

        # --- Modele GLOBAL ---
        self.model = GradientBoostingRegressor(
            n_estimators=500,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.85,
            min_samples_leaf=2,
            max_features=0.9,
            random_state=42,
        )
        self.model.fit(X, y)

        # --- Modeles PAR CATEGORIE ---
        # Pour chaque categorie, entrainer un modele local plus precis
        self.cat_models = {}
        from collections import defaultdict
        cat_data = defaultdict(lambda: ([], []))

        for i, p in enumerate(products):
            cat_norm = _normalize_category(p.get("category", ""))
            cat_data[cat_norm][0].append(X[i])
            cat_data[cat_norm][1].append(y[i])

        for cat_norm, (Xc, yc) in cat_data.items():
            if len(Xc) >= 5:
                Xc_arr = np.array(Xc, dtype=np.float64)
                yc_arr = np.array(yc, dtype=np.float64)
                m = GradientBoostingRegressor(
                    n_estimators=200,
                    max_depth=4,
                    learning_rate=0.05,
                    random_state=42,
                )
                m.fit(Xc_arr, yc_arr)
                self.cat_models[cat_norm] = m

        self._save_model()

        # Evaluation sur les donnees d'entrainement
        preds = self.model.predict(X)
        mae = np.mean(np.abs(preds - y))
        ss_res = np.sum((y - preds) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r2 = 1 - (ss_res / ss_tot)
        print(f"[PriceSeer] Entraine - R2 global: {r2*100:.1f}% | MAE: {mae:.2f} DT")
        print(f"[PriceSeer] Modeles par categorie: {list(self.cat_models.keys())}")

    # ------------------------------------------------------------------
    def _save_model(self):
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({"global": self.model, "cat_models": self.cat_models}, f)
        with open(ENC_PATH, "wb") as f:
            pickle.dump({"cat": self.le_cat, "city": self.le_city}, f)
        print("[PriceSeer] Modele sauvegarde.")

    # ------------------------------------------------------------------
    def _rule_based_price(self, data: dict) -> float:
        cat = _normalize_category(data.get("category", ""))
        return round(CATEGORY_MEDIAN_PRICE.get(cat, 25.0), 2)

    # ------------------------------------------------------------------
    def predict_suggestion(self, data: dict) -> float:
        if not SKLEARN_OK or self.model is None:
            return self._rule_based_price(data)

        cat_norm = _normalize_category(data.get("category", ""))
        city     = data.get("city", "Tunis")

        product = {
            "category":         data.get("category", ""),
            "quality_score":    data.get("quality_score", 3.5),
            "popularity_score": data.get("popularity_score", 7.0),
            "supplier_type":    data.get("supplier_type", "importateur"),
            "name":             data.get("name", ""),
            "description":      data.get("description", ""),
        }

        feats = _extract_features(product)
        row   = np.array([self._encode_sample(cat_norm, city, feats)], dtype=np.float64)

        # --- Strategie de prediction hybride ---
        # 1. Modele par categorie (plus precis si disponible)
        if cat_norm in self.cat_models:
            pred_cat = float(self.cat_models[cat_norm].predict(row)[0])
        else:
            pred_cat = None

        # 2. Modele global (contexte general)
        pred_global = float(self.model.predict(row)[0])

        # 3. Fusion pondéree: 70% categorie, 30% global (si modele cat dispo)
        if pred_cat is not None:
            pred = 0.70 * pred_cat + 0.30 * pred_global
        else:
            pred = pred_global

        # 4. Correction specifique Briques — table des prix reels tunisiens
        # Source: marche 2026 — brique creuse 0.75-2.20 DT, brique pleine 1.20-1.30 DT
        if cat_norm == "brique":
            name_low = _strip_accents(data.get("name", "").lower())
            desc_low = _strip_accents(data.get("description", "").lower())
            full_low = name_low + " " + desc_low

            # Enrichir avec les specifications et tags (saisis dans le formulaire)
            specs_low = _strip_accents(data.get("specifications", "").lower())
            tags_low  = _strip_accents(data.get("tags", "").lower())
            full_low  = full_low + " " + specs_low + " " + tags_low

            # Extraire nombre de trous (dans nom + specs + tags)
            trous_m = re.findall(r"(\d+)\s*trous?", full_low)
            nb_trous = int(trous_m[0]) if trous_m else 0

            # Extraire epaisseur depuis les dimensions 3D
            dims3 = re.findall(r"(\d+)\s*[x*]\s*(\d+)\s*[x*]\s*(\d+)", full_low)
            epaisseur = 0
            if dims3:
                vals = sorted([int(dims3[0][0]), int(dims3[0][1]), int(dims3[0][2])])
                epaisseur = vals[0]  # la plus petite dimension = epaisseur

            # Table de prix ancree marche reel tunisien 2025-2026
            if ("parpaing" in full_low) or ("bloc" in full_low and "beton" in full_low):
                # Parpaing / bloc beton: 1.20 - 1.80 DT
                if "plein" in full_low:
                    brick_anchor = 3.20  # bloc beton plein (fondations)
                else:
                    # Parpaing creux 20x20x40: 1.20-1.80 DT
                    if epaisseur >= 20:
                        brick_anchor = 1.60
                    else:
                        brick_anchor = 2.80  # bloc beton creux standard
            elif "pleine" in full_low or "plein" in full_low:
                # Brique pleine 10x20x40: 1.20-1.30 DT
                brick_anchor = 1.25
            elif "refractaire" in full_low:
                brick_anchor = 2.10
            elif "parement" in full_low:
                brick_anchor = 1.90
            elif "thermique" in full_low or "rt2020" in full_low:
                # Echelle thermique: 30x15=2.00, 30x20=2.20, premium=2.20
                if epaisseur >= 20 or "premium" in full_low:
                    brick_anchor = 2.20
                else:
                    brick_anchor = 2.00
            elif nb_trous > 0:
                # Échelle par nombre de trous
                trous_price = {6: 0.78, 8: 0.90, 10: 0.95, 12: 1.05,
                               15: 1.30, 20: 1.80}
                brick_anchor = trous_price.get(nb_trous,
                    0.75 + (nb_trous / 20.0) * 1.45)  # interpolation lineaire
            elif epaisseur > 0:
                # Échelle par épaisseur (cm)
                ep_price = {10: 0.85, 12: 0.95, 15: 1.10, 20: 1.35, 25: 1.60, 30: 2.00}
                brick_anchor = ep_price.get(epaisseur,
                    0.75 + (epaisseur / 30.0) * 1.45)
            else:
                # Fallback: brique creuse generique
                # Le marche tunisien: brique creuse standard ~0.85-1.10 DT
                brick_anchor = 1.00

            # Ajustement qualite (+/- 15% selon qualite)
            quality = float(data.get("quality_score", 3.9))
            quality_mult = 0.85 + (quality - 1.0) / 4.0 * 0.30  # 0.85 - 1.075
            brick_anchor *= quality_mult

            # Ajustement fournisseur
            sup = _strip_accents(data.get("supplier_type", "briqueterie").lower())
            sup_mult = SUPPLIER_MAP.get(sup, 1.0)
            brick_anchor *= sup_mult

            # Fusion: 95% ancre regle (prix marche reel), 5% ML
            # La regle est tres fiable pour les briques (prix bien etablis en Tunisie)
            pred = 0.95 * brick_anchor + 0.05 * pred
            pred = float(np.clip(pred, 0.50, 5.00))
            return round(pred, 2)

        # 5. Correction specifique Marbre & Granit
        if cat_norm in ["marbre", "granit"]:
            name_low = _strip_accents(data.get("name", "").lower())
            desc_low = _strip_accents(data.get("description", "").lower())
            full_low = name_low + " " + desc_low + " " + _strip_accents(data.get("specifications", "").lower())

            if cat_norm == "marbre":
                if any(x in full_low for x in ["carrara", "italie", "luxe", "import"]):
                    anchor = 280.0
                elif any(x in full_low for x in ["chemtou", "kadhel"]):
                    anchor = 130.0
                elif "foussana" in full_low:
                    anchor = 85.0
                elif "thala" in full_low:
                    anchor = 65.0
                else:
                    anchor = 45.0  # Median marbre local
            else: # granit
                if any(x in full_low for x in ["noir", "absolu", "import"]):
                    anchor = 220.0
                else:
                    anchor = 110.0

            # Ajustement qualite
            quality = float(data.get("quality_score", 3.9))
            anchor *= (0.85 + (quality - 1.0) / 4.0 * 0.30)
            
            # Fusion 80/20 (plus de poids au ML que pour les briques car plus de variabilite)
            pred = 0.80 * anchor + 0.20 * pred
            return round(pred, 2)

        # 6. Sanity clip par categorie (autres categories)
        cat_median = CATEGORY_MEDIAN_PRICE.get(cat_norm, 25.0)
        price_min = max(0.1, cat_median * 0.02)
        price_max = cat_median * 50.0
        pred = float(np.clip(pred, price_min, price_max))

        return round(pred, 2)

    # ------------------------------------------------------------------
    def add_to_memory(self, data: dict, final_price: float):
        self.memory_buffer.append({**data, "target_price": final_price})
        if len(self.memory_buffer) >= 20:
            self._incremental_train()
            self.memory_buffer = []

    # ------------------------------------------------------------------
    def _incremental_train(self):
        if not SKLEARN_OK:
            return
        print(f"[PriceSeer] Mise a jour incremetale ({len(self.memory_buffer)} points)...")
        products = _load_dataset()
        all_data = list(products)

        for item in self.memory_buffer:
            all_data.append({
                "category":         item.get("category", "autre"),
                "price_tnd":        item.get("target_price", 10.0),
                "quality_score":    3.5,
                "popularity_score": 7.0,
                "supplier_type":    "importateur",
                "name":             item.get("name", ""),
                "description":      item.get("description", ""),
                "region":           item.get("city", "Tunis"),
            })

        X, y = [], []
        for p in all_data:
            cat_norm = _normalize_category(p.get("category", ""))
            city = p.get("region", "Tunis").split(",")[0].strip()
            feats = _extract_features(p)
            X.append(self._encode_sample(cat_norm, city, feats))
            y.append(float(p.get("price_tnd", 0)))

        X = np.array(X, dtype=np.float64)
        y = np.array(y, dtype=np.float64)
        self.model.fit(X, y)
        self._save_model()
        print("[PriceSeer] Modele mis a jour.")

    # ------------------------------------------------------------------
    def get_stats(self) -> dict:
        products = _load_dataset()
        if not products:
            return {"total": 0, "categories": {}}
        cats   = {}
        prices = []
        for p in products:
            c = p.get("category", "autre")
            cats[c] = cats.get(c, 0) + 1
            prices.append(p.get("price_tnd", 0))
        return {
            "total":      len(products),
            "categories": cats,
            "prix_moyen": round(sum(prices) / len(prices), 2),
            "prix_min":   min(prices),
            "prix_max":   max(prices),
        }
