import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress sandbox-specific WebSocket connection warnings and prevent overlays/popups
if (typeof window !== 'undefined') {
  const suppressBenignWS = (event: PromiseRejectionEvent | ErrorEvent) => {
    const msg = 'reason' in event 
      ? (event.reason?.message || String(event.reason)) 
      : (event.message || '');
    if (msg && (msg.toLowerCase().includes('websocket') || msg.toLowerCase().includes('ws://') || msg.toLowerCase().includes('wss://'))) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  window.addEventListener('unhandledrejection', suppressBenignWS, true);
  window.addEventListener('error', suppressBenignWS, true);
}

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <App />
  </StrictMode>,
);
