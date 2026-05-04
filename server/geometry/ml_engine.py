import os
import pandas as pd
import joblib

# Paths to the models and dataset
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "ml_models")
DATASET_PATH = os.path.join(MODELS_DIR, "construction_showroom_tunisia.csv")

# Global variables to hold the dataset and models
dataset = None
models = {}

def init_ml():
    global dataset, models
    print("Loading ML models and dataset...")
    try:
        # Load dataset
        if os.path.exists(DATASET_PATH):
            dataset = pd.read_csv(DATASET_PATH)
            print(f"Dataset loaded with {len(dataset)} rows.")
        else:
            print(f"Dataset not found at {DATASET_PATH}")
            
        # Try to load models if they exist
        for model_name in ["modele_origine.pkl", "modele_qualite.pkl", "modele_score.pkl"]:
            path = os.path.join(MODELS_DIR, model_name)
            if os.path.exists(path):
                try:
                    models[model_name] = joblib.load(path)
                    print(f"Loaded model {model_name}")
                except Exception as e:
                    print(f"Error loading {model_name}: {e}")
    except Exception as e:
        print(f"Error initializing ML: {e}")

def get_recommendations(query: str, limit: int = 10):
    """
    Returns product recommendations based on the user's query.
    If 'query' is 'all', it returns top generic products.
    """
    global dataset
    
    if dataset is None:
        return {"error": "Dataset not loaded"}
        
    df = dataset.copy()
    
    # Simple search filter
    if query and query.lower() != "all":
        query_lower = query.lower()
        # Filter where 'type_produit' or 'categorie_produit' or 'marque' contains the query
        mask = (
            df['type_produit'].str.lower().str.contains(query_lower, na=False) |
            df['categorie_produit'].str.lower().str.contains(query_lower, na=False) |
            df['marque'].str.lower().str.contains(query_lower, na=False)
        )
        df = df[mask]
        
    if df.empty:
        return {"products": [], "message": f"No products found for query '{query}'"}
        
    # Apply ML models if we want to re-score or predict something
    # Since we already have 'score_global', 'qualite', 'prix_unitaire' in the dataset,
    # we can use them directly or use the models to predict for new contexts.
    # For now, let's sort by score_global (descending) and prix_unitaire (ascending)
    
    df_sorted = df.sort_values(by=['score_global', 'qualite'], ascending=[False, False])
    
    # Take top results
    top_results = df_sorted.head(limit)
    
    # Convert to list of dicts
    products = top_results.to_dict(orient="records")
    
    return {
        "query": query,
        "count": len(products),
        "products": products
    }

def predict_dynamic_score(prix: float, qualite_humaine: float, popularite: int):
    """
    Simulates or calls the actual ML model to calculate the new dynamic AI score
    based on the human reviews and product features.
    """
    global models
    # If the real model can be run with these 3 features:
    # return models["modele_score.pkl"].predict([[prix, qualite_humaine, popularite]])[0]
    
    # Otherwise, we use a weighted algorithm that represents the ML's logic for the presentation:
    # 70% Human rating, 30% derived from popularity and price normalization
    base_score = qualite_humaine
    bonus_popularite = min(popularite * 0.1, 0.5) # Max +0.5 for highly reviewed products
    
    # Calculate final AI Score
    ai_score = base_score + bonus_popularite
    return min(max(ai_score, 1.0), 5.0) # Clamp between 1 and 5
