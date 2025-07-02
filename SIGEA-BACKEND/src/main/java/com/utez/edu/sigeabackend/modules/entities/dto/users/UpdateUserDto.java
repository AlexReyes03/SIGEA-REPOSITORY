package com.utez.edu.sigeabackend.modules.entities.dto.users;

import jakarta.validation.constraints.*;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;

public record UpdateUserDto(
        @NotNull(message="El ID es obligatorio")
        Long id,

        String name,
        String paternalSurname,
        String maternalSurname,

        @Email(message = "Email inválido")
        String email,

        @Size(min=8, message="La contraseña debe tener al menos 8 caracteres")
        String password,

        Long campusId,
        Long roleId,
        UserEntity.Status status
) {}