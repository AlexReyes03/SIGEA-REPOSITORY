package com.utez.edu.sigeabackend.modules.entities.dto;

public record SubjectCreateDto(
        String name,
        int weeks,
        Long moduleId,
        Long teacherId
) {}