import React, { createContext, useContext } from 'react';
import { useNotifications } from '../../utils/hooks/useNotifications';

const NotificationContext = createContext();

/**
 * Provider para manejar notificaciones globalmente
 * Usa el hook useNotifications internamente
 */
export const NotificationProvider = ({ children }) => {
  const notificationState = useNotifications();

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook para usar el contexto de notificaciones
 */
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;