import { describe, it, expect } from 'vitest';
import uiReducer, { toggleSidebar, openModal, closeModal, setTheme } from './uiSlice';

describe('uiSlice', () => {
  const initialState = { sidebarOpen: true, modalOpen: null, theme: 'dark' };

  it('should handle toggleSidebar', () => {
    const state = { sidebarOpen: false };
    const nextState = uiReducer(state, toggleSidebar());
    expect(nextState.sidebarOpen).toBe(true);
  });

  it('should handle openModal', () => {
    const nextState = uiReducer(initialState, openModal('confirm'));
    expect(nextState.modalOpen).toBe('confirm');
  });

  it('should handle closeModal', () => {
    const state = { modalOpen: 'confirm' };
    const nextState = uiReducer(state, closeModal());
    expect(nextState.modalOpen).toBeNull();
  });

  it('should handle setTheme', () => {
    const nextState = uiReducer(initialState, setTheme('light'));
    expect(nextState.theme).toBe('light');
  });
});
