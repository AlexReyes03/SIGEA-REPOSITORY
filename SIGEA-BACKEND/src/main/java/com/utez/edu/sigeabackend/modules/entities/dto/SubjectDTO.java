package com.utez.edu.sigeabackend.modules.entities.dto;

public record SubjectDTO(
        long id,
        String name,
        int weeks,
        TeacherDTO teacher
) {}

