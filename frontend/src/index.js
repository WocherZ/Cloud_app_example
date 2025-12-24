// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Или 'react-dom' для старых версий
import './index.css';
import App from './App';
// import reportWebVitals from './reportWebVitals'; // Эту строку мы либо оставим, либо удалим/закомментируем

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);