import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Charger l'état initial depuis localStorage (persistance de session)
const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
const savedToken = localStorage.getItem('token') || null;

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Erreur inscription');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  } catch (err) {
    if (err.response?.status === 403 && err.response?.data?.require2FA) {
      return rejectWithValue(err.response.data);
    }
    return rejectWithValue(err.response?.data?.message || 'Erreur connexion');
  }
});

export const verify2FACode = createAsyncThunk('auth/verify2FA', async ({ email, code }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/verify-2fa', { email, code });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Erreur vérification 2FA');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/auth/me', data);
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Erreur mise à jour');
  }
});

export const updateAvatar = createAsyncThunk('auth/updateAvatar', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.put('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Erreur upload photo');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser,
    token: savedToken,
    loading: false,
    error: null,
    isAuthenticated: !!savedToken,
    require2FA: false,
    tempEmail: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Déconnecté');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (s) => { s.loading = true; s.error = null; s.require2FA = false; })
      .addCase(registerUser.fulfilled, (s, { payload }) => {
        s.loading = false;
        if (payload.require2FA) {
          s.require2FA = true;
          s.tempEmail = payload.email;
          toast.success(payload.message || 'Code de confirmation envoyé');
        } else {
          s.token = payload.token;
          s.user = payload.user;
          s.isAuthenticated = true;
          localStorage.setItem('token', payload.token);
          localStorage.setItem('user', JSON.stringify(payload.user));
          toast.success('Compte créé avec succès !');
        }
      })
      .addCase(registerUser.rejected, (s, { payload }) => { s.loading = false; s.error = payload; toast.error(payload); })
      // Login
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.token = payload.token;
        s.user = payload.user;
        s.isAuthenticated = true;
        localStorage.setItem('token', payload.token);
        localStorage.setItem('user', JSON.stringify(payload.user));
        toast.success(`Bienvenue, ${payload.user?.firstName || ''} !`);
      })
      .addCase(loginUser.rejected, (s, { payload }) => { 
        s.loading = false;
        if (payload?.require2FA) {
          s.require2FA = true;
          s.tempEmail = payload.email;
          toast.error(payload.message);
        } else {
          s.error = payload;
          toast.error(typeof payload === 'string' ? payload : 'Erreur réseau');
        }
      })
      // Verify 2FA
      .addCase(verify2FACode.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(verify2FACode.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.require2FA = false;
        s.tempEmail = null;
        s.token = payload.token;
        s.user = payload.user;
        s.isAuthenticated = true;
        localStorage.setItem('token', payload.token);
        localStorage.setItem('user', JSON.stringify(payload.user));
        toast.success(`Bienvenue, ${payload.user.firstName} !`);
      })
      .addCase(verify2FACode.rejected, (s, { payload }) => { 
        s.loading = false; s.error = payload; toast.error(typeof payload === 'string' ? payload : 'Erreur code 2FA'); 
      })
      // Fetch me
      .addCase(fetchMe.fulfilled, (s, { payload }) => {
        s.user = payload;
        localStorage.setItem('user', JSON.stringify(payload));
      })
      .addCase(updateProfile.fulfilled, (s, { payload }) => {
        s.user = payload;
        localStorage.setItem('user', JSON.stringify(payload));
        toast.success('Profil mis à jour !');
      })
      .addCase(updateAvatar.fulfilled, (s, { payload }) => {
        s.user = payload;
        localStorage.setItem('user', JSON.stringify(payload));
        toast.success('Photo mise à jour !');
      });
  },
});

export const { logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
