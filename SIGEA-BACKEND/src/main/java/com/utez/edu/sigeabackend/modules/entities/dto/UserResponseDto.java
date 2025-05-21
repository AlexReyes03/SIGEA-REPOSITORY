package com.utez.edu.sigeabackend.modules.entities.dto;

import java.time.LocalDateTime;

public record UserResponseDto(
        Long id,
        String name,
        String paternalSurname,
        String maternalSurname,
        String email,
        String registrationNumber,
        String status,
        Long plantelId,
        String plantelName,
        Long roleId,
        String roleName,
        LocalDateTime createdAt
) {}