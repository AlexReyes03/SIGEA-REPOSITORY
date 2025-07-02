package com.utez.edu.sigeabackend.modules.entities.dto.academics;

public record CampusDto(
        Long id,
        String name,
        int totalUsers,
        int totalSupervisors
) {}