package com.utez.edu.sigeabackend.auth.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO para el login de usuario.
 * Contiene el email y la contraseña en texto plano,
 * ambos obligatorios y con validación.
 */
public record AuthLoginDto(
        @NotBlank(message = "El email no puede estar vacío")
        @Email(message = "Debe ser un email válido")
        String email,

        @NotBlank(message = "La contraseña no puede estar vacía")
        String password
) {}