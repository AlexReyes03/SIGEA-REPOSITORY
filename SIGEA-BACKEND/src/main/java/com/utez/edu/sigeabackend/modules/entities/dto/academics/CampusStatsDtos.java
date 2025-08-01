package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import java.util.List;

public class CampusStatsDtos {

    public record CampusRankingStatsDto(
            double averageRating,
            int totalEvaluations,
            List<StarDistributionDto> starDistribution,
            List<TeacherRankingDto> topTeachers
    ) {}

    public record StarDistributionDto(
            int stars,
            int count,
            double percentage
    ) {}

    public record TeacherRankingDto(
            Long teacherId,
            String teacherName,
            String teacherEmail,
            String avatarUrl,
            double averageRating,
            int totalEvaluations,
            int position
    ) {}
}