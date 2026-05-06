import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from './RegisterPage';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

// Mock child component and thunks
vi.mock('../../components/auth/FaceCapture', () => ({
  default: () => <div>Face Capture Mock</div>
}));

const mockRegisterUser = vi.fn(() => ({
  meta: { requestStatus: 'fulfilled' },
  payload: { require2FA: false }
}));

vi.mock('../../store/slices/authSlice', () => ({
  registerUser: (data) => mockRegisterUser(data),
  verify2FACode: vi.fn(),
  resetAuthState: vi.fn()
}));

const createMockStore = (initialState) => configureStore({
  reducer: {
    auth: (state = initialState.auth || { loading: false, error: null, require2FA: false, tempEmail: '' }) => state,
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

describe('RegisterPage Component', () => {
  it('should render register form with role selection', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText('Créer un compte')).toBeDefined();
    // Using getAllByText because it appears in both visual and form side
    expect(screen.getAllByText('Architecte').length).toBeGreaterThan(0);
  });

  it('should show extra fields for Artisan role', () => {
    const { container } = renderWithProviders(<RegisterPage />);
    // Target the specific button by ID to avoid ambiguity
    const artisanBtn = container.querySelector('#role-artisan');
    fireEvent.click(artisanBtn);
    expect(screen.getByText('Métier *')).toBeDefined();
  });

  it('should show 2FA form when require2FA is true', () => {
    const initialState = { auth: { require2FA: true, tempEmail: 'test@test.com', loading: false } };
    renderWithProviders(<RegisterPage />, { initialState });
    expect(screen.getByText(/Un e-mail de confirmation/i)).toBeDefined();
    expect(screen.getByPlaceholderText('123456')).toBeDefined();
  });

  it('should validate form fields', async () => {
    renderWithProviders(<RegisterPage />);
    const submitBtn = screen.getByText('Créer mon compte →');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Choisissez un rôle')).toBeDefined();
      expect(screen.getByText('Email requis')).toBeDefined();
    });
  });
});
