package com.utez.edu.sigeabackend.modules.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para mantener la base de datos activa en Railway
 */
@RestController
@RequestMapping("/sigea/health")
public class KeepAliveController {

    private static final Logger logger = LoggerFactory.getLogger(KeepAliveController.class);
    private final DataSource dataSource;

    @Autowired
    public KeepAliveController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Endpoint público para verificar la salud de la base de datos
     * Railway lo puede llamar automáticamente cada pocos minutos
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        Map<String, Object> response = new HashMap<>();

        try {
            // Probar conexión a la base de datos
            try (Connection connection = dataSource.getConnection()) {
                boolean isValid = connection.isValid(5); // 5 segundos de timeout

                response.put("status", isValid ? "UP" : "DOWN");
                response.put("database", isValid ? "CONNECTED" : "DISCONNECTED");
                response.put("timestamp", LocalDateTime.now());
                response.put("message", isValid ? "Database connection healthy" : "Database connection failed");

                if (isValid) {
                    logger.debug("Keep-alive ping successful at {}", LocalDateTime.now());
                    return ResponseEntity.ok(response);
                } else {
                    logger.warn("Keep-alive ping failed - connection invalid");
                    return ResponseEntity.status(503).body(response);
                }
            }

        } catch (SQLException e) {
            logger.error("Keep-alive ping failed with SQLException: {}", e.getMessage());
            response.put("status", "DOWN");
            response.put("database", "ERROR");
            response.put("timestamp", LocalDateTime.now());
            response.put("message", "Database connection error: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());

            return ResponseEntity.status(503).body(response);
        }
    }

    /**
     * Endpoint adicional para diagnósticos más detallados
     */
    @GetMapping("/db-status")
    public ResponseEntity<Map<String, Object>> getDatabaseStatus() {
        Map<String, Object> response = new HashMap<>();

        try (Connection connection = dataSource.getConnection()) {
            response.put("connected", true);
            response.put("autoCommit", connection.getAutoCommit());
            response.put("readOnly", connection.isReadOnly());
            response.put("transactionIsolation", connection.getTransactionIsolation());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (SQLException e) {
            response.put("connected", false);
            response.put("error", e.getMessage());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.status(503).body(response);
        }
    }
}