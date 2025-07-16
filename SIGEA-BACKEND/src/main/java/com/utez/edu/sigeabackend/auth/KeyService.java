package com.utez.edu.sigeabackend.auth;

import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

import java.security.Key;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Base64;

@Component
public class KeyService {

    @Value("${jwt.keys.primary}")
    private String primaryKeyBase64;

    @Value("${jwt.keys.previous:}")
    private String previousKeyBase64;

    @PostConstruct
    public void debugKeys() {
        System.out.println("=== JWT KEYS DEBUG ===");
        System.out.println("PRIMARY KEY: " + (primaryKeyBase64 != null ? "LOADED (" + primaryKeyBase64.length() + " chars)" : "NULL"));
        System.out.println("PREVIOUS KEY: " + (previousKeyBase64 != null && !previousKeyBase64.isBlank() ? "LOADED (" + previousKeyBase64.length() + " chars)" : "EMPTY"));
        System.out.println("=====================");
    }

    public Key getSigningKey() {
        if (primaryKeyBase64 == null || primaryKeyBase64.isBlank()) {
            throw new IllegalStateException("JWT primary key not configured!");
        }
        byte[] decoded = Base64.getDecoder().decode(primaryKeyBase64);
        return Keys.hmacShaKeyFor(decoded);
    }

    public Map<String, Key> getAllKeys() {
        Map<String, Key> keys = new LinkedHashMap<>();
        keys.put("primary", getSigningKey());

        if (previousKeyBase64 != null && !previousKeyBase64.isBlank()) {
            byte[] prev = Base64.getDecoder().decode(previousKeyBase64);
            keys.put("previous", Keys.hmacShaKeyFor(prev));
        }

        return keys;
    }
}