package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import com.utez.edu.sigeabackend.modules.entities.UserCareerEnrollmentEntity;
import jakarta.validation.constraints.Size;

public record UpdateEnrollmentDto(
        @Size(max = 15, message = "La matrícula no puede exceder 15 caracteres")
        String registrationNumber,

        UserCareerEnrollmentEntity.EnrollmentStatus status
) {}
