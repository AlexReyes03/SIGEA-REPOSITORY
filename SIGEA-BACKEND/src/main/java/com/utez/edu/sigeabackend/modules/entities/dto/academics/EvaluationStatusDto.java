package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import java.time.LocalDateTime;

public record EvaluationStatusDto(
        boolean isEvaluated,
        Integer rating,
        String comment,
        LocalDateTime evaluationDate
) {}