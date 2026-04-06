import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchProducts = createAsyncThunk('products/fetch', async (params, { rejectWithValue }) => {
  try {
    const res = await api.get('/products', { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchProductById = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/products/${id}`);
    return res.data.product;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const createProduct = createAsyncThunk('products/create', async (formData, { rejectWithValue }) => {
  try {
    const res = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.product;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items:      [],
    current:    null,
    pagination: { total: 0, page: 1, pages: 1 },
    loading:    false,
    error:      null,
    filters:    { category: '', search: '', minPrice: '', maxPrice: '', sort: '-createdAt' },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrent: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,    (s) => { s.loading = true; })
      .addCase(fetchProducts.fulfilled,  (s, { payload }) => {
        s.loading    = false;
        s.items      = payload.products;
        s.pagination = payload.pagination;
      })
      .addCase(fetchProducts.rejected,   (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(fetchProductById.pending,   (s) => { s.loading = true; })
      .addCase(fetchProductById.fulfilled, (s, { payload }) => { s.loading = false; s.current = payload; })
      .addCase(fetchProductById.rejected,  (s, { payload }) => { s.loading = false; s.error = payload; })
      .addCase(createProduct.fulfilled,    (s, { payload }) => { s.items.unshift(payload); });
  },
});

export const { setFilters, clearCurrent } = productSlice.actions;
export default productSlice.reducer;
