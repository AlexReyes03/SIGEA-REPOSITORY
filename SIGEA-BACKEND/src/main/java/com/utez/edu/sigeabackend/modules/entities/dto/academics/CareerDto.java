package com.utez.edu.sigeabackend.modules.entities.dto.academics;

public record CareerDto(
        long id,
        String name,
        String differentiator,
        long campusId,
        String campusName,
        int groupsCount,
        int studentsCount,
        int teachersCount
) {}