package com.utez.edu.sigeabackend.modules.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class NotificationCountMessage {
    // Modelo para el conteo de notificaciones de WebSocket
    private Long userId;
    private Long unreadCount;
    private Long totalCount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    public NotificationCountMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public NotificationCountMessage(Long userId, Long unreadCount, Long totalCount) {
        this.userId = userId;
        this.unreadCount = unreadCount;
        this.totalCount = totalCount;
        this.timestamp = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(Long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public Long getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(Long totalCount) {
        this.totalCount = totalCount;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "NotificationCountMessage{" +
                "userId=" + userId +
                ", unreadCount=" + unreadCount +
                ", totalCount=" + totalCount +
                ", timestamp=" + timestamp +
                '}';
    }
}