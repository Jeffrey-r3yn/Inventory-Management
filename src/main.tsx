import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Remove legacy demo data; retain real per-account pending transactions.
for (const key of Object.keys(localStorage)) {
  if (key.startsWith('inventory-data-') || key === 'inventory-demo-queue' || key === 'activeUserId') localStorage.removeItem(key);
}

// Registrasi Service Worker (PWA) — auto-update saat ada versi baru
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
