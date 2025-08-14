import { useState, useEffect, useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { useAuth } from '../../contexts/AuthContext';
import { getNotificationCount, getNotificationsByUserId } from '../../api/notificationService';
import { BACKEND_BASE_URL } from '../../api/common-url';

/**
 * Hook personalizado para manejar notificaciones en tiempo real
 * Combina API REST + WebSocket para sincronización completa
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
  const maxReconnectAttempts = 5;

  // Cargar notificaciones iniciales
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [notificationsData, countData] = await Promise.all([
        getNotificationsByUserId(user.id),
        getNotificationCount(user.id)
      ]);

      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setNotificationCount(countData?.count || countData?.unreadCount || 0);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setNotifications([]);
      setNotificationCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Cargar solo el contador (más rápido para sidebar)
  const loadNotificationCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const countData = await getNotificationCount(user.id);
      setNotificationCount(countData?.count || countData?.unreadCount || 0);
    } catch (err) {
      console.error('Error loading notification count:', err);
      setNotificationCount(0);
    }
  }, [user?.id]);

  // Actualizar una notificación localmente
  const updateNotificationLocally = useCallback((notificationId, updates) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, ...updates }
          : notification
      )
    );

    // Actualizar contador si cambia el estado de lectura
    if ('read' in updates) {
      setNotificationCount(prev => 
        updates.read ? Math.max(0, prev - 1) : prev + 1
      );
    }
  }, []);

  // Agregar nueva notificación
  const addNotification = useCallback((newNotification) => {
    setNotifications(prev => [newNotification, ...prev]);
    if (!newNotification.read) {
      setNotificationCount(prev => prev + 1);
    }
  }, []);

  // Eliminar notificación localmente
  const removeNotificationLocally = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const newNotifications = prev.filter(n => n.id !== notificationId);
      
      // Actualizar contador si la notificación no estaba leída
      if (notification && !notification.read) {
        setNotificationCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return newNotifications;
    });
  }, []);

  // Manejar mensajes del WebSocket según tu estructura
  const handleWebSocketMessage = useCallback((message) => {
    try {
      const parsedMessage = JSON.parse(message.body);
      const { type, data } = parsedMessage;

      console.log('WebSocket message received:', { type, data });

      switch (type) {
        case 'NOTIFICATION':
          // data es NotificationWebSocketMessage
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
            json: data.json || '{}'
          };
          addNotification(notification);
          break;

        case 'NOTIFICATION_COUNT':
          // data es NotificationCountMessage
          setNotificationCount(data.unreadCount || 0);
          break;

        case 'CONNECTION_STATUS':
          console.log('Connection status:', data);
          break;

        case 'ERROR':
          console.error('WebSocket error message:', data);
          break;

        default:
          console.warn('Unknown WebSocket message type:', type);
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  }, [addNotification]);

  // Conectar WebSocket
  const connectWebSocket = useCallback(() => {
    if (!user?.id) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No JWT token found for WebSocket connection');
        return;
      }

      // Desconectar conexión anterior si existe
      disconnectWebSocket();

      const socketUrl = import.meta.env.VITE_WEBSOCKET_URL || `${BACKEND_BASE_URL}/ws`;
      const socket = new SockJS(socketUrl);
      const stompClient = Stomp.over(socket);

      // Configurar logging
      stompClient.debug = (str) => {
        console.log('STOMP:', str);
      };

      // Conectar con autenticación JWT
      stompClient.connect(
        { 
          Authorization: `Bearer ${token}`,
          'X-Auth-Token': token // Header alternativo por si acaso
        },
        (frame) => {
          console.log('Connected to WebSocket:', frame);
          setConnected(true);
          reconnectAttempts.current = 0;

          // Subscribirse a notificaciones del usuario
          const notificationSub = stompClient.subscribe(
            `/user/queue/notifications`,
            handleWebSocketMessage
          );

          // Subscribirse a conteo de notificaciones
          const countSub = stompClient.subscribe(
            `/user/queue/notification-count`,
            handleWebSocketMessage
          );

          // Guardar subscripciones
          subscriptionsRef.current = [notificationSub, countSub];
          stompClientRef.current = stompClient;

          console.log(`Subscribed to user queues for user ID: ${user.id}`);
        },
        (error) => {
          console.error('WebSocket connection error:', error);
          setConnected(false);
          handleReconnect();
        }
      );

      // Configurar heartbeat
      stompClient.heartbeat.outgoing = 20000; // 20s
      stompClient.heartbeat.incoming = 20000; // 20s

    } catch (err) {
      console.error('Error connecting to WebSocket:', err);
      setConnected(false);
      handleReconnect();
    }
  }, [user?.id, handleWebSocketMessage]);

  // Manejo de reconexión
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const timeout = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
    reconnectAttempts.current++;

    console.log(`Attempting to reconnect in ${timeout}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, timeout);
  }, [connectWebSocket]);

  // Desconectar WebSocket
  const disconnectWebSocket = useCallback(() => {
    // Limpiar subscripciones
    subscriptionsRef.current.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
    subscriptionsRef.current = [];

    // Desconectar cliente STOMP
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.disconnect();
    }
    stompClientRef.current = null;

    // Limpiar timeout de reconexión
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  // Efectos
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user?.id, loadNotifications, connectWebSocket, disconnectWebSocket]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // Actualizar sidebar cuando cambie el contador
  useEffect(() => {
    if (window.updateSidebarNotificationCount) {
      window.updateSidebarNotificationCount(notificationCount);
    }
  }, [notificationCount]);

  return {
    // Estado
    notifications,
    notificationCount,
    loading,
    connected,
    
    // Métodos
    loadNotifications,
    loadNotificationCount,
    updateNotificationLocally,
    addNotification,
    removeNotificationLocally,
    connectWebSocket,
    disconnectWebSocket,
    
    // Métodos de conveniencia
    markAsReadLocally: (notificationId) => 
      updateNotificationLocally(notificationId, { read: true, readAt: new Date().toISOString() }),
    markAsUnreadLocally: (notificationId) => 
      updateNotificationLocally(notificationId, { read: false, readAt: null }),
  };
};