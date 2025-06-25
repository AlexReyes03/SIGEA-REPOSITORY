package com.utez.edu.sigeabackend.modules.entities.dto.academics;

public record CareerDto(
        long id,
        String name,
        String differentiator,
        long plantelId,
        String plantelName,
        int groupsCount,
        int studentsCount,
        int teachersCount
) {}