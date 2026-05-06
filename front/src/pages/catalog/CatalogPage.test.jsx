import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CatalogPage from './CatalogPage';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

// Mock utils
vi.mock('../../utils/imageUrl', () => ({
  getProductImage: vi.fn(() => 'test-image.jpg')
}));

const createMockStore = (initialState) => configureStore({
  reducer: {
    products: (state = initialState.products || { items: [], pagination: { total: 0, pages: 0 }, loading: false, filters: {} }) => state,
  },
});

const renderWithProviders = (ui, { initialState = {} } = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>
  );
};

describe('CatalogPage Component', () => {
  it('should render the catalog title and product count', () => {
    const initialState = {
      products: {
        items: [],
        pagination: { total: 42, pages: 1 },
        loading: false,
        filters: {}
      }
    };
    renderWithProviders(<CatalogPage />, { initialState });
    expect(screen.getByText('Catalogue de produits')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
  });

  it('should display skeletons when loading', () => {
    const initialState = {
      products: {
        items: [],
        pagination: { total: 0, pages: 0 },
        loading: true,
        filters: {}
      }
    };
    const { container } = renderWithProviders(<CatalogPage />, { initialState });
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('should display products when available', () => {
    const initialState = {
      products: {
        items: [
          { _id: '1', name: 'Marteau de test', price: 15, unit: 'pce', isAvailable: true, category: 'Outils', fromDataset: false }
        ],
        pagination: { total: 1, pages: 1 },
        loading: false,
        filters: {}
      }
    };
    renderWithProviders(<CatalogPage />, { initialState });
    expect(screen.getByText('Marteau de test')).toBeDefined();
    expect(screen.getByText('15 DT')).toBeDefined();
    expect(screen.getByText('Disponible')).toBeDefined();
  });

  it('should handle search input change', () => {
    const initialState = {
      products: {
        items: [],
        pagination: { total: 0, pages: 0 },
        loading: false,
        filters: {}
      }
    };
    renderWithProviders(<CatalogPage />, { initialState });
    const input = screen.getByPlaceholderText(/Rechercher un produit/i);
    fireEvent.change(input, { target: { value: 'scie' } });
    expect(input.value).toBe('scie');
  });
});
