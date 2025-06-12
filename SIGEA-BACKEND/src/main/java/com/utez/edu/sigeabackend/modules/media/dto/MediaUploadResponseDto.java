package com.utez.edu.sigeabackend.modules.media.dto;

public record MediaUploadResponseDto(
        Long   id,
        String fileName,
        String contentType,
        Long   size,
        String purpose,
        String url
) {}
