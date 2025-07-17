package com.utez.edu.sigeabackend.modules.entities.dto.users;

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

        @NotNull(message = "El campus es obligatorio")
        Long campusId,

        @NotNull(message = "El rol es obligatorio")
        Long roleId
) {}