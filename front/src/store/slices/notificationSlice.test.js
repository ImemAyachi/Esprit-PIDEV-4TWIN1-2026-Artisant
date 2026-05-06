import { describe, it, expect } from 'vitest';
import notificationReducer, { addNotification, fetchNotifications, markAllRead } from './notificationSlice';

describe('notificationSlice', () => {
  const initialState = { items: [], unreadCount: 0, loading: false };

  it('should handle addNotification', () => {
    const nextState = notificationReducer(initialState, addNotification({ _id: '1', title: 'New' }));
    expect(nextState.items.length).toBe(1);
    expect(nextState.unreadCount).toBe(1);
  });

  it('should handle fetchNotifications.fulfilled', () => {
    const payload = { notifications: [{ _id: '1' }], unreadCount: 1 };
    const action = { type: fetchNotifications.fulfilled.type, payload };
    const nextState = notificationReducer(initialState, action);
    expect(nextState.items).toEqual(payload.notifications);
    expect(nextState.unreadCount).toBe(1);
  });

  it('should handle markAllRead.fulfilled', () => {
    const state = { items: [{ _id: '1', isRead: false }], unreadCount: 1 };
    const action = { type: markAllRead.fulfilled.type };
    const nextState = notificationReducer(state, action);
    expect(nextState.items[0].isRead).toBe(true);
    expect(nextState.unreadCount).toBe(0);
  });
});
