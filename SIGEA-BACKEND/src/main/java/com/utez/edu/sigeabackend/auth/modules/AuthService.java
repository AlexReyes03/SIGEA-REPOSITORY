package com.utez.edu.sigeabackend.auth.modules;

import com.utez.edu.sigeabackend.auth.DTO.*;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import com.utez.edu.sigeabackend.utils.security.JWTUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final AuthenticationManager authManager;
    private final UserRepository userRepo;
    private final PasswordResetTokenRepository tokenRepo;
    private final JavaMailSender mailSender;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JWTUtil jwtUtil;
    private final SecureRandom random = new SecureRandom();

    public AuthService(
            AuthenticationManager authManager,
            UserRepository userRepo,
            PasswordResetTokenRepository tokenRepo,
            JavaMailSender mailSender,
            BCryptPasswordEncoder passwordEncoder,
            JWTUtil jwtUtil
    ) {
        this.authManager = authManager;
        this.userRepo = userRepo;
        this.tokenRepo = tokenRepo;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public ResponseEntity<?> login(AuthLoginDto dto) {
        Optional<UserEntity> optionalUser = userRepo.findByEmail(dto.email());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "statusCode", HttpStatus.NOT_FOUND.value(),
                            "message", "Usuario o contraseña incorrectos"
                    ));
        }

        UserEntity user = optionalUser.get();

        if (!passwordEncoder.matches(dto.password(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "statusCode", HttpStatus.UNAUTHORIZED.value(),
                            "message", "Usuario o contraseña incorrectos"
                    ));
        }

        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.email(), dto.password())
        );

        String jwt = jwtUtil.generateToken(
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPassword(),
                        List.of()
                )
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("statusCode", HttpStatus.OK.value());
        payload.put("token", jwt);
        payload.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "paternalSurname", user.getPaternalSurname(),
                "maternalSurname", user.getMaternalSurname(),
                "email", user.getEmail(),
                "registrationNumber", user.getRegistrationNumber(),
                "status", user.getStatus().name(),
                "role", Map.of(
                        "id", user.getRole().getId(),
                        "name", user.getRole().getRoleName()
                ),
                "campusId", user.getPlantel().getId()
        ));

        return ResponseEntity.ok(payload);
    }

    @Transactional
    public ResponseEntity<?> requestPasswordReset(PasswordResetRequestDto dto) {
        tokenRepo.deleteByExpiresAtBefore(LocalDateTime.now());

        Optional<UserEntity> userOpt = userRepo.findByEmail(dto.email());
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok("Si el correo existe, hemos enviado un código de verificación.");
        }

        UserEntity user = userOpt.get();
        int codeInt = 100_000 + random.nextInt(900_000);
        String code = String.valueOf(codeInt);

        PasswordResetToken prt = new PasswordResetToken();
        prt.setUser(user);
        prt.setToken(code);
        prt.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        prt.setUsed(false);
        tokenRepo.save(prt);

        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(user.getEmail());
        mail.setSubject("Código de verificación");
        mail.setText("Tu código de verificación es: " + code + "\nExpira en 15 minutos.");
        mailSender.send(mail);

        return ResponseEntity.ok("Si el correo existe, hemos enviado un código de verificación.");
    }

    public ResponseEntity<?> verifyCode(VerifyCodeDto dto) {
        Optional<PasswordResetToken> prtOpt = tokenRepo.findByToken(dto.code());
        if (prtOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Código inválido");
        }

        PasswordResetToken prt = prtOpt.get();
        boolean expired = prt.getExpiresAt().isBefore(LocalDateTime.now());
        boolean mismatch = !prt.getUser().getEmail().equals(dto.email());

        if (prt.isUsed() || expired || mismatch) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Código inválido o expirado");
        }

        return ResponseEntity.ok("Código verificado con éxito");
    }

    @Transactional
    public ResponseEntity<?> resetPassword(PasswordResetDto dto) {

        ResponseEntity<?> verification = verifyCode(new VerifyCodeDto(dto.email(), dto.code()));
        if (!verification.getStatusCode().is2xxSuccessful()) {
            return verification;
        }

        Optional<UserEntity> userOpt = userRepo.findByEmail(dto.email());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado");
        }

        UserEntity user = userOpt.get();
        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        userRepo.save(user);

        tokenRepo.findByToken(dto.code()).ifPresent(prt -> {
            prt.setUsed(true);
            tokenRepo.save(prt);
        });

        return ResponseEntity.ok("Contraseña actualizada correctamente");
    }
}