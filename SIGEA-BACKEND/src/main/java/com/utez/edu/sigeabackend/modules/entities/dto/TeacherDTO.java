package com.utez.edu.sigeabackend.modules.entities.dto;

public record TeacherDTO(
        long id,
        String name,
        String email,
        String roleName
) {}