package com.utez.edu.sigeabackend.auth;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ActiveUserService {

    private final Map<Long, Instant> sessions = new ConcurrentHashMap<>();

    public void registerLogin(Long userId, Instant expiration) {
        sessions.put(userId, expiration);
    }

    public void registerLogout(Long userId) {
        sessions.remove(userId);
    }

    public int getActiveUserCount() {
        cleanupExpired();
        return sessions.size();
    }

    @Scheduled(fixedRate = 60_000)
    public void cleanupExpired() {
        Instant now = Instant.now();
        sessions.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}