package com.utez.edu.sigeabackend.utils.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.util.StringUtils;

import java.security.Principal;

public class JwtChannelInterceptor implements ChannelInterceptor {
    private static final Logger log = LoggerFactory.getLogger(JwtChannelInterceptor.class);

    private final JWTUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public JwtChannelInterceptor(JWTUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            try {
                String token = extractTokenFromHeaders(accessor);

                if (StringUtils.hasText(token)) {
                    String username = jwtUtil.extractUsername(token);

                    if (StringUtils.hasText(username)) {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                        if (jwtUtil.validateToken(token, userDetails)) {
                            Long userId = extractUserIdFromUserDetails(userDetails);
                            String userRole = extractRoleFromUserDetails(userDetails);

                            WebSocketUserPrincipal principal = new WebSocketUserPrincipal(username, userId, userRole);
                            accessor.setUser(principal);

                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                            SecurityContextHolder.getContext().setAuthentication(authentication);

                            log.info("Usuario autenticado en WebSocket: {} (ID: {}, Role: {})", username, userId, userRole);
                        } else {
                            log.warn("Token JWT inválido para usuario: {}", username);
                            throw new RuntimeException("Token JWT inválido");
                        }
                    } else {
                        log.warn("No se pudo extraer username del token JWT");
                        throw new RuntimeException("Username no encontrado en token");
                    }
                } else {
                    log.warn("Token JWT ausente en conexión WebSocket");
                    throw new RuntimeException("Token JWT ausente");
                }
            } catch (Exception e) {
                log.error("Error al procesar autenticación WebSocket: ", e);
                throw new RuntimeException("Error de autenticación WebSocket: " + e.getMessage());
            }
        }

        return message;
    }

    private String extractTokenFromHeaders(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        String tokenHeader = accessor.getFirstNativeHeader("X-Auth-Token");
        if (StringUtils.hasText(tokenHeader)) {
            return tokenHeader;
        }

        return null;
    }

    private Long extractUserIdFromUserDetails(UserDetails userDetails) {
        // Adaptado para tu implementación de UserDetails
        try {
            // Si tu UserDetails es directamente UserEntity
            if (userDetails instanceof com.utez.edu.sigeabackend.modules.entities.UserEntity) {
                return ((com.utez.edu.sigeabackend.modules.entities.UserEntity) userDetails).getId();
            }

            // Si usas CustomUserDetails que wrappea UserEntity
            if (userDetails.getClass().getSimpleName().equals("CustomUserDetails")) {
                // Usar reflexión para obtener el UserEntity
                try {
                    java.lang.reflect.Field userField = userDetails.getClass().getDeclaredField("user");
                    userField.setAccessible(true);
                    Object user = userField.get(userDetails);
                    if (user instanceof com.utez.edu.sigeabackend.modules.entities.UserEntity) {
                        return ((com.utez.edu.sigeabackend.modules.entities.UserEntity) user).getId();
                    }
                } catch (Exception e) {
                    log.warn("No se pudo extraer UserEntity via reflexión: {}", e.getMessage());
                }
            }

            // Método alternativo: si el username es el email, buscar en BD
            // (Este es un fallback, no recomendado para production por performance)
            log.warn("No se pudo extraer userId del UserDetails: {}, username: {}",
                    userDetails.getClass().getName(), userDetails.getUsername());
            return null;

        } catch (Exception e) {
            log.error("Error extrayendo userId: ", e);
            return null;
        }
    }

    private String extractRoleFromUserDetails(UserDetails userDetails) {
        return userDetails.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .orElse("USER");
    }

    public static class WebSocketUserPrincipal implements Principal {
        private final String name;
        private final Long userId;
        private final String role;

        public WebSocketUserPrincipal(String name, Long userId, String role) {
            this.name = name;
            this.userId = userId;
            this.role = role;
        }

        @Override
        public String getName() {
            return name;
        }

        public Long getUserId() {
            return userId;
        }

        public String getRole() {
            return role;
        }

        @Override
        public String toString() {
            return "WebSocketUserPrincipal{" +
                    "name='" + name + '\'' +
                    ", userId=" + userId +
                    ", role='" + role + '\'' +
                    '}';
        }
    }
}