package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import java.util.List;

public record CurriculumDto(
        Long id,
        String name,
        List<ModuleDto> modules
) {}