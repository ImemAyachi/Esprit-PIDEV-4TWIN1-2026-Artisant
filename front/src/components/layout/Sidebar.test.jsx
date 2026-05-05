import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

const createMockStore = (initialState = {}) => configureStore({
  reducer: {
    auth: (state = initialState.auth || { user: { role: 'SuperAdmin' } }) => state,
    ui: (state = initialState.ui || { sidebarOpen: true }) => state,
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

describe('Sidebar Component', () => {
  it('should render sidebar links', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText('Tableau de bord')).toBeDefined();
    expect(screen.getByText('Catalogue')).toBeDefined();
  });

  it('should show admin links only for SuperAdmin users', () => {
    const initialState = {
      auth: { user: { role: 'SuperAdmin' } }
    };
    renderWithProviders(<Sidebar />, { initialState });
    expect(screen.getByText('Utilisateurs')).toBeDefined();
  });

  it('should not show admin links for Artisans', () => {
    const initialState = {
      auth: { user: { role: 'Artisan' } }
    };
    renderWithProviders(<Sidebar />, { initialState });
    // 'Utilisateurs' is only for SuperAdmin
    expect(screen.queryByText('Utilisateurs')).toBeNull();
  });
});
