package com.utez.edu.sigeabackend.auth;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ActiveUserService {

    // Mapa de usuarioId → instante de expiración del token
    private final Map<Long, Instant> sessions = new ConcurrentHashMap<>();

    /** Registra un login: agrega o actualiza la expiración */
    public void registerLogin(Long userId, Instant expiration) {
        sessions.put(userId, expiration);
    }

    /** Registra un logout manual */
    public void registerLogout(Long userId) {
        sessions.remove(userId);
    }

    /** Número actual de usuarios cuyos tokens no han expirado */
    public int getActiveUserCount() {
        cleanupExpired();
        return sessions.size();
    }

    /** Limpia entradas expiradas cada minuto */
    @Scheduled(fixedRate = 60_000)
    public void cleanupExpired() {
        Instant now = Instant.now();
        sessions.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}