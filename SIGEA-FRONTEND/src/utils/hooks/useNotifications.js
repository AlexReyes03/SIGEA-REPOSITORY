import { useState, useEffect, useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { useAuth } from '../../contexts/AuthContext';
import { getNotificationCount, getNotificationsByUserId } from '../../api/notificationService';
import { BASE_URL } from '../../api/common-url';

/**
 * Hook para notificaciones con WebSocket en tiempo real
 * Versión optimizada para resolver problemas de conexión
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // Refs para WebSocket
  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  // Cargar notificaciones iniciales
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [notificationsData, countData] = await Promise.all([getNotificationsByUserId(user.id), getNotificationCount(user.id)]);

      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setNotificationCount(countData?.count || countData?.unreadCount || 0);

      console.log('✅ Notifications loaded:', notificationsData.length);
      console.log('✅ Count:', countData?.count || countData?.unreadCount || 0);
    } catch (err) {
      console.error('❌ Error loading notifications:', err);
      setNotifications([]);
      setNotificationCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Actualizar una notificación localmente
  const updateNotificationLocally = useCallback((notificationId, updates) => {
    setNotifications((prev) => prev.map((notification) => (notification.id === notificationId ? { ...notification, ...updates } : notification)));

    if ('read' in updates) {
      setNotificationCount((prev) => (updates.read ? Math.max(0, prev - 1) : prev + 1));
    }
  }, []);

  // Agregar nueva notificación
  const addNotification = useCallback((newNotification) => {
    setNotifications((prev) => [newNotification, ...prev]);
    if (!newNotification.read) {
      setNotificationCount((prev) => prev + 1);
    }
  }, []);

  // Eliminar notificación localmente
  const removeNotificationLocally = useCallback((notificationId) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      const newNotifications = prev.filter((n) => n.id !== notificationId);

      if (notification && !notification.read) {
        setNotificationCount((prevCount) => Math.max(0, prevCount - 1));
      }

      return newNotifications;
    });
  }, []);

  // Manejar mensajes del WebSocket
  const handleWebSocketMessage = useCallback(
    (message) => {
      try {
        const parsedMessage = JSON.parse(message.body);
        const { type, data } = parsedMessage;

        console.log('📨 WebSocket message received:', { type, data });

        switch (type) {
          case 'NOTIFICATION':
            const notification = {
              id: data.id,
              type: data.type,
              title: data.title,
              message: data.message,
              userId: data.userId,
              read: data.isRead || false,
              readAt: data.isRead ? new Date().toISOString() : null,
              createdAt: data.createdAt,
              route: data.route || '/',
              json: data.json || '{}',
            };
            addNotification(notification);
            console.log('🔔 New notification added:', notification.title);
            break;

          case 'NOTIFICATION_COUNT':
            setNotificationCount(data.unreadCount || 0);
            console.log('🔄 Count updated to:', data.unreadCount);
            break;

          case 'CONNECTION_STATUS':
            console.log('🔗 Connection status:', data);
            break;

          case 'ERROR':
            console.error('❌ WebSocket error:', data);
            break;

          default:
            console.warn('❓ Unknown message type:', type);
        }
      } catch (err) {
        console.error('❌ Error parsing WebSocket message:', err);
      }
    },
    [addNotification]
  );

  // Conectar WebSocket
  const connectWebSocket = useCallback(() => {
    if (!user?.id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No JWT token found');
      return;
    }

    // Desconectar conexión anterior
    disconnectWebSocket();

    console.log('🔄 Connecting to WebSocket...');

    try {
      const socketUrl = `${BASE_URL}/ws`;
      console.log('🌐 WebSocket URL:', socketUrl);

      const socket = new SockJS(socketUrl);
      const stompClient = Stomp.over(socket);

      // Configurar debug mínimo
      stompClient.debug = (str) => {
        if (str.includes('CONNECTED') || str.includes('ERROR') || str.includes('DISCONNECT')) {
          console.log('🔧 STOMP:', str);
        }
      };

      // Headers de conexión
      const connectHeaders = {
        Authorization: `Bearer ${token}`,
      };

      // Conectar
      stompClient.connect(
        connectHeaders,
        (frame) => {
          console.log('✅ WebSocket connected successfully');
          setConnected(true);
          reconnectAttempts.current = 0;

          try {
            // Suscribirse a notificaciones
            const notificationSub = stompClient.subscribe(`/user/queue/notifications`, handleWebSocketMessage);

            // Suscribirse a conteo
            const countSub = stompClient.subscribe(`/user/queue/notification-count`, handleWebSocketMessage);

            subscriptionsRef.current = [notificationSub, countSub];
            stompClientRef.current = stompClient;

            console.log(`✅ Subscribed for user: ${user.id}`);
          } catch (subError) {
            console.error('❌ Subscription error:', subError);
          }
        },
        (error) => {
          console.error('❌ WebSocket connection failed:', error);
          setConnected(false);

          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttempts.current) * 2000;
            reconnectAttempts.current++;
            console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, delay);
          } else {
            console.log('❌ Max reconnection attempts reached');
          }
        }
      );
    } catch (err) {
      console.error('❌ WebSocket setup error:', err);
      setConnected(false);
    }
  }, [user?.id, handleWebSocketMessage]);

  // Desconectar WebSocket
  const disconnectWebSocket = useCallback(() => {
    // Limpiar subscripciones
    subscriptionsRef.current.forEach((sub) => {
      try {
        if (sub && sub.unsubscribe) sub.unsubscribe();
      } catch (err) {
        console.warn('⚠️ Error unsubscribing:', err);
      }
    });
    subscriptionsRef.current = [];

    // Desconectar cliente
    if (stompClientRef.current) {
      try {
        if (stompClientRef.current.connected) {
          stompClientRef.current.disconnect();
        }
      } catch (err) {
        console.warn('⚠️ Error disconnecting:', err);
      }
      stompClientRef.current = null;
    }

    // Limpiar timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  // Métodos stub
  const loadNotificationCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const countData = await getNotificationCount(user.id);
      setNotificationCount(countData?.count || countData?.unreadCount || 0);
    } catch (err) {
      console.error('❌ Error loading count:', err);
    }
  }, [user?.id]);

  // Efectos
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 Starting notifications for user:', user.id);
      loadNotifications();

      // Pequeña demora antes de conectar WebSocket
      const timeout = setTimeout(() => {
        connectWebSocket();
      }, 1000);

      return () => {
        clearTimeout(timeout);
        disconnectWebSocket();
      };
    }
  }, [user?.id, loadNotifications, connectWebSocket, disconnectWebSocket]);

  // Cleanup
  useEffect(() => {
    return () => disconnectWebSocket();
  }, [disconnectWebSocket]);

  return {
    notifications,
    notificationCount,
    loading,
    connected,
    loadNotifications,
    loadNotificationCount,
    updateNotificationLocally,
    addNotification,
    removeNotificationLocally,
    connectWebSocket,
    disconnectWebSocket,
    markAsReadLocally: (notificationId) => updateNotificationLocally(notificationId, { read: true, readAt: new Date().toISOString() }),
    markAsUnreadLocally: (notificationId) => updateNotificationLocally(notificationId, { read: false, readAt: null }),
  };
};
