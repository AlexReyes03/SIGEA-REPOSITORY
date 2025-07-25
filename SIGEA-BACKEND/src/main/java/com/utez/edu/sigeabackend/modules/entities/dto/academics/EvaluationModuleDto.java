package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import java.util.List;

public record EvaluationModuleDto(
        String id,                    // Unique identifier (groupId-teacherId)
        String name,                  // Module display name
        String teacherName,           // Teacher full name
        Long teacherId,               // Teacher ID
        Long groupId,                 // Group ID
        String curriculumName,        // Curriculum name
        String schedule,              // Schedule info
        List<String> subjects,        // Subject names
        boolean isEvaluated,          // Has been evaluated
        Integer submittedRating,      // Rating if evaluated
        String submittedComment       // Comment if evaluated
) {}
