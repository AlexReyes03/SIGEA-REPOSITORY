package com.utez.edu.sigeabackend.modules.entities.dto;

import jakarta.validation.constraints.*;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;

public record UpdateUserDto(
        @NotNull(message="El ID es obligatorio") Long id,
        String name,
        String paternalSurname,
        String maternalSurname,
        @Email String email,
        @Size(min=8, message="La contraseña debe tener al menos 8 caracteres") String password,
        String registrationNumber,
        Long plantelId,
        Long roleId,
        UserEntity.Status status
) {}