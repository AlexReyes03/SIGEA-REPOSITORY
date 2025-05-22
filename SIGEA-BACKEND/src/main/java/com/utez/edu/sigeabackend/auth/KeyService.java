package com.utez.edu.sigeabackend.auth;

import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

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

    public Key getSigningKey() {
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
