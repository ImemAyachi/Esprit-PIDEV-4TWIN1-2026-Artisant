import { describe, it, expect } from 'vitest';
import productReducer, { setFilters, clearCurrent, fetchProducts } from './productSlice';

describe('productSlice', () => {
  const initialState = {
    items:      [],
    current:    null,
    pagination: { total: 0, page: 1, pages: 1 },
    loading:    false,
    error:      null,
    filters:    { category: '', search: '', minPrice: '', maxPrice: '', sort: '-createdAt', page: 1, limit: 24 },
  };

  it('should handle setFilters', () => {
    const nextState = productReducer(initialState, setFilters({ search: 'test' }));
    expect(nextState.filters.search).toBe('test');
  });

  it('should handle clearCurrent', () => {
    const state = { ...initialState, current: { id: 1 } };
    const nextState = productReducer(state, clearCurrent());
    expect(nextState.current).toBeNull();
  });

  it('should handle fetchProducts.pending', () => {
    const action = { type: fetchProducts.pending.type };
    const nextState = productReducer(initialState, action);
    expect(nextState.loading).toBe(true);
  });

  it('should handle fetchProducts.fulfilled', () => {
    const payload = { products: [{ id: 1 }], pagination: { total: 1 } };
    const action = { type: fetchProducts.fulfilled.type, payload };
    const nextState = productReducer(initialState, action);
    expect(nextState.items).toEqual(payload.products);
    expect(nextState.loading).toBe(false);
  });
});
