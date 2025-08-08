package com.utez.edu.sigeabackend.modules.media;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MediaRepository extends JpaRepository<MediaEntity, Long> {
    Optional<MediaEntity> findByCode(String code);
}
