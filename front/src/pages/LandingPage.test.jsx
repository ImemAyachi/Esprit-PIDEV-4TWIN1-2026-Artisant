import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandingPage from './LandingPage';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

// Mock child component to avoid complex sub-rendering
vi.mock('../components/landing/ProductsCarousel', () => ({
  default: () => <div data-testid="products-carousel">Carousel Mock</div>
}));

const createMockStore = (initialState) => configureStore({
  reducer: {
    auth: (state = initialState.auth || { isAuthenticated: false }) => state,
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

describe('LandingPage Component', () => {
  it('should render the landing page title', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/Connectez/i)).toBeDefined();
    expect(screen.getByText(/Architectes, Artisans/i)).toBeDefined();
  });

  it('should show "S\'inscrire" button when not authenticated', () => {
    renderWithProviders(<LandingPage />, { initialState: { auth: { isAuthenticated: false } } });
    expect(screen.getByText("S'inscrire")).toBeDefined();
  });

  it('should show "Mon espace" button when authenticated', () => {
    renderWithProviders(<LandingPage />, { initialState: { auth: { isAuthenticated: true } } });
    expect(screen.getByText('Mon espace')).toBeDefined();
  });

  it('should render the products carousel', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByTestId('products-carousel')).toBeDefined();
  });

  it('should render the footer with contact info', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText('artisanetcommunity@gmail.com')).toBeDefined();
  });
});
