package com.utez.edu.sigeabackend.utils.exception;

import com.mysql.cj.exceptions.CJCommunicationsException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.ConnectException;
import java.sql.SQLException;
import java.sql.SQLNonTransientConnectionException;
import java.time.LocalDateTime;

/**
 * Handler específico para errores de conectividad de base de datos
 * Se ejecuta ANTES que el GlobalExceptionHandler (Order = 1)
 */
@RestControllerAdvice
@Order(1)
public class DatabaseExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseExceptionHandler.class);

    /**
     * Maneja errores de conectividad específicos de Railway/MySQL
     */
    @ExceptionHandler({
            DataAccessResourceFailureException.class,
            CannotCreateTransactionException.class,
            JpaSystemException.class
    })
    public ResponseEntity<DatabaseErrorResponse> handleDatabaseConnectivityException(Exception ex) {

        // Log del error para debugging
        logger.warn("Database connectivity issue detected: {}", ex.getMessage());
        logger.debug("Full stack trace:", ex);

        // Verificar si es un error de conectividad específico
        if (isDatabaseConnectivityIssue(ex)) {
            DatabaseErrorResponse errorResponse = new DatabaseErrorResponse(
                    HttpStatus.SERVICE_UNAVAILABLE.value(),
                    "Servicio temporalmente no disponible",
                    "El servicio está experimentando problemas de conectividad. Reintentando automáticamente...",
                    LocalDateTime.now(),
                    true // indica que es un error temporal que permite retry
            );

            return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
        }

        // Si no es un error de conectividad conocido, dejar que el GlobalExceptionHandler lo maneje
        throw new RuntimeException(ex);
    }

    /**
     * Maneja errores de SQL específicos de conexión
     */
    @ExceptionHandler({
            SQLException.class,
            SQLNonTransientConnectionException.class,
            CJCommunicationsException.class,
            ConnectException.class
    })
    public ResponseEntity<DatabaseErrorResponse> handleSQLConnectivityException(Exception ex) {

        logger.warn("SQL connectivity issue detected: {}", ex.getMessage());
        logger.debug("Full stack trace:", ex);

        DatabaseErrorResponse errorResponse = new DatabaseErrorResponse(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                "Servicio temporalmente no disponible",
                "Problema de conectividad con la base de datos. Reintentando automáticamente...",
                LocalDateTime.now(),
                true
        );

        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

    /**
     * Verifica si la excepción es realmente un problema de conectividad
     */
    private boolean isDatabaseConnectivityIssue(Exception ex) {
        String message = ex.getMessage();
        if (message == null) return false;

        return message.contains("Communications link failure") ||
                message.contains("Connection refused") ||
                message.contains("Could not open JPA EntityManager") ||
                message.contains("Unable to acquire JDBC Connection") ||
                message.contains("Connection is not available") ||
                message.contains("Connection pool shut down") ||
                message.contains("The last packet sent successfully to the server was 0 milliseconds ago");
    }

    /**
     * Clase específica para respuestas de errores de base de datos
     */
    public static class DatabaseErrorResponse {
        private int status;
        private String error;
        private String message;
        private LocalDateTime timestamp;
        private boolean retryable; // Nuevo campo para indicar si el error permite retry

        public DatabaseErrorResponse(int status, String error, String message, LocalDateTime timestamp, boolean retryable) {
            this.status = status;
            this.error = error;
            this.message = message;
            this.timestamp = timestamp;
            this.retryable = retryable;
        }

        // Getters y setters
        public int getStatus() { return status; }
        public void setStatus(int status) { this.status = status; }

        public String getError() { return error; }
        public void setError(String error) { this.error = error; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

        public boolean isRetryable() { return retryable; }
        public void setRetryable(boolean retryable) { this.retryable = retryable; }
    }
}