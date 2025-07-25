package com.utez.edu.sigeabackend.modules.entities.dto.users;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdateSupervisorCampusesDto(
        @NotNull(message = "El ID del supervisor es obligatorio")
        Long supervisorId,

        @NotNull(message = "La lista de campus es obligatoria")
        List<Long> campusIds,

        @NotNull(message = "El ID del usuario que actualiza es obligatorio")
        Long updatedByUserId
) {}