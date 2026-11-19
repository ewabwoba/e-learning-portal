import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { DataProvider } from './application/DataContext';
import { AuthProvider } from './application/AuthContext';
import { ToastProvider } from './application/ToastContext';
import { PageLoader } from './presentation/components/States';
import './styles/base.css';
import './styles/components.css';
import './styles/public.css';
import './styles/app.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DataProvider fallback={<PageLoader label="Starting Coursely" />}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </DataProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
