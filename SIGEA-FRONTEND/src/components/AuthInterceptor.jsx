import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './providers/ToastProvider';
import { setAuthHandlers } from '../api/fetchWrapper';

/**
 * Componente que conecta el AuthContext con el fetchWrapper
 * para manejar errores de autenticación automáticamente
 */
export default function AuthInterceptor({ children }) {
  const { handleAuthError } = useAuth();
  const { showError } = useToast();

  useEffect(() => {
    const authHandler = async (status, message, endpoint, hadAuthToken) => {
      const result = await handleAuthError(status, message, endpoint, hadAuthToken);

      if (result && result.shouldShowError) {
        showError(
          'Error',
          'Tu sesión se ha cerrado automáticamente debido a un error inesperado.',
          5000 // 5 segundos
        );
      }
    };

    setAuthHandlers({
      handleAuthError: authHandler,
    });

    return () => {
      setAuthHandlers(null);
    };
  }, [handleAuthError, showError]);

  return children;
}
