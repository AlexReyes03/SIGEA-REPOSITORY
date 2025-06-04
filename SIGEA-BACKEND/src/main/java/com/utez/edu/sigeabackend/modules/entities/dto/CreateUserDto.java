package com.utez.edu.sigeabackend.modules.entities.dto;

import jakarta.validation.constraints.*;

public record CreateUserDto(
        @NotBlank String name,
        @NotBlank String paternalSurname,
        String maternalSurname,
        @NotBlank @Email String email,
        @NotBlank @Size(min=8) String password,
        @NotBlank String registrationNumber,
        @NotNull Long plantelId,
        @NotNull Long roleId
) {}
