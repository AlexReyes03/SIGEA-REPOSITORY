import React from 'react';
import { createRoot } from 'react-dom/client';
import PrimeReact from 'primereact/api';

import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext';

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// PrimeReact
import 'primereact/resources/primereact.min.css';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import 'primeicons/primeicons.css';

// Styles
import './assets/css/login-styles.css'
import './assets/css/global-styles.css'

PrimeReact.ripple = true;

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
