import React from 'react';
import ReactDOM from 'react-dom/client';
import 'lxgw-wenkai-webfont/lxgwwenkai-bold.css';
import 'lxgw-wenkai-webfont/lxgwwenkai-regular.css';
import App from './App';
import './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
