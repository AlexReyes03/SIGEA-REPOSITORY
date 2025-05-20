package com.utez.edu.sigeabackend.auth.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordResetDto(
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp="\\d{6}") String code,
        @NotBlank @Size(min=8, message="La contraseña debe tener al menos 8 caracteres")
        String newPassword
) {}