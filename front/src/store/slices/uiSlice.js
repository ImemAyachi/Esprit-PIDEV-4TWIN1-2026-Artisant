import { createSlice } from '@reduxjs/toolkit';
const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, modalOpen: null, theme: 'dark' },
  reducers: {
    toggleSidebar: (s) => { s.sidebarOpen = !s.sidebarOpen; },
    openModal:     (s, a) => { s.modalOpen = a.payload; },
    closeModal:    (s) => { s.modalOpen = null; },
    setTheme:      (s, a) => { s.theme = a.payload; },
  },
});
export const { toggleSidebar, openModal, closeModal, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
