import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Silencing noisy WASM/Mediapipe logs for a clean console as requested
const originalWarn = console.warn;
const originalLog = console.log;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('vision_wasm') || args[0].includes('gl_context'))) return;
  originalWarn(...args);
};
console.log = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('vision_wasm') || args[0].includes('custom_dbg'))) return;
  originalLog(...args);
};


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
