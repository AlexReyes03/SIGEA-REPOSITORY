import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import { ToastProvider } from './components/providers/ToastProvider';
import { ConfirmDialogProvider } from './components/providers/ConfirmDialogProvider';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmDialogProvider>
          <AppRouter />
        </ConfirmDialogProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
