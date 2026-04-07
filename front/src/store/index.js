/**
 * Redux store — Configuration centrale avec Redux Toolkit
 *
 * Pourquoi Redux Toolkit ?
 * - Réduit le boilerplate de Redux classique (createSlice vs actions/reducers séparés)
 * - Inclut Immer pour les mutations immuables lisibles
 * - RTK Query optionnel pour la mise en cache des requêtes
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import quoteReducer from './slices/quoteSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth:         authReducer,
    products:     productReducer,
    quotes:       quoteReducer,
    notifications: notificationReducer,
    ui:           uiReducer,
  },
  devTools: import.meta.env.DEV, // Redux DevTools uniquement en développement
});

export default store;
