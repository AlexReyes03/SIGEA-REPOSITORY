package com.utez.edu.sigeabackend.modules.media;

import com.utez.edu.sigeabackend.modules.media.dto.MediaUploadResponseDto;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Objects;
import java.util.UUID;

@Service
public class MediaService {

    private static final long MAX_SIZE = 5 * 1024 * 1024; // 2 MB
    private final MediaRepository repo;

    public MediaService(MediaRepository repo) { this.repo = repo; }

    public MediaUploadResponseDto storeAndReturnDto(
            MultipartFile file,
            MediaEntity.Purpose purpose) throws IOException {

        MediaEntity saved = store(file, purpose);
        return toDto(saved);
    }

    public MediaEntity getByCode(String code) {
        return repo.findByCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Media not found"));
    }

    private MediaEntity store(MultipartFile file,
                              MediaEntity.Purpose purpose) throws IOException {

        validate(file);

        MediaEntity m = new MediaEntity();
        m.setCode(UUID.randomUUID().toString());
        m.setFileName(file.getOriginalFilename());
        m.setContentType(file.getContentType());
        m.setSize(file.getSize());
        m.setData(file.getBytes());
        m.setPurpose(purpose);

        return repo.save(m);
    }

    private void validate(MultipartFile file) {
        if (file.isEmpty())                              throw new IllegalArgumentException("Archivo vacío");
        if (file.getSize() > MAX_SIZE)                   throw new IllegalArgumentException("Archivo > 5 MB");
        if (!Objects.requireNonNull(file.getContentType()).startsWith("image/")) throw new IllegalArgumentException("Solo imágenes");
    }

    private MediaUploadResponseDto toDto(MediaEntity m) {
        return new MediaUploadResponseDto(
                m.getId(),
                m.getFileName(),
                m.getContentType(),
                m.getSize(),
                m.getPurpose().name(),
                "/sigea/api/media/raw/" + m.getCode()
        );
    }
}
