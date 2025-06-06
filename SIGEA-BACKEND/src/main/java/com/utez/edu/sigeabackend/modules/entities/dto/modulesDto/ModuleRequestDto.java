package com.utez.edu.sigeabackend.modules.entities.dto.modulesDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ModuleRequestDto(
        @NotBlank(message = "El nombre del módulo es obligatorio")
        String name,
        @NotNull(message = "El ID de la carrera es obligatorio")
        Long careerId
) {}
