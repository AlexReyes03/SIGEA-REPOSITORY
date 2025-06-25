package com.utez.edu.sigeabackend.modules.entities.dto.academics;

public record StudentGroupCheckDto(
        Long studentId,
        Long careerId,
        boolean hasActiveGroups,
        long groupCount,
        String careerName
) {}