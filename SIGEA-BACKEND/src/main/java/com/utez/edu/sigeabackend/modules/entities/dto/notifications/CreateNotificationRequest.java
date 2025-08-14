package com.utez.edu.sigeabackend.modules.entities.dto.notifications;

public record CreateNotificationRequest (
        Long userId,
        String type,
        String title,
        String message,
        String route,
        String json
){}
