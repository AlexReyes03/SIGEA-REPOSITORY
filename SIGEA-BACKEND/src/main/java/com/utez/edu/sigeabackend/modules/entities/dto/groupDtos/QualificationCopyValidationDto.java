package com.utez.edu.sigeabackend.modules.entities.dto.groupDtos;

public record QualificationCopyValidationDto(
        boolean canCopy,
        String reason,
        Long sourceCurriculumId,
        Long targetCurriculumId,
        boolean sameCurriculum
) {}