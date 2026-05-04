import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, setFilters } from '../../store/slices/productSlice';
import { getProductImage } from '../../utils/imageUrl';

// ── Toutes les catégories (plateforme + dataset) ──────────────────────────────
const CATEGORIES = [
  '', 'marbre', 'granit', 'ciment', 'sable', 'carrelage', 'brique', 'bois',
  'acier', 'verre', 'peinture', 'plomberie', 'électricité', 'isolation',
  'quincaillerie', 'maconnerie', 'etancheite', 'menuiserie', 'revetement', 'autre',
];



// ── Star rating ───────────────────────────────────────────────────────────────
const StarRating = ({ value }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(n => (
      <span key={n} style={{ color: n <= Math.round(value || 0) ? '#f59e0b' : '#d1d5db', fontSize: '1rem' }}>★</span>
    ))}
  </div>
);



// ─────────────────────────────────────────────────────────────────────────────

const CatalogPage = () => {
  const dispatch = useDispatch();
  const { items: products, pagination, loading, filters } = useSelector((s) => s.products);
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => { dispatch(fetchProducts(filters)); }, [filters]);

  // Debounced live search
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== filters.search) dispatch(setFilters({ search: localSearch, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch]);

  const updateFilter = (key, value) => dispatch(setFilters({ [key]: value, page: 1 }));

  const getPaginationRange = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const datasetCount = products.filter(p => p.fromDataset).length;
  const platformCount = products.filter(p => !p.fromDataset).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ── */}
      <div>
        <h2 style={{ margin: 0 }}>Catalogue de produits</h2>
        <p style={{ color: 'var(--clr-text-muted)', margin: '0.25rem 0 0' }}>
          <strong>{pagination.total}</strong> produits disponibles
        </p>
      </div>

      {/* ── Search + Filters ── */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); updateFilter('search', localSearch); }}
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>

          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input
              className="form-input"
              placeholder="Rechercher un produit, marque, localisation..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>

          <select className="form-input form-select" style={{ width: 180 }}
            value={filters.category || ''} onChange={(e) => updateFilter('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Toutes catégories'}
              </option>
            ))}
          </select>

          <input className="form-input" type="number" placeholder="Prix min" style={{ width: 100 }}
            value={filters.minPrice || ''} onChange={(e) => updateFilter('minPrice', e.target.value)} />
          <input className="form-input" type="number" placeholder="Prix max" style={{ width: 100 }}
            value={filters.maxPrice || ''} onChange={(e) => updateFilter('maxPrice', e.target.value)} />

          <select className="form-input form-select" style={{ width: 160 }}
            value={filters.sort || '-createdAt'} onChange={(e) => updateFilter('sort', e.target.value)}>
            <option value="-createdAt">Plus récents</option>
            <option value="-rating">Mieux notés</option>
            <option value="price">Prix croissant</option>
            <option value="-price">Prix décroissant</option>
          </select>

          <button type="submit" className="btn btn-primary">Rechercher</button>
        </form>
      </div>

      {/* ── Category chips ── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {CATEGORIES.filter(Boolean).map((c) => (
          <button key={c} className="btn btn-sm"
            style={{
              background: filters.category === c ? 'rgba(245,158,11,0.15)' : 'var(--clr-surface2)',
              border: `1px solid ${filters.category === c ? 'rgba(245,158,11,0.4)' : 'var(--clr-border)'}`,
              color: filters.category === c ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
              fontSize: '0.78rem',
            }}
            onClick={() => updateFilter('category', filters.category === c ? '' : c)}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Products grid ── */}
      {loading ? (
        <div className="grid-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontWeight: 600 }}>Aucun produit trouvé</div>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Essayez une autre catégorie ou modifiez votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid-auto">
          {products.map((p) => (
            <Link to={`/dashboard/catalog/${p._id}`} key={p._id} style={{ textDecoration: 'none' }}>
              <div className="product-card" style={{ position: 'relative' }}>

                {/* Image */}
                <div className="product-card-img">
                  {getProductImage(p) ? (
                    <img src={getProductImage(p)} alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '2rem', color: 'var(--clr-text-muted)' }}>{p.category?.[0]?.toUpperCase()}</span>
                  )}
                </div>

                <div className="product-card-body">
                  {/* Category */}
                  <div className="product-card-cat">
                    {p.category}
                    {p.localisation && (
                      <span style={{ marginLeft: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.75rem' }}>
                        {p.localisation}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="product-card-name" style={{ fontSize: '0.88rem', lineHeight: 1.3 }}>
                    {p.name.replace(/\s*\(\d+\s*étoiles\)/, '').substring(0, 60)}
                    {p.name.length > 60 ? '…' : ''}
                  </div>

                  {/* Brand */}
                  {p.marque && (
                    <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, margin: '2px 0' }}>
                      {p.marque}
                    </div>
                  )}

                  {/* Stars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.4rem 0' }}>
                    <StarRating value={p.rating?.average || p.aiQualite || 0} />
                    <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.78rem' }}>
                      ({p.rating?.count || 0})
                    </span>
                  </div>


                  {/* Price + availability */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <div>
                      <span className="product-card-price">{p.price} DT</span>
                      <span className="product-card-unit"> / {p.unit}</span>
                    </div>
                    <span className={`badge ${p.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                      {p.isAvailable ? 'Disponible' : 'Epuisé'}
                    </span>
                  </div>

                  {/* Supplier */}
                  {p.supplier && (
                    <div style={{
                      marginTop: '0.6rem', paddingTop: '0.6rem',
                      borderTop: '1px solid var(--clr-border)',
                      fontSize: '0.78rem', color: 'var(--clr-text-muted)',
                    }}>
                      {p.supplier.companyName || `${p.supplier.firstName || ''} ${p.supplier.lastName || ''}`.trim()}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-sm btn-secondary"
            disabled={(filters.page || 1) === 1}
            onClick={() => dispatch(setFilters({ page: (filters.page || 1) - 1 }))}>
            &laquo;
          </button>

          {getPaginationRange(filters.page || 1, pagination.pages).map((p, index) => (
            p === '...' ? (
              <span key={`dots-${index}`} style={{ padding: '0.5rem', color: 'var(--clr-text-muted)' }}>...</span>
            ) : (
              <button key={p}
                className={`btn btn-sm ${p === (filters.page || 1) ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => dispatch(setFilters({ page: p }))}>
                {p}
              </button>
            )
          ))}

          <button className="btn btn-sm btn-secondary"
            disabled={(filters.page || 1) === pagination.pages}
            onClick={() => dispatch(setFilters({ page: (filters.page || 1) + 1 }))}>
            &raquo;
          </button>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
