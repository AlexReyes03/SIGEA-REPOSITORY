package com.utez.edu.sigeabackend.utils.security;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JWTRequestFilter extends OncePerRequestFilter {

    private final CustomUserDetailsService userDetailsService;
    private final JWTUtil jwtUtil;

    // Endpoints públicos que NO necesitan procesamiento JWT
    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
            "/sigea/auth/",
            "/sigea/api/media/raw/",
            "/sigea/api/careers",
            "/sigea/api/create-dev-user",
            "/sigea/api/dev-status"
    );

    @Autowired
    public JWTRequestFilter(CustomUserDetailsService userDetailsService, JWTUtil jwtUtil) {
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain
    ) throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String method = request.getMethod();

        if ("OPTIONS".equalsIgnoreCase(method)) {
            System.out.println("=== OPTIONS REQUEST - SKIPPING JWT FILTER ===");
            chain.doFilter(request, response);
            return;
        }

        if (isPublicEndpoint(requestPath, method)) {
            System.out.println("=== PUBLIC ENDPOINT - SKIPPING JWT FILTER: " + method + " " + requestPath + " ===");
            chain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        String username = null, jwt = null;

        System.out.println("=== JWT FILTER DEBUG ===");
        System.out.println("Method: " + method);
        System.out.println("Path: " + requestPath);
        System.out.println("Auth Header: " + (authHeader != null ? "PRESENT (" + authHeader.length() + " chars)" : "NULL"));

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            System.out.println("JWT Token: " + (!jwt.isEmpty() ? "EXTRACTED (" + jwt.length() + " chars)" : "EMPTY"));
            try {
                username = jwtUtil.extractUsername(jwt);
                System.out.println("Username extracted: " + username);
            } catch (ExpiredJwtException ex) {
                System.out.println("JWT EXPIRED: " + ex.getMessage());
            } catch (io.jsonwebtoken.security.SignatureException ex) {
                System.out.println("JWT SIGNATURE ERROR: " + ex.getMessage());
            } catch (Exception ex) {
                System.out.println("JWT OTHER ERROR: " + ex.getClass().getSimpleName() + " - " + ex.getMessage());
            }
        } else {
            System.out.println("No Bearer token found");
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            System.out.println("Attempting to authenticate user: " + username);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (jwtUtil.validateToken(jwt, userDetails)) {
                System.out.println("Token validation SUCCESS");
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities()
                        );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                System.out.println("Token validation FAILED");
            }
        }
        System.out.println("========================");
        chain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String requestPath, String method) {
        if ("GET".equalsIgnoreCase(method) && "/sigea/api/careers".equals(requestPath)) {
            return true;
        }

        return PUBLIC_ENDPOINTS.stream()
                .anyMatch(requestPath::startsWith);
    }
}