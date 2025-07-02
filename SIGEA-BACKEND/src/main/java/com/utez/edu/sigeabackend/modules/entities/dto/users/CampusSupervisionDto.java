package com.utez.edu.sigeabackend.modules.entities.dto.users;

import com.utez.edu.sigeabackend.modules.entities.UserCampusSupervisionEntity;
import java.time.LocalDateTime;

public record CampusSupervisionDto(
        Long id,
        Long campusId,
        String campusName,
        UserCampusSupervisionEntity.SupervisionType supervisionType,
        LocalDateTime assignedAt,
        Long assignedByUserId
) {}