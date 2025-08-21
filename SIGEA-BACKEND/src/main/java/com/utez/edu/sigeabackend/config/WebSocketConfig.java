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

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    public WebSocketConfig(JWTUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

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
        String[] allowedOrigins = getAllowedOrigins();

        // CAMBIO AQUÍ: Agregar prefijo /sigea a los endpoints
        registry.addEndpoint("/sigea/ws")
                .setAllowedOrigins(allowedOrigins)
                .withSockJS()
                .setSessionCookieNeeded(false)
                .setHeartbeatTime(25000);

        registry.addEndpoint("/sigea/ws-native")
                .setAllowedOrigins(allowedOrigins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue")
                .setTaskScheduler(heartBeatScheduler());
        registry.setUserDestinationPrefix("/user");
    }

    private String[] getAllowedOrigins() {
        if ("prod".equals(activeProfile) || "production".equals(activeProfile)) {
            return new String[]{
                    "https://corporativocetec.com"
            };
        } else {
            return new String[]{
                    "http://localhost:5173",
                    "http://127.0.0.1:5173"
            };
        }
    }
}