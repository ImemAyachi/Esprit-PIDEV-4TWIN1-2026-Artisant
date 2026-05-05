import { describe, it, expect, vi, beforeEach } from 'vitest';
import authReducer, { logout, updateUser } from './authSlice';

// Mocking dependencies
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    require2FA: false,
    tempEmail: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('reducers', () => {
    it('should handle logout', () => {
      const stateWithUser = {
        ...initialState,
        user: { name: 'Test User' },
        token: 'fake-token',
        isAuthenticated: true,
      };
      const nextState = authReducer(stateWithUser, logout());
      expect(nextState.user).toBeNull();
      expect(nextState.token).toBeNull();
      expect(nextState.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should handle updateUser', () => {
      const stateWithUser = {
        ...initialState,
        user: { firstName: 'Old' },
      };
      const nextState = authReducer(stateWithUser, updateUser({ firstName: 'New' }));
      expect(nextState.user.firstName).toBe('New');
      expect(JSON.parse(localStorage.getItem('user')).firstName).toBe('New');
    });
  });

  describe('extraReducers', () => {
    it('should handle registerUser.pending', () => {
      const action = { type: 'auth/register/pending' };
      const nextState = authReducer(initialState, action);
      expect(nextState.loading).toBe(true);
      expect(nextState.error).toBeNull();
    });

    it('should handle registerUser.fulfilled with 2FA', () => {
      const payload = { require2FA: true, email: 'test@test.com', message: 'Code sent' };
      const action = { type: 'auth/register/fulfilled', payload };
      const nextState = authReducer(initialState, action);
      expect(nextState.loading).toBe(false);
      expect(nextState.require2FA).toBe(true);
      expect(nextState.tempEmail).toBe('test@test.com');
    });

    it('should handle loginUser.fulfilled', () => {
      const payload = { user: { firstName: 'Ala' }, token: 'secret-jwt' };
      const action = { type: 'auth/login/fulfilled', payload };
      const nextState = authReducer(initialState, action);
      expect(nextState.isAuthenticated).toBe(true);
      expect(nextState.user.firstName).toBe('Ala');
      expect(nextState.token).toBe('secret-jwt');
      expect(localStorage.getItem('token')).toBe('secret-jwt');
    });

    it('should handle loginUser.rejected', () => {
      const action = { type: 'auth/login/rejected', payload: 'Invalid credentials' };
      const nextState = authReducer(initialState, action);
      expect(nextState.loading).toBe(false);
      expect(nextState.error).toBe('Invalid credentials');
    });
  });
});
