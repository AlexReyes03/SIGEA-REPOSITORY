package com.utez.edu.sigeabackend.modules.entities.dto.academics;

public record CampusDto(
        Long id,
        String name,
        String director,
        String directorIdentifier,
        String address,
        String phone,
        String rfc,
        int totalUsers,
        int totalSupervisors
) {}