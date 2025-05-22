import React, { createContext, useContext, useRef } from 'react';
import { Toast } from 'primereact/toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const toastRef = useRef(null);

  const showSuccess = (summary, detail, life = 3000) => {
    toastRef.current?.show({ severity: 'success', summary, detail, life });
  };

  const showError = (summary, detail, life = 3000) => {
    toastRef.current?.show({ severity: 'error', summary, detail, life });
  };

  const showWarn = (summary, detail, life = 3000) => {
    toastRef.current?.show({ severity: 'warn', summary, detail, life });
  };

  return (
    <>
      <Toast ref={toastRef} />
      <ToastContext.Provider value={{ showSuccess, showError, showWarn }}>
        {children}
      </ToastContext.Provider>
    </>
  );
};

export const useToast = () => useContext(ToastContext);
