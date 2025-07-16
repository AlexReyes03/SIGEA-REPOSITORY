package com.utez.edu.sigeabackend.utils.security;

import com.utez.edu.sigeabackend.auth.KeyService;
import io.jsonwebtoken.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.function.Function;

@Component
public class JWTUtil {

    private final KeyService keyService;

    public JWTUtil(KeyService keyService) {
        this.keyService = keyService;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(keyService.getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return resolver.apply(claims);
        } catch (JwtException e) {
            try {
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(keyService.getAllKeys().get("previous"))
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
                return resolver.apply(claims);
            } catch (JwtException ex) {
                throw e;
            }
        }
    }

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setHeaderParam("kid", "primary")
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000L*60*60*10)) // 10h
                .signWith(keyService.getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername())
                    && !extractClaim(token, Claims::getExpiration).before(new Date());
        } catch (JwtException ex) {
            return false;
        }
    }
}