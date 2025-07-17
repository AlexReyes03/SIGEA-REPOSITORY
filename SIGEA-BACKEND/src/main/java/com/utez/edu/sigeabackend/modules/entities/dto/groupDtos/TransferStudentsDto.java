package com.utez.edu.sigeabackend.modules.entities.dto.groupDtos;

import java.util.List;

public record TransferStudentsDto(
        List<Long> studentIds,
        Long sourceGroupId,
        Long targetGroupId,
        boolean copyQualifications
) {}