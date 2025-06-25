package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateEnrollmentDto(
        @NotNull(message = "El usuario es obligatorio")
        Long userId,

        @NotNull(message = "La carrera es obligatoria")
        Long careerId,

        @Size(max = 15, message = "La matrícula no puede exceder 15 caracteres")
        String customRegistrationNumber // Opcional, si no se proporciona se genera automáticamente
) {}