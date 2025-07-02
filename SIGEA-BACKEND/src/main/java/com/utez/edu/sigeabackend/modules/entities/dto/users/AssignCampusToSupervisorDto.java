package com.utez.edu.sigeabackend.modules.entities.dto.users;

import jakarta.validation.constraints.NotNull;

public record AssignCampusToSupervisorDto(
        @NotNull(message = "El ID del supervisor es obligatorio")
        Long supervisorId,

        @NotNull(message = "El ID del campus es obligatorio")
        Long campusId,

        @NotNull(message = "El ID del usuario que asigna es obligatorio")
        Long assignedByUserId
) {}