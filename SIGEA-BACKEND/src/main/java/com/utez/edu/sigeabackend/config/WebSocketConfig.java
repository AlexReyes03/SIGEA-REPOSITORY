package com.utez.edu.sigeabackend.config;

import com.utez.edu.sigeabackend.utils.security.CustomUserDetailsService;
import com.utez.edu.sigeabackend.utils.security.JWTUtil;
import com.utez.edu.sigeabackend.utils.security.JwtChannelInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JWTUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Value("${sigea.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${sigea.production.frontend.url:https://your-production-domain.com}")
    private String productionFrontendUrl;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    public WebSocketConfig(JWTUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Bean necesario para manejar heartbeat en WebSocket
     */
    @Bean
    public TaskScheduler heartBeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("websocket-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new JwtChannelInterceptor(jwtUtil, userDetailsService));
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Configurar orígenes permitidos según el perfil
        String[] allowedOrigins = getAllowedOrigins();

        // Endpoint con SockJS para compatibilidad con navegadores antiguos
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins)
                .withSockJS()
                .setSessionCookieNeeded(false)
                .setHeartbeatTime(25000);

        // Endpoint nativo para navegadores modernos
        registry.addEndpoint("/ws-native")
                .setAllowedOrigins(allowedOrigins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefijo para mensajes del cliente al servidor
        registry.setApplicationDestinationPrefixes("/app");

        // Habilitar broker simple para topics y queues
        registry.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{10000, 10000}) // heartbeat cada 10s
                .setTaskScheduler(heartBeatScheduler()); // Usar nuestro TaskScheduler

        // Prefijo para destinos de usuario específico
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * Obtiene los orígenes permitidos según el perfil activo
     */
    private String[] getAllowedOrigins() {
        if ("prod".equals(activeProfile) || "production".equals(activeProfile)) {
            // En producción Railway, permitir el dominio específico
            return new String[]{
                    productionFrontendUrl,
                    "https://sigea-frontend-production.up.railway.app", // Si tu frontend también está en Railway
                    "https://*.railway.app" // Permitir subdominios de Railway
            };
        } else {
            // En desarrollo, permitir IP local y localhost
            return new String[]{
                    frontendUrl,
                    "http://192.168.1.38:5173", // Para acceso externo
                    "http://localhost:5173",    // Para acceso local
                    "http://localhost:3000",
                    "http://127.0.0.1:5173",
                    "http://127.0.0.1:3000"
            };
        }
    }
}