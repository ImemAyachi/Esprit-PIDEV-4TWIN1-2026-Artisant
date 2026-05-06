import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

// Mock child component and thunks
vi.mock('../../components/auth/FaceLogin', () => ({
  default: () => <div>Face Login Mock</div>
}));

const mockLoginUser = vi.fn(() => ({
  meta: { requestStatus: 'fulfilled' }
}));

vi.mock('../../store/slices/authSlice', () => ({
  loginUser: (data) => mockLoginUser(data),
  faceLoginUser: vi.fn()
}));

const createMockStore = (initialState) => configureStore({
  reducer: {
    auth: (state = initialState.auth || { loading: false, error: null }) => state,
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

describe('LoginPage Component', () => {
  it('should render login form', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Connexion')).toBeDefined();
    expect(screen.getByPlaceholderText('votre@email.com')).toBeDefined();
    expect(screen.getByPlaceholderText('••••••••')).toBeDefined();
  });

  it('should show error message from redux state', () => {
    const initialState = { auth: { loading: false, error: 'Identifiants invalides' } };
    renderWithProviders(<LoginPage />, { initialState });
    expect(screen.getByText('Identifiants invalides')).toBeDefined();
  });

  it('should toggle face login modal', () => {
    renderWithProviders(<LoginPage />);
    const faceBtn = screen.getByText('Se connecter avec le visage');
    fireEvent.click(faceBtn);
    expect(screen.getByText('Face Login Mock')).toBeDefined();
  });

  it('should validate empty fields', async () => {
    renderWithProviders(<LoginPage />);
    const submitBtn = screen.getByText('Se connecter →');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Email requis')).toBeDefined();
      expect(screen.getByText('Mot de passe requis')).toBeDefined();
    });
  });
});
