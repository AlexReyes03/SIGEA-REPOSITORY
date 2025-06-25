package com.utez.edu.sigeabackend.modules.entities.dto.academics;

public record GroupStudentDto(
        Long groupId,
        Long studentId,
        String fullName,
        String email,
        String primaryRegistrationNumber,
        int additionalEnrollmentsCount
) {}