package com.utez.edu.sigeabackend.auth.DTO;

public record ChangePasswordDto(
        String currentPassword,
        String newPassword
) {}
