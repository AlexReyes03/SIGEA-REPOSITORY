import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import { ToastProvider } from './components/providers/ToastProvider';
import { ConfirmDialogProvider } from './components/providers/ConfirmDialogProvider';
import AuthInterceptor from './components/AuthInterceptor'; // ← NUEVO IMPORT

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmDialogProvider>
          <AuthInterceptor>
            <AppRouter />
          </AuthInterceptor>
        </ConfirmDialogProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
