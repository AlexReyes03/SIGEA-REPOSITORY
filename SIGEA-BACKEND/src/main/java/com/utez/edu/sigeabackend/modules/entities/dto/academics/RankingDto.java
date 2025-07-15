package com.utez.edu.sigeabackend.modules.entities.dto.academics;

import java.time.LocalDateTime;

public record RankingDto(
        Long id,
        String comment,
        int star,
        LocalDateTime date,
        Long teacherId,
        StudentInfoDto student
) {
    public record StudentInfoDto(
            Long id,
            String fullName,
            String email,
            String avatarUrl,
            String campusName,
            Long campusId
    ) {}
}