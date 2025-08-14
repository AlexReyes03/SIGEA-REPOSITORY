package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.NotificationCountMessage;
import com.utez.edu.sigeabackend.modules.entities.NotificationEntity;
import com.utez.edu.sigeabackend.modules.entities.NotificationWebSocketMessage;
import com.utez.edu.sigeabackend.modules.entities.dto.notifications.CreateNotificationRequest;
import com.utez.edu.sigeabackend.modules.repositories.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {
    private final NotificationRepository repository;
    private final WebSocketService webSocketService;

    public NotificationService(NotificationRepository repository,
                               WebSocketService webSocketService) {
        this.repository = repository;
        this.webSocketService = webSocketService;
    }
   //Crear una nueva notificacion y enviarla
    public NotificationEntity createNotification(CreateNotificationRequest request) {
        try{
            NotificationEntity notification = new NotificationEntity();
            notification.setUserId(request.userId());
            notification.setType(request.type());
            notification.setTitle(request.title());
            notification.setMessage(request.message());
            notification.setRoute(request.route());
            notification.setJson(request.json());

           notification = repository.save(notification);

           //Enviar por webSocket
            NotificationWebSocketMessage wsMessage = new NotificationWebSocketMessage(
                     notification.getId(),
                     notification.getType(),
                     notification.getTitle(),
                     notification.getMessage(),
                     notification.getUserId(),
                     notification.getRead(),
                     notification.getCreatedAt()
            );
            System.out.println("Notificación creada: ID={}, Usuario={}" + notification.getId() + notification.getUserId());
            return notification;
        }catch (Exception e){
            System.out.println("Error al crear notificación para usuario {}: " + request.userId() + e);
            throw new RuntimeException("Error al crear notificación", e);
        }
    }


    //Crear notificaciones masivas para múltiples usuarios
    public List<NotificationEntity> createBulkNotifications(List<Long> userIds, String type, String title, String message ){
        try {
            List<NotificationEntity> notifications = userIds.stream()
                    .map(userId -> {
                        NotificationEntity notification = new NotificationEntity();
                        notification.setUserId(userId);
                        notification.setType(type);
                        notification.setTitle(title);
                        notification.setMessage(message);
                        return notification;
                    })
                    .toList();

            notifications = repository.saveAll(notifications);

            // Enviar por WebSocket a cada usuario
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

            System.out.println("Notificaciones masivas creadas: {} notificaciones, Tipo={}" + notifications.size() + type);

            return notifications;
        } catch (Exception e) {
            System.out.println("Error al crear notificaciones masivas: "+ e);
            throw new RuntimeException("Error al crear notificaciones masivas", e);
        }
    }

    //Obtener el contador de notificaciones de un usuario
    @Transactional(readOnly = true)
    public NotificationCountMessage getNotificationCount(Long userId) {
        Long unreadCount = repository.countUnreadByUserId(userId);
        Long totalCount = repository.countByUserId(userId);
        return new NotificationCountMessage(userId, unreadCount, totalCount);
    }

    //Obtener notificaciones de un usuario con
    @Transactional(readOnly = true)
    public List<NotificationEntity> getNotificationsByUserId(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }


    //Marcar una notificacion especifica como leida
    public boolean markAsRead(Long notificationId, Long userId) {
        try{
            int updated = repository.markAsReadByIdAndUserId(notificationId, userId);
            if (updated > 0) {
                webSocketService.sendNotificationCountToUser(userId);
                System.out.println("Notificación marcada como leída: ID={}, Usuario={}" + notificationId + userId);
                return true;
            }
            return false;
        }catch (Exception e){
            System.out.println("Error al marcar notificación como leída: ID={}, Usuario={}" + notificationId + userId + e);
            throw new RuntimeException("Error al marcar notificación como leída", e);
        }
    }

    //Eliminar una notificación específica
    public boolean deleteNotification(Long notificationId, Long userId) {
        try{
            int deleted = repository.deleteByIdAndUserId(notificationId, userId);
            if (deleted > 0) {
                System.out.println("Notificación eliminada: ID={}, Usuario={}" + notificationId + userId);
                return true;
            }
            return false;
        } catch (Exception e) {
            System.out.println("Error al eliminar notificación: ID={}, Usuario={}" + notificationId + userId + e);
            throw new RuntimeException("Error al eliminar notificación", e);
        }
    }

    //Eliminar todas las notificaciones leídas de un usuario
    public boolean deleteAllReadNotifications(Long userId) {
        try{
            int deleted = repository.deleteAllReadByUserId(userId);
            if (deleted > 0) {
                webSocketService.sendNotificationCountToUser(userId);
                System.out.println("Todas las notificaciones leídas eliminadas para usuario: " + userId);
            }
            return false;
        } catch (Exception e) {
            System.out.println("Error al eliminar todas las notificaciones leídas para usuario {}: " + userId + e);
            throw new RuntimeException("Error al eliminar todas las notificaciones leídas", e);
        }
    }

}
