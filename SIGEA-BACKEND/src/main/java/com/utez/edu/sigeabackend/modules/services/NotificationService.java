package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.NotificationCountMessage;
import com.utez.edu.sigeabackend.modules.entities.NotificationEntity;
import com.utez.edu.sigeabackend.modules.entities.NotificationWebSocketMessage;
import com.utez.edu.sigeabackend.modules.entities.NotificationType;
import com.utez.edu.sigeabackend.modules.repositories.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository repository;
    private final WebSocketService webSocketService;

    public NotificationService(NotificationRepository repository,
                               WebSocketService webSocketService) {
        this.repository = repository;
        this.webSocketService = webSocketService;
    }

    /**
     * Crear una nueva notificación para un usuario específico
     * Este método solo debe ser llamado desde otros servicios del backend
     */
    @Transactional
    public NotificationEntity createNotification(Long userId, NotificationType type, String title, String message, String route, String json) {
        try {
            NotificationEntity notification = new NotificationEntity();
            notification.setUserId(userId);
            notification.setType(type.getValue());
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setRoute(route);
            notification.setJson(json != null ? json : "{}");

            notification = repository.save(notification);

            NotificationWebSocketMessage wsMessage = new NotificationWebSocketMessage(
                    notification.getId(),
                    notification.getType(),
                    notification.getTitle(),
                    notification.getMessage(),
                    notification.getUserId(),
                    notification.getRead(),
                    notification.getCreatedAt()
            );

            webSocketService.sendNotificationToUser(notification.getUserId(), wsMessage);
            webSocketService.sendNotificationCountToUser(notification.getUserId());

            System.out.println("Notificación creada: ID=" + notification.getId() + ", Usuario=" + notification.getUserId());
            return notification;
        } catch (Exception e) {
            System.out.println("Error al crear notificación para usuario " + userId + ": " + e.getMessage());
            throw new RuntimeException("Error al crear notificación", e);
        }
    }

    /**
     * Sobrecarga del método anterior para casos simples
     */
    public NotificationEntity createNotification(Long userId, NotificationType type, String title, String message) {
        return createNotification(userId, type, title, message, null, null);
    }

    /**
     * Crear notificaciones masivas para múltiples usuarios
     * Este metodo solo debe ser llamado desde otros servicios del backend
     *
     * @param userIds Lista de IDs de usuarios destinatarios
     */
    @Transactional
    public List<NotificationEntity> createBulkNotifications(List<Long> userIds, NotificationType type, String title, String message) {
        try {
            List<NotificationEntity> notifications = userIds.stream()
                    .map(userId -> {
                        NotificationEntity notification = new NotificationEntity();
                        notification.setUserId(userId);
                        notification.setType(type.getValue());
                        notification.setTitle(title);
                        notification.setMessage(message);
                        notification.setJson("{}");
                        return notification;
                    })
                    .toList();

            notifications = repository.saveAll(notifications);

            for (NotificationEntity notification : notifications) {
                NotificationWebSocketMessage wsMessage = new NotificationWebSocketMessage(
                        notification.getId(),
                        notification.getType(),
                        notification.getTitle(),
                        notification.getMessage(),
                        notification.getUserId(),
                        notification.getRead(),
                        notification.getCreatedAt()
                );

                webSocketService.sendNotificationToUser(notification.getUserId(), wsMessage);
                webSocketService.sendNotificationCountToUser(notification.getUserId());
            }

            System.out.println("Notificaciones masivas creadas: " + notifications.size() + " notificaciones, Tipo=" + type.getValue());

            return notifications;
        } catch (Exception e) {
            System.out.println("Error al crear notificaciones masivas: " + e.getMessage());
            throw new RuntimeException("Error al crear notificaciones masivas", e);
        }
    }

    /**
     * Obtener el contador de notificaciones de un usuario específico
     */
    @Transactional(readOnly = true)
    public NotificationCountMessage getNotificationCount(Long userId) {
        Long unreadCount = repository.countUnreadByUserId(userId);
        Long totalCount = repository.countByUserId(userId);
        return new NotificationCountMessage(userId, unreadCount, totalCount);
    }

    /**
     * Obtener todas las notificaciones de un usuario específico ordenadas por fecha
     */
    @Transactional(readOnly = true)
    public List<NotificationEntity> getNotificationsByUserId(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Marcar una notificación específica como leída
     */
    @Transactional
    public boolean markAsRead(Long notificationId, Long userId) {
        try {
            int updated = repository.markAsReadByIdAndUserId(notificationId, userId);
            if (updated > 0) {
                webSocketService.sendNotificationCountToUser(userId);
                System.out.println("Notificación marcada como leída: ID=" + notificationId + ", Usuario=" + userId);
                return true;
            }
            return false;
        } catch (Exception e) {
            System.out.println("Error al marcar notificación como leída: ID=" + notificationId + ", Usuario=" + userId + " - " + e.getMessage());
            throw new RuntimeException("Error al marcar notificación como leída", e);
        }
    }

    /**
     * Eliminar una notificación específica
     */
    @Transactional
    public boolean deleteNotification(Long notificationId, Long userId) {
        try {
            int deleted = repository.deleteByIdAndUserId(notificationId, userId);
            if (deleted > 0) {
                webSocketService.sendNotificationCountToUser(userId);
                System.out.println("Notificación eliminada: ID=" + notificationId + ", Usuario=" + userId);
                return true;
            }
            return false;
        } catch (Exception e) {
            System.out.println("Error al eliminar notificación: ID=" + notificationId + ", Usuario=" + userId + " - " + e.getMessage());
            throw new RuntimeException("Error al eliminar notificación", e);
        }
    }

    /**
     * Eliminar todas las notificaciones leídas de un usuario
     */
    @Transactional
    public boolean deleteAllReadNotifications(Long userId) {
        try {
            int deleted = repository.deleteAllReadByUserId(userId);
            if (deleted > 0) {
                webSocketService.sendNotificationCountToUser(userId);
                System.out.println("Todas las notificaciones leídas eliminadas para usuario: " + userId + " (Total: " + deleted + ")");
                return true; // FIX: Corregido el return que estaba en false
            }
            return false;
        } catch (Exception e) {
            System.out.println("Error al eliminar todas las notificaciones leídas para usuario " + userId + ": " + e.getMessage());
            throw new RuntimeException("Error al eliminar todas las notificaciones leídas", e);
        }
    }

    // ===== MÉTODOS DE CONVENIENCIA PARA OTROS SERVICIOS =====

    /**
     * Crear notificación de éxito
     */
    public NotificationEntity createSuccessNotification(Long userId, String title, String message) {
        return createNotification(userId, NotificationType.SUCCESS, title, message);
    }

    /**
     * Crear notificación de advertencia
     */
    public NotificationEntity createWarningNotification(Long userId, String title, String message) {
        return createNotification(userId, NotificationType.WARNING, title, message);
    }

    /**
     * Crear notificación de peligro/error
     */
    public NotificationEntity createDangerNotification(Long userId, String title, String message) {
        return createNotification(userId, NotificationType.DANGER, title, message);
    }

    /**
     * Crear notificación informativa
     */
    public NotificationEntity createInfoNotification(Long userId, String title, String message) {
        return createNotification(userId, NotificationType.INFO, title, message);
    }
}