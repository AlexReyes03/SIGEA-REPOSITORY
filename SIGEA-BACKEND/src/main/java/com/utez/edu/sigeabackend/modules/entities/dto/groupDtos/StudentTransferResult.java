package com.utez.edu.sigeabackend.modules.entities.dto.groupDtos;

public record StudentTransferResult(
        Long studentId,
        String studentName,
        boolean transferSuccess,
        boolean qualificationsCopied,
        int qualificationsCopiedCount,
        String errorMessage
) {}