import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Prevent wallet provider conflicts
if (typeof window !== 'undefined' && !(window as any).ethereum) {
  Object.defineProperty(window, 'ethereum', {
    configurable: true,
    value: undefined,
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
