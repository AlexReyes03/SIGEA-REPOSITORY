package com.utez.edu.sigeabackend.modules.entities.dto;

import jakarta.validation.constraints.*;

public record CreateUserDto(
        @NotBlank(message = "El nombre es obligatorio")
        String name,

        @NotBlank(message = "El apellido paterno es obligatorio")
        String paternalSurname,

        String maternalSurname,

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "Email inválido")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min=8, message = "La contraseña debe tener al menos 8 caracteres")
        String password,

        @NotNull(message = "El campus es obligatorio")
        Long campusId,

        @NotNull(message = "El rol es obligatorio")
        Long roleId
) {}