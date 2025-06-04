package com.utez.edu.sigeabackend.modules.entities.dto.groupDtos;

import java.util.List;

public record GroupDetailDto(
        Long groupId,
        String name,
        String weekDay,
        String startTime,
        String endTime,
        Long teacherId,
        String teacherName,
        Long careerId,
        String careerName,
        List<StudentBriefDto> students,
        List<ModuleBriefDto> modules,
        List<SubjectBriefDto> subjects
) { }
