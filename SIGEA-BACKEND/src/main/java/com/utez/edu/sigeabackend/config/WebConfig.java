package com.utez.edu.sigeabackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry
                .addMapping("/sigea/auth/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET","POST","OPTIONS")
                .allowedHeaders("Authorization","Content-Type")
                .allowCredentials(true);
    }
}