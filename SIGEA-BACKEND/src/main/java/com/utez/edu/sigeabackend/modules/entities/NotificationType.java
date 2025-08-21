package com.utez.edu.sigeabackend.modules.entities;

/**
 * Enum para tipos de notificaciones con colores asociados
 * Usado para categorizar notificaciones en el frontend
 */
public enum NotificationType {
    SUCCESS("Success"),
    WARNING("Warning"),
    DANGER("Danger"),
    INFO("Info");

    private final String value;

    NotificationType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }

    public static NotificationType fromValue(String value) {
        for (NotificationType type : NotificationType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Tipo de notificación inválido: " + value);
    }
}