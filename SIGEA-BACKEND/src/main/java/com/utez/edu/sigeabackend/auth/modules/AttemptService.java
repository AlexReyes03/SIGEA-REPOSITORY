package com.utez.edu.sigeabackend.auth.modules;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lleva un contador en memoria de intentos fallidos
 * para login y para verificación de código OTP.
 */
@Component
public class AttemptService {
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int MAX_CODE_ATTEMPTS  = 5;

    // clave = email del usuario
    private final Map<String, Integer> loginAttempts = new ConcurrentHashMap<>();
    private final Map<String, Integer> codeAttempts  = new ConcurrentHashMap<>();

    // --- Login attempts ---
    public void loginSucceeded(String email) {
        loginAttempts.remove(email);
    }

    public void loginFailed(String email) {
        loginAttempts.merge(email, 1, Integer::sum);
    }

    public boolean isLoginBlocked(String email) {
        return loginAttempts.getOrDefault(email, 0) >= MAX_LOGIN_ATTEMPTS;
    }

    // --- OTP code attempts ---
    public void codeSucceeded(String email) {
        codeAttempts.remove(email);
    }

    public void codeFailed(String email) {
        codeAttempts.merge(email, 1, Integer::sum);
    }

    public boolean isCodeBlocked(String email) {
        return codeAttempts.getOrDefault(email, 0) >= MAX_CODE_ATTEMPTS;
    }
}