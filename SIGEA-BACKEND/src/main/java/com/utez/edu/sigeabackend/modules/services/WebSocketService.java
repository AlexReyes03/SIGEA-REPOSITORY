package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.NotificationCountMessage;
import com.utez.edu.sigeabackend.modules.entities.NotificationWebSocketMessage;
import com.utez.edu.sigeabackend.modules.repositories.NotificationRepository;
import com.utez.edu.sigeabackend.modules.entities.WebSocketMessage;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class WebSocketService {
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository repository;
    private final ConcurrentMap<Long, String> connectedUsers = new ConcurrentHashMap<>();

    public WebSocketService(SimpMessagingTemplate messagingTemplate, NotificationRepository repository) {
        this.messagingTemplate = messagingTemplate;
        this.repository = repository;
    }

    //Enviar notificación a un usuario específico
    public void sendNotificationToUser(Long userId, NotificationWebSocketMessage notification) {
        try {
            WebSocketMessage message = new WebSocketMessage(
                    WebSocketMessage.Type.NOTIFICATION,
                    notification
            );

            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    message
            );

            System.out.println("Notificación enviada a usuario {}: {}"+ userId + notification.toString());
        } catch (Exception e) {
            System.out.println("Error al enviar notificación por WebSocket a usuario {}: " +  userId + e);
        }
    }


    //Enviar conteo de notificaciones a un usuario específico
    public void sendNotificationCountToUser(Long userId) {
        try{
            Long unreadCount = repository.countUnreadByUserId(userId);
            Long totalCount = repository.countByUserId(userId);

            NotificationCountMessage countMessage = new NotificationCountMessage(
                    userId, unreadCount, totalCount
            );
            WebSocketMessage message = new WebSocketMessage(
                    WebSocketMessage.Type.NOTIFICATION_COUNT, countMessage);

            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notification-count",
                    message
            );
        }catch (Exception e){
            System.out.println("Error al enviar conteo de notificaciones por WebSocket a usuario {}: "+ userId + e);
        }
    }
}
