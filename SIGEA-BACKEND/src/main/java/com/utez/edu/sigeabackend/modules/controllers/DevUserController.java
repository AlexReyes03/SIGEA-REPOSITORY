package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.CampusEntity;
import com.utez.edu.sigeabackend.modules.entities.RoleEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.CampusRepository;
import com.utez.edu.sigeabackend.modules.repositories.RoleRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador temporal para crear usuario DEV de forma segura.
 * Se auto-deshabilita cuando ya existe al menos un usuario DEV.
 */
@RestController
@RequestMapping("/sigea/api")
public class DevUserController {

    private static final Logger logger = LoggerFactory.getLogger(DevUserController.class);

    @Value("${sigea.dev.secret:}")
    private String secretKey;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CampusRepository campusRepository;
    private final PasswordEncoder passwordEncoder;

    public DevUserController(UserRepository userRepository,
                             RoleRepository roleRepository,
                             CampusRepository campusRepository,
                             PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.campusRepository = campusRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Endpoint temporal para crear usuario DEV
     * URL: POST /sigea/api/create-dev-user?secret=tu-clave-super-secreta
     * Body: El mismo para crear usuarios
     * Solo funciona si NO existe ningún usuario con rol DEV y el Endpoint está habilitado
     */
    @PostMapping("/create-dev-user")
    public ResponseEntity<?> createDevUser(
            @RequestParam(required = false) String secret,
            @RequestBody Map<String, String> userData) {

        try {
            if (devUserExists()) {
                return ResponseEntity.status(410) // Gone
                        .body(Map.of("error", "Ya existe un usuario DEV en el sistema"));
            }

            if (!isValidRequest(secret)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Acceso denegado"));
            }

            String email = userData.get("email");
            if (email == null || userRepository.existsByEmail(email)) {
                return ResponseEntity.status(400)
                        .body(Map.of("error", "Email inválido o ya existe"));
            }

            // Crear usuario DEV
            UserEntity devUser = createDevUserEntity(userData);
            userRepository.save(devUser);

            logger.info("Usuario especial creado exitosamente");

            return ResponseEntity.ok(Map.of(
                    "message", "Usuario DEV creado correctamente",
                    "id", devUser.getId()
            ));

        } catch (Exception e) {
            logger.error("Error en operación especial: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error interno del servidor"));
        }
    }

    private boolean isValidRequest(String secret) {
        // Solo en desarrollo o test
        if (!"dev".equals(activeProfile) && !"development".equals(activeProfile) && !"test".equals(activeProfile)) {
            return false;
        }

        return !secretKey.isEmpty() && secretKey.equals(secret);
    }

    /**
     * Verifica si ya existe al menos un usuario con rol DEV en la base de datos
     */
    private boolean devUserExists() {
        try {
            RoleEntity devRole = roleRepository.findAll().stream()
                    .filter(role -> "DEV".equals(role.getRoleName()))
                    .findFirst()
                    .orElse(null);

            if (devRole == null) {
                return false;
            }

            return userRepository.findAll().stream()
                    .anyMatch(user -> user.getRole().getId().equals(devRole.getId()));

        } catch (Exception e) {
            logger.error("Error verificando existencia de usuario DEV: {}", e.getMessage());
            return true;
        }
    }

    private UserEntity createDevUserEntity(Map<String, String> userData) {
        // Buscar rol DEV usando getAll y mapeo
        RoleEntity devRole = roleRepository.findAll().stream()
                .filter(role -> "DEV".equals(role.getRoleName()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Rol DEV no encontrado"));

        // Buscar primer campus
        CampusEntity campus = campusRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No hay campus disponibles"));

        // Crear usuario
        UserEntity user = new UserEntity();
        user.setName(userData.get("name"));
        user.setPaternalSurname(userData.get("paternalSurname"));
        user.setMaternalSurname(userData.get("maternalSurname"));
        user.setEmail(userData.get("email"));
        user.setPassword(passwordEncoder.encode(userData.get("password")));
        user.setRole(devRole);
        user.setCampus(campus);

        return user;
    }

    /**
     * Endpoint para verificar si el endpoint temporal sigue disponible
     * Disponible solo cuando NO existe ningún usuario DEV
     */
    @GetMapping("/dev-status")
    public ResponseEntity<?> getDevStatus(@RequestParam(required = false) String secret) {
        if (!isValidRequest(secret)) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Acceso denegado"));
        }

        boolean devExists = devUserExists();

        return ResponseEntity.ok(Map.of(
                "available", !devExists,
                "devUserExists", devExists,
                "message", devExists ? "Ya existe usuario DEV" : "Endpoint disponible para crear usuario DEV"
        ));
    }
}