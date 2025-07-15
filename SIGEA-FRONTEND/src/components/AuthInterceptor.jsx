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
    const authHandler = async (status, message) => {
      const result = await handleAuthError(status, message);

      if (result && result.shouldShowError) {
        showError(
          'Sesión Invalidada',
          'Tu sesión ha sido invalidada y se cerró la sesión de forma automática.',
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
