package com.utez.edu.sigeabackend.modules.entities.dto.groupDtos;

import java.time.LocalDateTime;

public record GroupStudentHistoryDto(
        Long groupId,
        String groupName,
        String careerName,
        String curriculumName,
        LocalDateTime entryDate,
        LocalDateTime exitDate,
        String status,
        boolean isActive
) {}