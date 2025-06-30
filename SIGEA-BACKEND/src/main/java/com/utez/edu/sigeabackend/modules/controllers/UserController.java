package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.dto.CreateUserDto;
import com.utez.edu.sigeabackend.modules.entities.dto.UpdateUserDto;
import com.utez.edu.sigeabackend.modules.entities.dto.UserResponseDto;
import com.utez.edu.sigeabackend.modules.media.dto.MediaUploadResponseDto;
import com.utez.edu.sigeabackend.modules.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/sigea/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService userService) {
        this.service = userService;
    }

    /** GET /sigea/api/users - Obtener todos los usuarios */
    @GetMapping
    public ResponseEntity<List<UserResponseDto>> getAll() {
        return service.listAll();
    }

    /** GET /sigea/api/users/{id} - Obtener usuario por ID */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getById(@PathVariable long id) {
        return service.findById(id);
    }

    /** GET /sigea/api/users/{id}/with-enrollments - Obtener usuario con sus inscripciones */
    @GetMapping("/{id}/with-enrollments")
    public ResponseEntity<UserResponseDto> getByIdWithEnrollments(@PathVariable long id) {
        return service.findByIdWithEnrollments(id);
    }

    /** GET /sigea/api/users/role/{roleId} - Obtener usuarios por rol */
    @GetMapping("/role/{roleId}")
    public ResponseEntity<List<UserResponseDto>> getUsersByRoleId(@PathVariable long roleId) {
        return service.findByRoleId(roleId);
    }

    /** GET /sigea/api/users/role/{roleId}/plantel/{plantelId} - Obtener usuarios por rol y plantel */
    @GetMapping("/role/{roleId}/plantel/{plantelId}")
    public ResponseEntity<List<UserResponseDto>> getUsersByRoleAndPlantel(
            @PathVariable long roleId,
            @PathVariable long plantelId) {
        return service.findByRoleIdAndPlantelId(roleId, plantelId);
    }

    /** GET /sigea/api/users/career/{careerId}/active - Obtener usuarios activos en una carrera */
    @GetMapping("/career/{careerId}/active")
    public ResponseEntity<List<UserResponseDto>> getUsersByActiveCareer(@PathVariable long careerId) {
        return service.findByActiveCareerEnrollment(careerId);
    }

    /** POST /sigea/api/users - Crear nuevo usuario */
    @PostMapping
    public ResponseEntity<UserResponseDto> create(@Valid @RequestBody CreateUserDto dto) {
        return service.create(dto);
    }

    /** PUT /sigea/api/users/{id} - Actualizar usuario */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDto> update(
            @PathVariable long id,
            @Valid @RequestBody UpdateUserDto dto) {
        return service.update(id, dto);
    }

    /** PATCH /sigea/api/users/{id}/deactivate - Desactivar usuario */
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<UserResponseDto> deactivateUser(@PathVariable long id) {
        return service.deactivateUser(id);
    }

    /** PATCH /sigea/api/users/{id}/reactivate - Reactivar usuario */
    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<UserResponseDto> reactivateUser(@PathVariable long id) {
        return service.reactivateUser(id);
    }

    /** DELETE /sigea/api/users/{id} - Eliminar usuario */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        return service.delete(id);
    }

    /** POST /sigea/api/users/{userId}/avatar - Subir avatar de usuario */
    @PostMapping("/{userId}/avatar")
    public ResponseEntity<MediaUploadResponseDto> uploadAvatar(
            @PathVariable Long userId,
            @RequestPart("file") MultipartFile file) throws IOException {

        return ResponseEntity.ok(service.uploadAvatar(userId, file));
    }
}