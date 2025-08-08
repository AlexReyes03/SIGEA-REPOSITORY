package com.utez.edu.sigeabackend.modules.entities.dto.groupDtos;

public record GroupResponseDto(
        Long groupId,
        String name,
        String weekDay,
        String startTime,
        String endTime,
        String startDate,
        String endDate,
        String status,
        Long teacherId,
        String teacherName,
        Long careerId,
        String careerName,
        Long curriculumId,
        String curriculumName
) { }