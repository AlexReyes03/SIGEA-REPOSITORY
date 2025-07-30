package com.utez.edu.sigeabackend.modules.entities.dto.academics;

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
}