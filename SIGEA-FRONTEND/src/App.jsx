import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import { ToastProvider } from './components/providers/ToastProvider';
import { ConfirmDialogProvider } from './components/providers/ConfirmDialogProvider';
import { NotificationProvider } from './components/providers/NotificationProvider';
import AuthInterceptor from './components/AuthInterceptor';

export default function App() {
  return (
    <BrowserRouter basename="/sigea">
      <ToastProvider>
        <ConfirmDialogProvider>
          <AuthInterceptor>
            <NotificationProvider>
              <AppRouter />
            </NotificationProvider>
          </AuthInterceptor>
        </ConfirmDialogProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}