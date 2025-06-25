package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCareerDto(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
        String name,

        @NotBlank(message = "El diferenciador es obligatorio")
        @Size(max = 5, message = "El diferenciador no puede exceder 5 caracteres")
        String differentiator,

        @NotNull(message = "El plantel es obligatorio")
        Long plantelId
) {}