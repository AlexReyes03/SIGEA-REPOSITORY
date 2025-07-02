package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import com.utez.edu.sigeabackend.modules.entities.UserCareerEnrollmentEntity;

import java.time.LocalDateTime;

public record UserCareerEnrollmentDto(
        Long id,
        Long userId,
        String userName,
        String userPaternalSurname,
        String userMaternalSurname,
        String userEmail,
        String userRole,
        Long careerId,
        String careerName,
        String careerDifferentiator,
        Long campusId,
        String campusName,
        String registrationNumber,
        String status,
        LocalDateTime enrolledAt,
        LocalDateTime completedAt,
        boolean hasActiveGroups
) {
    public static UserCareerEnrollmentDto fromEntity(UserCareerEnrollmentEntity entity) {
        return new UserCareerEnrollmentDto(
                entity.getId(),
                entity.getUser().getId(),
                entity.getUser().getName(),
                entity.getUser().getPaternalSurname(),
                entity.getUser().getMaternalSurname(),
                entity.getUser().getEmail(),
                entity.getUser().getRole().getRoleName(),
                entity.getCareer().getId(),
                entity.getCareer().getName(),
                entity.getCareer().getDifferentiator(),
                entity.getCampus().getId(),
                entity.getCampus().getName(),
                entity.getRegistrationNumber(),
                entity.getStatus().name(),
                entity.getEnrolledAt(),
                entity.getCompletedAt(),
                false
        );
    }
}