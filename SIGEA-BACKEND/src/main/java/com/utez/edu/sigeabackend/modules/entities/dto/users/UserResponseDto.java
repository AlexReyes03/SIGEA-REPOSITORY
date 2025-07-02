package com.utez.edu.sigeabackend.modules.entities.dto.users;

import java.time.LocalDateTime;
import java.util.List;

public record UserResponseDto(
        Long id,
        String name,
        String paternalSurname,
        String maternalSurname,
        String email,
        String primaryRegistrationNumber,
        int additionalEnrollmentsCount,
        String status,
        Long campusId,
        String campusName,
        Long roleId,
        String roleName,
        LocalDateTime createdAt,
        String avatarUrl,
        List<CampusSupervisionDto> supervisedCampuses
) {}