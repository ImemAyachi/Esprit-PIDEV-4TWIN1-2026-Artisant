"""
Script d'entraînement PriceSeer pour le nouveau dataset Showroom BTP Tunisie.
Ce script lit le grand dataset (~18k lignes), entraîne les modèles, et sauvegarde le résultat.
"""
import os
import sys

# Patch path
sys.path.insert(0, os.path.dirname(__file__))

import priceseer

def train():
    print("\n" + "="*70)
    print("  PriceSeer 4.0 — Entraînement sur Dataset Showroom Tunisie (18k+)")
    print("="*70)
    
    # Forcer le réentraînement en supprimant les anciens fichiers
    for f in ["priceseer_v3.pkl", "priceseer_enc.pkl"]:
        path = os.path.join(os.path.dirname(__file__), f)
        if os.path.exists(path):
            os.remove(path)
            print(f"  [X] Supprimé: {f}")
            
    print("\n  [+] Démarrage de l'entraînement...")
    svc = priceseer.PriceSeerService()
    
    stats = svc.get_stats()
    print(f"\n  Dataset chargé : {stats['total']} produits")
    print(f"  Prix moyen     : {stats['prix_moyen']} TND")
    print(f"  Villes connues : {len(svc.cities)}")
    print(f"\n  Catégories ({len(stats['categories'])}) :")
    for cat, cnt in sorted(stats['categories'].items(), key=lambda x: -x[1]):
        print(f"    {cat:<35} {cnt} produits")
        
    return svc

def test(svc):
    print("\n" + "="*70)
    print("  Test de prédiction sur l'impact de la localisation")
    print("="*70)
    
    test_cases = [
        {"name": "ciment", "description": "", "category": "ciment", "city": "Tunis", "marketAvg": 0},
        {"name": "ciment", "description": "", "category": "ciment", "city": "Tozeur", "marketAvg": 0},
        {"name": "parpaing standard", "description": "", "category": "brique", "city": "Sfax", "marketAvg": 0},
        {"name": "parpaing standard", "description": "", "category": "brique", "city": "Tataouine", "marketAvg": 0},
        {"name": "porte blindée luxe", "description": "", "category": "menuiserie", "city": "Tunis", "marketAvg": 0},
        {"name": "tube pvc 100mm", "description": "", "category": "plomberie", "city": "Nabeul", "marketAvg": 0},
        {"name": "tube pvc 100mm", "description": "", "category": "plomberie", "city": "Gafsa", "marketAvg": 0},
    ]

    print(f"  {'Produit':<30} {'Ville':<15} {'Suggestion':>10}")
    print(f"  {'-'*60}")
    for tc in test_cases:
        suggestion = svc.predict_suggestion(tc)
        print(f"  {tc['name']:<30} {tc['city']:<15} {suggestion:>10.2f} TND")
        
    print("\n  [OK] Entraînement terminé et modèle sauvegardé avec succès.")

if __name__ == "__main__":
    svc = train()
    if svc.model is not None:
        test(svc)
    else:
        print("  [ERREUR] Échec de l'entraînement.")
