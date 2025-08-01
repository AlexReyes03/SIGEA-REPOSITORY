package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import java.time.LocalDateTime;

public class RankingRequestDtos {

    public record CheckEvaluationRequestDto(
            Long studentId,
            Long teacherId,
            Long moduleId
    ) {}

    public record StudentEvaluationModulesRequestDto(
            Long studentId
    ) {}

    public record TeacherRankingsRequestDto(
            Long teacherId
    ) {}

    public record StudentRankingsRequestDto(
            Long studentId
    ) {}

    public record CampusRankingStatsRequestDto(
            Long campusId
    ) {}

    public record AnonymousRankingDto(
            Long id,
            String comment,
            Integer star,
            LocalDateTime date,
            Long teacherId
    ) {}
}