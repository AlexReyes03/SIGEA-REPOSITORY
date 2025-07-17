package com.utez.edu.sigeabackend.modules.entities.dto.groupDtos;

import java.util.List;

public record TransferResultDto(
        List<StudentTransferResult> results,
        String message,
        boolean success
) {}