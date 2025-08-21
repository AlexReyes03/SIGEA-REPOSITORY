package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.NotificationCountMessage;
import com.utez.edu.sigeabackend.modules.entities.NotificationEntity;
import com.utez.edu.sigeabackend.modules.services.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    /**
     * Obtener contador de notificaciones de un usuario
     * GET /sigea/api/notifications/count/{userId}
     */
    @GetMapping("/count/{userId}")
    public ResponseEntity<NotificationCountMessage> getNotificationCount(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getNotificationCount(userId));
    }

    /**
     * Obtener todas las notificaciones de un usuario
     * GET /sigea/api/notifications/{userId}
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<NotificationEntity>> getNotificationsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getNotificationsByUserId(userId));
    }

    /**
     * Marcar una notificación específica como leída
     * PUT /sigea/api/notifications/{notificationId}/read/{userId}
     */
    @PutMapping("/{notificationId}/read/{userId}")
    public ResponseEntity<Boolean> markAsRead(@PathVariable Long notificationId, @PathVariable Long userId) {
        return ResponseEntity.ok(service.markAsRead(notificationId, userId));
    }

    /**
     * Eliminar una notificación específica
     * DELETE /sigea/api/notifications/{notificationId}/{userId}
     */
    @DeleteMapping("/{notificationId}/{userId}")
    public ResponseEntity<Boolean> deleteNotification(@PathVariable Long notificationId, @PathVariable Long userId) {
        return ResponseEntity.ok(service.deleteNotification(notificationId, userId));
    }

    /**
     * Eliminar todas las notificaciones leídas de un usuario
     * DELETE /sigea/api/notifications/read/{userId}
     */
    @DeleteMapping("/read/{userId}")
    public ResponseEntity<Boolean> deleteAllReadNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(service.deleteAllReadNotifications(userId));
    }
}