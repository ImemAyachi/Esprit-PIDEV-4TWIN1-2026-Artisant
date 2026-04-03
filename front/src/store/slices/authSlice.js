import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Charger l'état initial depuis localStorage (persistance de session)
const savedUser  = JSON.parse(localStorage.getItem('user')  || 'null');
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
    return rejectWithValue(err.response?.data?.message || 'Erreur connexion');
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

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:      savedUser,
    token:     savedToken,
    loading:   false,
    error:     null,
    isAuthenticated: !!savedToken,
  },
  reducers: {
    logout: (state) => {
      state.user  = null;
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
      .addCase(registerUser.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(registerUser.fulfilled, (s, { payload }) => {
        s.loading        = false;
        s.token          = payload.token;
        s.user           = payload.user;
        s.isAuthenticated = true;
        localStorage.setItem('token', payload.token);
        localStorage.setItem('user',  JSON.stringify(payload.user));
        toast.success('Compte créé avec succès !');
      })
      .addCase(registerUser.rejected,  (s, { payload }) => { s.loading = false; s.error = payload; toast.error(payload); })
      // Login
      .addCase(loginUser.pending,      (s) => { s.loading = true;  s.error = null; })
      .addCase(loginUser.fulfilled,    (s, { payload }) => {
        s.loading        = false;
        s.token          = payload.token;
        s.user           = payload.user;
        s.isAuthenticated = true;
        localStorage.setItem('token', payload.token);
        localStorage.setItem('user',  JSON.stringify(payload.user));
        toast.success(`Bienvenue, ${payload.user.firstName} !`);
      })
      .addCase(loginUser.rejected,     (s, { payload }) => { s.loading = false; s.error = payload; toast.error(payload); })
      // Fetch me
      .addCase(fetchMe.fulfilled,      (s, { payload }) => {
        s.user = payload;
        localStorage.setItem('user', JSON.stringify(payload));
      });
  },
});

export const { logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
