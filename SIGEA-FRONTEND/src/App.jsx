import React from 'react';
import AppRouter from './routes/AppRouter';
import { ToastProvider } from './components/providers/ToastProvider';
import { ConfirmDialogProvider } from './components/providers/ConfirmDialogProvider';

export default function App() {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <AppRouter />
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}
