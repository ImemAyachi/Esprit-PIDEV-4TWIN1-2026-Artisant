import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Topbar from './Topbar';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

// Simple mock store setup
const createMockStore = (initialState = {}) => configureStore({
  reducer: {
    auth: (state = initialState.auth || { user: null }) => state,
    notifications: (state = initialState.notifications || { items: [], unreadCount: 0 }) => state,
    ui: (state = initialState.ui || {}) => state,
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

describe('Topbar Component', () => {
  it('should render the topbar with title', () => {
    renderWithProviders(<Topbar />);
    // Default title is Artisanet because location is / (not in PAGE_TITLES)
    expect(screen.getByText('Artisanet')).toBeDefined();
  });

  it('should display unread notification count', () => {
    const initialState = {
      notifications: { items: [], unreadCount: 5 }
    };
    renderWithProviders(<Topbar />, { initialState });
    expect(screen.getByText('5')).toBeDefined();
  });

  it('should toggle notifications panel when clicking the bell', () => {
    const initialState = {
      notifications: { items: [{ _id: '1', title: 'Test Notif', message: 'Hello' }], unreadCount: 1 }
    };
    renderWithProviders(<Topbar />, { initialState });
    
    const bellButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellButton);
    
    expect(screen.getByText('Test Notif')).toBeDefined();
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('should render user initials in avatar', () => {
    const initialState = {
      auth: { user: { firstName: 'Imem', lastName: 'Ayachi' } }
    };
    renderWithProviders(<Topbar />, { initialState });
    expect(screen.getByText('IA')).toBeDefined();
  });
});
