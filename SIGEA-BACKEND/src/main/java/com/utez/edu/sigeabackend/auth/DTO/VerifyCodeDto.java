package com.utez.edu.sigeabackend.auth.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyCodeDto(
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp="\\d{6}") String code
) {}