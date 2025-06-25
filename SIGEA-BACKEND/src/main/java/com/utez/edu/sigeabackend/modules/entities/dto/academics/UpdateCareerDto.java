package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import jakarta.validation.constraints.Size;

public record UpdateCareerDto(
        @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
        String name,

        @Size(max = 5, message = "El diferenciador no puede exceder 5 caracteres")
        String differentiator,

        Long plantelId
) {}