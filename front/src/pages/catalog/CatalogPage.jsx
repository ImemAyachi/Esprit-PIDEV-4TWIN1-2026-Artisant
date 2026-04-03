import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, setFilters } from '../../store/slices/productSlice';

const CATEGORIES = ['', 'marbre', 'granit', 'ciment', 'sable', 'carrelage', 'brique', 'bois', 'acier', 'peinture', 'plomberie', 'électricité', 'autre'];
const CAT_ICONS  = { marbre: '🪨', granit: '🪨', ciment: '🧱', sable: '⛱️', carrelage: '🔲', brique: '🧱', bois: '🌲', acier: '⚙️', peinture: '🎨', plomberie: '🔧', électricité: '⚡', autre: '📦' };

const StarRating = ({ value }) => (
  <div className="stars">
    {[1,2,3,4,5].map(n => (
      <span key={n} style={{ color: n <= Math.round(value) ? 'var(--clr-primary)' : 'var(--clr-surface3)', fontSize: '0.8rem' }}>★</span>
    ))}
  </div>
);

const CatalogPage = () => {
  const dispatch = useDispatch();
  const { items: products, pagination, loading, filters } = useSelector((s) => s.products);
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [filters]);

  const updateFilter = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilter('search', localSearch);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>📦 Catalogue de produits</h2>
          <p style={{ color: 'var(--clr-text-muted)', marginTop: '0.25rem' }}>{pagination.total} produits disponibles</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }}>🔍</span>
            <input
              className="form-input" placeholder="Rechercher un produit..."
              style={{ paddingLeft: '2.5rem' }}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <select className="form-input form-select" style={{ width: 160 }} value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c ? (CAT_ICONS[c] + ' ' + c.charAt(0).toUpperCase() + c.slice(1)) : 'Toutes catégories'}</option>)}
          </select>
          <input className="form-input" type="number" placeholder="Prix min" style={{ width: 110 }} value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} />
          <input className="form-input" type="number" placeholder="Prix max" style={{ width: 110 }} value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} />
          <select className="form-input form-select" style={{ width: 160 }} value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
            <option value="-createdAt">Plus récents</option>
            <option value="-rating">Mieux notés</option>
            <option value="price">Prix ↑</option>
            <option value="-price">Prix ↓</option>
          </select>
          <button type="submit" className="btn btn-primary">Rechercher</button>
        </form>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {CATEGORIES.filter(Boolean).map((c) => (
          <button
            key={c}
            className="btn btn-sm"
            style={{
              background: filters.category === c ? 'rgba(245,158,11,0.15)' : 'var(--clr-surface2)',
              border: `1px solid ${filters.category === c ? 'rgba(245,158,11,0.4)' : 'var(--clr-border)'}`,
              color: filters.category === c ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
            }}
            onClick={() => updateFilter('category', filters.category === c ? '' : c)}
          >
            {CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid-auto">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />)}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <div style={{ fontWeight: 600 }}>Aucun produit trouvé</div>
        </div>
      ) : (
        <div className="grid-auto">
          {products.map((p) => (
            <Link to={`/dashboard/catalog/${p._id}`} key={p._id} style={{ textDecoration: 'none' }}>
              <div className="product-card">
                <div className="product-card-img">
                  {p.mainImage || (p.media?.find(m => m.type === 'image')?.url) ? (
                    <img src={p.mainImage || p.media?.find(m => m.type === 'image')?.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '3rem' }}>{CAT_ICONS[p.category] || '📦'}</span>
                  )}
                </div>
                <div className="product-card-body">
                  <div className="product-card-cat">{CAT_ICONS[p.category]} {p.category}</div>
                  <div className="product-card-name">{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                    <StarRating value={p.rating?.average || 0} />
                    <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>({p.rating?.count || 0})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <div>
                      <span className="product-card-price">{p.price} DT</span>
                      <span className="product-card-unit">/ {p.unit}</span>
                    </div>
                    <span className={`badge ${p.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                      {p.isAvailable ? 'Disponible' : 'Épuisé'}
                    </span>
                  </div>
                  {p.supplier && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--clr-border)', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                      🏭 {p.supplier.companyName || `${p.supplier.firstName} ${p.supplier.lastName}`}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`btn btn-sm ${p === filters.page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => dispatch(setFilters({ page: p }))}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
