package com.utez.edu.sigeabackend.modules.entities.dto.academics;

public record TeacherByCareerzDto(
        Long id,
        String name,
        String paternalSurname,
        String maternalSurname,
        String email,
        String roleName,
        String registrationNumber,
        Long careerId,
        String careerName
) {}