package com.utez.edu.sigeabackend.modules.entities.dto.users;

import java.util.List;

public record SupervisorCampusesResponseDto(
        Long supervisorId,
        String supervisorName,
        String supervisorEmail,
        Long primaryCampusId,
        String primaryCampusName,
        List<CampusSupervisionDto> additionalCampuses,
        int totalSupervisedCampuses
) {}