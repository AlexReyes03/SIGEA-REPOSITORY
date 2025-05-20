package com.utez.edu.sigeabackend.auth.modules;

import com.utez.edu.sigeabackend.auth.DTO.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthLoginDto dto) {
        return service.login(dto);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @Valid @RequestBody PasswordResetRequestDto dto
    ) {
        return service.requestPasswordReset(dto);
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(
            @Valid @RequestBody VerifyCodeDto dto
    ) {
        return service.verifyCode(dto);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody PasswordResetDto dto
    ) {
        return service.resetPassword(dto);
    }
}