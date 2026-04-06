import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async () => {
  const res = await api.get('/notifications');
  return res.data;
});
export const markAllRead = createAsyncThunk('notifications/markAll', async () => {
  await api.put('/notifications/read-all');
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0, loading: false },
  reducers: {
    addNotification: (state, { payload }) => {
      state.items.unshift(payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (s, { payload }) => {
        s.items       = payload.notifications;
        s.unreadCount = payload.unreadCount;
        s.loading     = false;
      })
      .addCase(markAllRead.fulfilled, (s) => {
        s.items       = s.items.map(n => ({ ...n, isRead: true }));
        s.unreadCount = 0;
      });
  },
});
export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
