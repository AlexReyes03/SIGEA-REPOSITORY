package com.utez.edu.sigeabackend.auth.modules;

import com.utez.edu.sigeabackend.auth.ActiveUserService;
import com.utez.edu.sigeabackend.auth.DTO.*;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import com.utez.edu.sigeabackend.utils.security.JWTUtil;
import com.utez.edu.sigeabackend.utils.security.UserDetailsImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final AuthenticationManager authManager;
    private final UserRepository userRepo;
    private final PasswordResetTokenRepository tokenRepo;
    private final JavaMailSender mailSender;
    private final AttemptService attemptService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JWTUtil jwtUtil;
    private final ActiveUserService activeUserService;
    private final SecureRandom random = new SecureRandom();

    public AuthService(
            AuthenticationManager authManager,
            UserRepository userRepo,
            PasswordResetTokenRepository tokenRepo,
            JavaMailSender mailSender,
            AttemptService attemptService,
            BCryptPasswordEncoder passwordEncoder,
            JWTUtil jwtUtil,
            ActiveUserService activeUserService
    ) {
        this.authManager = authManager;
        this.userRepo = userRepo;
        this.tokenRepo = tokenRepo;
        this.mailSender = mailSender;
        this.attemptService = attemptService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.activeUserService = activeUserService;
    }

    @Transactional
    public ResponseEntity<?> login(AuthLoginDto dto) {
        String email = dto.email();

        // Bloqueo por demasiados intentos fallidos
        if (attemptService.isLoginBlocked(email)) {
            return ResponseEntity.status(423)
                    .body(Map.of(
                            "statusCode", 423,
                            "message", "Cuenta bloqueada temporalmente. Intenta más tarde."
                    ));
        }

        // Buscar usuario por email
        Optional<UserEntity> optionalUser = userRepo.findByEmail(email);
        if (optionalUser.isEmpty()) {
            attemptService.loginFailed(email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "statusCode", HttpStatus.NOT_FOUND.value(),
                            "message", "Usuario o contraseña incorrectos"
                    ));
        }
        UserEntity user = optionalUser.get();

        // Verificar contraseña
        if (!passwordEncoder.matches(dto.password(), user.getPassword())) {
            attemptService.loginFailed(email);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "statusCode", HttpStatus.UNAUTHORIZED.value(),
                            "message", "Usuario o contraseña incorrectos"
                    ));
        }

        // Autenticar con Spring Security y registrar éxito/fracaso
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, dto.password())
            );
            attemptService.loginSucceeded(email);
        } catch (BadCredentialsException ex) {
            attemptService.loginFailed(email);
            throw ex;
        }

        // Generar JWT
        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwt = jwtUtil.generateToken(userDetails);

        Instant expiration = Instant.now().plusSeconds(10 * 60 * 60); // 10 h
        activeUserService.registerLogin(user.getId(), expiration);

        // Construir respuesta (user + token)
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
        // 1) Limpia tokens expirados
        tokenRepo.deleteByExpiresAtBefore(LocalDateTime.now());

        // 2) Busca usuario; si no existe, devolvemos OK de todas formas
        Optional<UserEntity> userOpt = userRepo.findByEmail(dto.email());
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok("Si el correo existe, hemos enviado un código de verificación.");
        }
        UserEntity user = userOpt.get();

        // 3) Genera OTP crudo
        int codeInt = 100_000 + random.nextInt(900_000);
        String code = String.valueOf(codeInt);

        // 4) Hashea el OTP y persiste sólo el hash
        PasswordResetToken prt = new PasswordResetToken();
        prt.setUser(user);
        prt.setTokenHash(passwordEncoder.encode(code));
        prt.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        prt.setUsed(false);
        tokenRepo.save(prt);

        // 5) Envía el OTP “crudo” al correo
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(user.getEmail());
        mail.setSubject("Código de verificación");
        mail.setText("Tu código de verificación es: " + code +
                "\nExpira en 15 minutos.");
        mailSender.send(mail);

        // 6) Respuesta
        return ResponseEntity.ok("Si el correo existe, hemos enviado un código de verificación.");
    }

    public ResponseEntity<?> verifyCode(VerifyCodeDto dto) {
        // 1) Buscar el token más reciente para este usuario
        Optional<PasswordResetToken> prtOpt = tokenRepo
                .findTopByUser_EmailOrderByExpiresAtDesc(dto.email());

        if (prtOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Código inválido");
        }
        PasswordResetToken prt = prtOpt.get();

        // 2) Verificar condiciones de uso
        boolean expired = prt.getExpiresAt().isBefore(LocalDateTime.now());
        boolean wrongUser = !prt.getUser().getEmail().equals(dto.email());
        boolean wrongCode = !passwordEncoder.matches(dto.code(), prt.getTokenHash());

        if (prt.isUsed() || expired || wrongUser || wrongCode) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Código inválido o expirado");
        }

        // 3) Marcar como usado
        prt.setUsed(true);
        tokenRepo.save(prt);

        // 4) Responder éxito
        return ResponseEntity.ok("Código verificado con éxito");
    }


    @Transactional
    public ResponseEntity<?> resetPassword(PasswordResetDto dto) {
        // Validar el código OTP (verifyCode ya marca el token como usado)
        ResponseEntity<?> verification = verifyCode(
                new VerifyCodeDto(dto.email(), dto.code())
        );
        if (!verification.getStatusCode().is2xxSuccessful()) {
            return verification;
        }

        // Cargar el usuario (o lanzar 400 si no existe)
        UserEntity user = userRepo.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Usuario no encontrado"
                ));

        // Actualizar la contraseña con BCrypt
        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        userRepo.save(user);

        // Responder éxito
        return ResponseEntity.ok("Contraseña actualizada correctamente");
    }
}