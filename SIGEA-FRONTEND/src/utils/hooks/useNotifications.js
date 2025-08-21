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

  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [notificationsData, countData] = await Promise.all([getNotificationsByUserId(user.id), getNotificationCount(user.id)]);

      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setNotificationCount(countData?.count || countData?.unreadCount || 0);
    } catch (err) {
      setNotifications([]);
      setNotificationCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updateNotificationLocally = useCallback((notificationId, updates) => {
    setNotifications((prev) => prev.map((notification) => (notification.id === notificationId ? { ...notification, ...updates } : notification)));

    if ('read' in updates) {
      setNotificationCount((prev) => (updates.read ? Math.max(0, prev - 1) : prev + 1));
    }
  }, []);

  const addNotification = useCallback((newNotification) => {
    setNotifications((prev) => [newNotification, ...prev]);
    if (!newNotification.read) {
      setNotificationCount((prev) => prev + 1);
    }
  }, []);

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

  const handleWebSocketMessage = useCallback(
    (message) => {
      try {
        const parsedMessage = JSON.parse(message.body);
        const { type, data } = parsedMessage;

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
            break;

          case 'NOTIFICATION_COUNT':
            setNotificationCount(data.unreadCount || 0);
            break;

          case 'CONNECTION_STATUS':
            break;

          case 'ERROR':
            break;

          default:
            break;
        }
      } catch (err) {}
    },
    [addNotification]
  );

  const connectWebSocket = useCallback(() => {
    if (!user?.id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    disconnectWebSocket();

    try {
      const socketUrl = `${BASE_URL}/ws`;
      const socket = new SockJS(socketUrl);
      const stompClient = Stomp.over(socket);

      stompClient.debug = () => {};

      const connectHeaders = {
        Authorization: `Bearer ${token}`,
      };

      stompClient.connect(
        connectHeaders,
        (frame) => {
          setConnected(true);
          reconnectAttempts.current = 0;

          try {
            const notificationSub = stompClient.subscribe(`/user/queue/notifications`, handleWebSocketMessage);

            const countSub = stompClient.subscribe(`/user/queue/notification-count`, handleWebSocketMessage);

            subscriptionsRef.current = [notificationSub, countSub];
            stompClientRef.current = stompClient;
          } catch (subError) {}
        },
        (error) => {
          setConnected(false);

          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttempts.current) * 2000;
            reconnectAttempts.current++;

            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, delay);
          }
        }
      );
    } catch (err) {
      setConnected(false);
    }
  }, [user?.id, handleWebSocketMessage]);

  const disconnectWebSocket = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => {
      try {
        if (sub && sub.unsubscribe) sub.unsubscribe();
      } catch (err) {}
    });
    subscriptionsRef.current = [];

    if (stompClientRef.current) {
      try {
        if (stompClientRef.current.connected) {
          stompClientRef.current.disconnect();
        }
      } catch (err) {}
      stompClientRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  const loadNotificationCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const countData = await getNotificationCount(user.id);
      setNotificationCount(countData?.count || countData?.unreadCount || 0);
    } catch (err) {}
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();

      const timeout = setTimeout(() => {
        connectWebSocket();
      }, 1000);

      return () => {
        clearTimeout(timeout);
        disconnectWebSocket();
      };
    }
  }, [user?.id, loadNotifications, connectWebSocket, disconnectWebSocket]);

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
