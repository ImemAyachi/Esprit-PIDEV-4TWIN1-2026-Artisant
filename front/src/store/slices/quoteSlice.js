import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const fetchQuotes    = createAsyncThunk('quotes/fetch',   async (p, { rejectWithValue }) => { try { const r = await api.get('/quotes', { params: p }); return r.data; } catch(e) { return rejectWithValue(e.response?.data?.message); } });
export const createQuote    = createAsyncThunk('quotes/create',  async (d, { rejectWithValue }) => { try { const r = await api.post('/quotes', d); return r.data.quote; } catch(e) { return rejectWithValue(e.response?.data?.message); } });
export const submitQuote    = createAsyncThunk('quotes/submit',  async ({ id, data }, { rejectWithValue }) => { try { const r = await api.put(`/quotes/${id}/submit`, data); return r.data.quote; } catch(e) { return rejectWithValue(e.response?.data?.message); } });
export const acceptQuote    = createAsyncThunk('quotes/accept',  async (id, { rejectWithValue }) => { try { const r = await api.put(`/quotes/${id}/accept`); return r.data.quote; } catch(e) { return rejectWithValue(e.response?.data?.message); } });
export const refuseQuote    = createAsyncThunk('quotes/refuse',  async ({ id, reason }, { rejectWithValue }) => { try { const r = await api.put(`/quotes/${id}/refuse`, { reason }); return r.data.quote; } catch(e) { return rejectWithValue(e.response?.data?.message); } });

const updateQuote = (state, updated) => {
  const idx = state.items.findIndex(q => q._id === updated._id);
  if (idx !== -1) state.items[idx] = updated;
  if (state.current?._id === updated._id) state.current = updated;
};

const quoteSlice = createSlice({
  name: 'quotes',
  initialState: { items: [], current: null, pagination: {}, loading: false, error: null },
  reducers: { setCurrent: (s, a) => { s.current = a.payload; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotes.pending,   (s) => { s.loading = true; })
      .addCase(fetchQuotes.fulfilled, (s, { payload }) => { s.loading = false; s.items = payload.quotes; s.pagination = payload.pagination; })
      .addCase(fetchQuotes.rejected,  (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(createQuote.fulfilled, (s, { payload }) => { s.items.unshift(payload); toast.success('Demande de devis envoyée !'); })
      .addCase(createQuote.rejected,  (s, { payload }) => { toast.error(payload); })
      .addCase(submitQuote.fulfilled, (s, { payload }) => { updateQuote(s, payload); toast.success('Devis soumis !'); })
      .addCase(acceptQuote.fulfilled, (s, { payload }) => { updateQuote(s, payload); toast.success('Devis accepté !'); })
      .addCase(refuseQuote.fulfilled, (s, { payload }) => { updateQuote(s, payload); toast.success('Devis refusé'); });
  },
});
export const { setCurrent } = quoteSlice.actions;
export default quoteSlice.reducer;
