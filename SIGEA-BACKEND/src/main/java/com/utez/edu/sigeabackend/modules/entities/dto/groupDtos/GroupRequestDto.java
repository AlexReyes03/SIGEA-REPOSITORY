package com.utez.edu.sigeabackend.modules.entities.dto.groupDtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GroupRequestDto(
        @NotBlank
        String name,

        @NotBlank
        String weekDay,

        @NotBlank
        String startTime,

        @NotBlank
        String endTime,

        @NotNull
        Long teacherId,

        @NotNull
        Long careerId,

        @NotNull
        Long curriculumId
) { }