package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import java.util.Date;

public record QualificationDetailDto(
        Long id,
        Long studentId,
        Long groupId,
        Long subjectId,
        Long teacherId,
        Integer grade,
        Date date,
        String teacherName,
        String dateFormatted
) {}