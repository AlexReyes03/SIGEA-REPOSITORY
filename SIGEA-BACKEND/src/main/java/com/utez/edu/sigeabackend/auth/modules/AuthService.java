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

        // Construir respuesta (user + token + status)
        Map<String, Object> payload = new HashMap<>();

        String avatarUrl = "";
        if (user.getAvatar() != null) {
            avatarUrl = "/sigea/api/media/raw/" + user.getAvatar().getCode();
        }
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
                        "id",   user.getRole().getId(),
                        "name", user.getRole().getRoleName()
                ),
                "campus", Map.of(
                        "id",   user.getPlantel().getId(),
                        "name", user.getPlantel().getName()
                ),
                "avatarUrl", avatarUrl
        ));
        return ResponseEntity.ok(payload);
    }

    @Transactional
    public ResponseEntity<?> requestPasswordReset(PasswordResetRequestDto dto) {
        // Limpia tokens expirados
        tokenRepo.deleteByExpiresAtBefore(LocalDateTime.now());

        // Busca usuario; si no existe, devolvemos OK de todas formas
        Optional<UserEntity> userOpt = userRepo.findByEmail(dto.email());
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok("Si el correo existe, hemos enviado un código de verificación.");
        }
        UserEntity user = userOpt.get();

        // Genera OTP crudo
        int codeInt = 100_000 + random.nextInt(900_000);
        String code = String.valueOf(codeInt);

        // Hashea el OTP y persiste sólo el hash
        PasswordResetToken prt = new PasswordResetToken();
        prt.setUser(user);
        prt.setTokenHash(passwordEncoder.encode(code));
        prt.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        prt.setUsed(false);
        tokenRepo.save(prt);

        // Envía el OTP “crudo” al correo
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(user.getEmail());
        mail.setSubject("Código de verificación");
        mail.setText("Tu código de verificación es: " + code +
                "\nExpira en 15 minutos.");
        mailSender.send(mail);

        return ResponseEntity.ok("Si el correo existe, hemos enviado un código de verificación.");
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> verifyCode(VerifyCodeDto dto) {
        // Buscar el token más reciente para este usuario
        Optional<PasswordResetToken> prtOpt = tokenRepo
                .findTopByUser_EmailOrderByExpiresAtDesc(dto.email());

        if (prtOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Código inválido");
        }
        PasswordResetToken prt = prtOpt.get();

        // Verificar condiciones de uso
        boolean expired = prt.getExpiresAt().isBefore(LocalDateTime.now());
        boolean wrongUser = !prt.getUser().getEmail().equals(dto.email());
        boolean wrongCode = !passwordEncoder.matches(dto.code(), prt.getTokenHash());

        if (prt.isUsed() || expired || wrongUser || wrongCode) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Código inválido o expirado");
        }

        // Marcar como usado
        prt.setUsed(true);
        tokenRepo.save(prt);

        return ResponseEntity.ok("Código verificado con éxito");
    }


    @Transactional
    public ResponseEntity<?> resetPassword(PasswordResetDto dto) {
        // Validar el código OTP
        ResponseEntity<?> verification = verifyCode(
                new VerifyCodeDto(dto.email(), dto.code())
        );
        if (!verification.getStatusCode().is2xxSuccessful()) {
            return verification;
        }

        // Cargar el usuario
        UserEntity user = userRepo.findByEmail(dto.email())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Usuario no encontrado"
                ));

        // Actualizar la contraseña con BCrypt
        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        userRepo.save(user);

        return ResponseEntity.ok("Contraseña actualizada correctamente");
    }

    @Transactional
    public ResponseEntity<?> changePassword(ChangePasswordDto dto, long userId) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        if (!passwordEncoder.matches(dto.currentPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Contraseña actual incorrecta"));
        }

        if (dto.newPassword() == null || dto.newPassword().length() < 8) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "La nueva contraseña debe tener al menos 8 caracteres"));
        }

        user.setPassword(passwordEncoder.encode(dto.newPassword()));
        userRepo.save(user);

        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada correctamente"));
    }

}