package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.NotificationCountMessage;
import com.utez.edu.sigeabackend.modules.entities.NotificationEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.notifications.CreateNotificationRequest;
import com.utez.edu.sigeabackend.modules.services.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/sigea/api/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @PostMapping("/create")
    public ResponseEntity<NotificationEntity> createNotification(@RequestBody CreateNotificationRequest request) {
        return ResponseEntity.ok(service.createNotification(request));
    }

    @GetMapping("/count/{userId}")
    public ResponseEntity<NotificationCountMessage> getNotificationCount(@PathVariable Long userId){
        return ResponseEntity.ok(service.getNotificationCount(userId));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<NotificationEntity>> getNotificationsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getNotificationsByUserId(userId));
    }

    @PutMapping("/mark-read/{userId}/{notificationId}")
    public ResponseEntity<Boolean> markAsRead(@PathVariable Long userId, @PathVariable Long notificationId) {
        return ResponseEntity.ok(service.markAsRead(userId, notificationId));
    }

    @DeleteMapping("/delete/{userId}/{notificationId}")
    public ResponseEntity<Boolean> deleteNotification(@PathVariable Long userId, @PathVariable Long notificationId) {
        return ResponseEntity.ok(service.deleteNotification(userId, notificationId));
    }

    @DeleteMapping("delete-read/{userId}")
    public ResponseEntity<Boolean> deleteAllReadNotifications(@PathVariable Long userId){
        return ResponseEntity.ok(service.deleteAllReadNotifications(userId));
    }
}
