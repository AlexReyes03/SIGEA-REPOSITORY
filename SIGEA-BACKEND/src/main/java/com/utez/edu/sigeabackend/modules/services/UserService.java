package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.UserCareerEnrollmentEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.CreateUserDto;
import com.utez.edu.sigeabackend.modules.entities.dto.UpdateUserDto;
import com.utez.edu.sigeabackend.modules.entities.dto.UserResponseDto;
import com.utez.edu.sigeabackend.modules.media.MediaEntity;
import com.utez.edu.sigeabackend.modules.media.MediaService;
import com.utez.edu.sigeabackend.modules.media.dto.MediaUploadResponseDto;
import com.utez.edu.sigeabackend.modules.repositories.RoleRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository    userRepo;
    private final PlantelRepository plantelRepo;
    private final RoleRepository    roleRepo;
    private final BCryptPasswordEncoder passwordEncoder;
    private final MediaService mediaService;

    public UserService(UserRepository userRepo,
                       PlantelRepository plantelRepo,
                       RoleRepository roleRepo,
                       BCryptPasswordEncoder passwordEncoder,
                       MediaService mediaService) {
        this.userRepo = userRepo;
        this.plantelRepo = plantelRepo;
        this.roleRepo = roleRepo;
        this.passwordEncoder = passwordEncoder;
        this.mediaService = mediaService;
    }

    // Helper method to convert entity to DTO
    private UserResponseDto toDto(UserEntity u) {
        String avatarUrl = (u.getAvatar() != null)
                ? "/sigea/api/media/raw/" + u.getAvatar().getCode()
                : null;

        return new UserResponseDto(
                u.getId(),
                u.getName(),
                u.getPaternalSurname(),
                u.getMaternalSurname(),
                u.getEmail(),
                u.getPrimaryRegistrationNumber(),
                u.getAdditionalEnrollmentsCount(),
                u.getStatus().name(),
                u.getPlantel().getId(),
                u.getPlantel().getName(),
                u.getRole().getId(),
                u.getRole().getRoleName(),
                u.getCreatedAt(),
                avatarUrl
        );
    }

    // Obtener todos los usuarios
    public ResponseEntity<List<UserResponseDto>> listAll() {
        List<UserResponseDto> dtos = userRepo.findAll()
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    // Obtener usuario por ID
    public ResponseEntity<UserResponseDto> findById(long id) {
        return userRepo.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Obtener usuario por ID con sus inscripciones
    public ResponseEntity<UserResponseDto> findByIdWithEnrollments(long id) {
        return userRepo.findByIdWithEnrollments(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Obtener usuarios por rol
    public ResponseEntity<List<UserResponseDto>> findByRoleId(long roleId) {
        try {
            List<UserEntity> users = userRepo.findByRoleId(roleId);

            if (users.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            List<UserResponseDto> usersDto = users.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(usersDto);

        } catch (Exception e) {
            throw new RuntimeException("Error al consultar usuarios por rol " + e.getMessage(), e);
        }
    }

    // Obtener usuarios por rol y plantel
    public ResponseEntity<List<UserResponseDto>> findByRoleIdAndPlantelId(long roleId, long plantelId) {
        try {
            List<UserEntity> users = userRepo.findByRoleIdAndPlantelId(roleId, plantelId);

            if (users.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            List<UserResponseDto> usersDto = users.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(usersDto);

        } catch (Exception e) {
            throw new RuntimeException("Error al consultar usuarios por rol y plantel " + e.getMessage(), e);
        }
    }

    // Obtener usuarios activos en una carrera específica
    public ResponseEntity<List<UserResponseDto>> findByActiveCareerEnrollment(long careerId) {
        try {
            List<UserEntity> users = userRepo.findByActiveCareerEnrollment(careerId);

            List<UserResponseDto> usersDto = users.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(usersDto);

        } catch (Exception e) {
            throw new RuntimeException("Error al consultar usuarios por carrera " + e.getMessage(), e);
        }
    }

    // Crear nuevo usuario
    @Transactional
    public ResponseEntity<UserResponseDto> create(CreateUserDto dto) {
        // Verificar que el email no existe
        if (userRepo.existsByEmail(dto.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        // Verificar que el plantel existe
        var plantel = plantelRepo.findById(dto.plantelId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Plantel no existe"
                ));

        // Verificar que el rol existe
        var role = roleRepo.findById(dto.roleId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Role no existe"
                ));

        // Crear el usuario
        var user = new UserEntity();
        user.setName(dto.name());
        user.setPaternalSurname(dto.paternalSurname());
        user.setMaternalSurname(dto.maternalSurname());
        user.setEmail(dto.email());
        user.setPlantel(plantel);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(dto.password()));

        var saved = userRepo.save(user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toDto(saved));
    }

    // Actualizar usuario
    @Transactional
    public ResponseEntity<UserResponseDto> update(long id, UpdateUserDto dto) {
        return userRepo.findById(id)
                .map(existing -> {
                    // Actualizar campos básicos
                    if (dto.name() != null) existing.setName(dto.name());
                    if (dto.paternalSurname() != null) existing.setPaternalSurname(dto.paternalSurname());
                    if (dto.maternalSurname() != null) existing.setMaternalSurname(dto.maternalSurname());
                    if (dto.email() != null) existing.setEmail(dto.email());
                    if (dto.status() != null) existing.setStatus(dto.status());

                    // Actualizar plantel
                    if (dto.plantelId() != null) {
                        var p = plantelRepo.findById(dto.plantelId())
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Plantel no existe"
                                ));
                        existing.setPlantel(p);
                    }

                    // Actualizar rol
                    if (dto.roleId() != null) {
                        var r = roleRepo.findById(dto.roleId())
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Role no existe"
                                ));
                        existing.setRole(r);
                    }

                    // Actualizar contraseña si se proporciona
                    if (dto.password() != null && !dto.password().isBlank()) {
                        existing.setPassword(passwordEncoder.encode(dto.password()));
                    }

                    var updated = userRepo.save(existing);
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Subir avatar
    @Transactional
    public MediaUploadResponseDto uploadAvatar(Long userId, MultipartFile file) throws IOException {
        MediaUploadResponseDto dto = mediaService.storeAndReturnDto(file, MediaEntity.Purpose.AVATAR);

        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        MediaEntity avatarEntity = mediaService.getByCode(
                dto.url().substring(dto.url().lastIndexOf('/') + 1));
        user.setAvatar(avatarEntity);
        userRepo.save(user);

        return dto;
    }

    // Eliminar usuario
    @Transactional
    public ResponseEntity<Void> delete(long id) {
        return userRepo.findById(id)
                .map(u -> {
                    // Verificar si el usuario tiene inscripciones activas
                    boolean hasActiveEnrollments = u.getCareerEnrollments().stream()
                            .anyMatch(enrollment -> enrollment.getStatus() ==
                                    UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE);

                    if (hasActiveEnrollments) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "No se puede eliminar el usuario porque tiene inscripciones activas");
                    }

                    userRepo.delete(u);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Desactivar usuario (cambiar estado a INACTIVE)
    @Transactional
    public ResponseEntity<UserResponseDto> deactivateUser(long id) {
        return userRepo.findById(id)
                .map(user -> {
                    user.setStatus(UserEntity.Status.INACTIVE);
                    var updated = userRepo.save(user);
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Reactivar usuario (cambiar estado a ACTIVE)
    @Transactional
    public ResponseEntity<UserResponseDto> reactivateUser(long id) {
        return userRepo.findById(id)
                .map(user -> {
                    user.setStatus(UserEntity.Status.ACTIVE);
                    var updated = userRepo.save(user);
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}