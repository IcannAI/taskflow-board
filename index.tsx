import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// index.css 已在 index.html 透過 <link href="/index.css"> 載入，無需在此 import

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);