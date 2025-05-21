package com.utez.edu.sigeabackend.auth.modules;

import com.utez.edu.sigeabackend.auth.ActiveUserService;
import com.utez.edu.sigeabackend.auth.DTO.*;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import com.utez.edu.sigeabackend.utils.security.JWTUtil;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/sigea/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService service;
    private final JWTUtil jwtUtil;
    private final UserRepository userRepo;
    private final ActiveUserService activeUserService;

    public AuthController(
            AuthService service,
            JWTUtil jwtUtil,
            UserRepository userRepo,
            ActiveUserService activeUserService
    ) {
        this.service = service;
        this.jwtUtil = jwtUtil;
        this.userRepo = userRepo;
        this.activeUserService = activeUserService;
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

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extractUsername(token);
        userRepo.findByEmail(email).ifPresent(u -> activeUserService.registerLogout(u.getId()));
        return ResponseEntity.ok("Logout exitoso");
    }

    @GetMapping("/active-users")
    public ResponseEntity<?> activeUsers() {
        int count = activeUserService.getActiveUserCount();
        return ResponseEntity.ok(Map.of("activeUsers", count));
    }

}