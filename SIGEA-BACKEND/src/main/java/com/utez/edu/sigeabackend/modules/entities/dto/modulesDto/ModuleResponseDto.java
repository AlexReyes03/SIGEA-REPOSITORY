package com.utez.edu.sigeabackend.modules.entities.dto.modulesDto;

public record ModuleResponseDto(
        Long id,
        String name,
        Long careerId,
        String careerName
) {}
