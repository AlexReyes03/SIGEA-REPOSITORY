package com.utez.edu.sigeabackend.auth;

import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Base64;
import java.util.Map;

@Component
public class KeyService {

    @Value("${jwt.keys.primary}")
    private String primaryKeyBase64;

    @Value("${jwt.keys.previous}")
    private String previousKeyBase64;

    public Key getSigningKey() {
        byte[] decoded = Base64.getDecoder().decode(primaryKeyBase64);
        return Keys.hmacShaKeyFor(decoded);
    }

    public Map<String, Key> getAllKeys() {
        return Map.of(
                "primary",  getSigningKey(),
                "previous", Keys.hmacShaKeyFor(Base64.getDecoder().decode(previousKeyBase64))
        );
    }
}