package com.utez.edu.sigeabackend.modules.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class WebSocketMessage {
    // Modelo base para los mensajes de WebSocket
    private String type;
    private Object data;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    public WebSocketMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public WebSocketMessage(String type, Object data) {
        this.type = type;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    // Getters y Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    // Tipos de mensajes
    public static class Type {
        public static final String NOTIFICATION = "NOTIFICATION";
        public static final String NOTIFICATION_COUNT = "NOTIFICATION_COUNT";
        public static final String GRADE_PUBLISHED = "GRADE_PUBLISHED";
        public static final String GROUP_ASSIGNED = "GROUP_ASSIGNED";
        public static final String EVALUATION_PERIOD = "EVALUATION_PERIOD";
        public static final String EVALUATION_END = "EVALUATION_END";
        public static final String CONNECTION_STATUS = "CONNECTION_STATUS";
        public static final String ERROR = "ERROR";
    }
}