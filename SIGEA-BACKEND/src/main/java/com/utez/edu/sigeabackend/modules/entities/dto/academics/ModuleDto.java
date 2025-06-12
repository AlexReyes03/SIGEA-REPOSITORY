package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import java.util.List;

public record ModuleDto(
        Long id,
        String name,
        List<SubjectDto> subjects
) {}