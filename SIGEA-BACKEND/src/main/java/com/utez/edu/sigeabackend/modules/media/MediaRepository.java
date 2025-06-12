package com.utez.edu.sigeabackend.modules.media;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MediaRepository extends JpaRepository<MediaEntity, Long> {
    Optional<MediaEntity> findByCode(String code);
}
