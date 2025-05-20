package com.utez.edu.sigeabackend.auth.modules;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
    Optional<PasswordResetToken> findTopByUser_EmailOrderByExpiresAtDesc(@NotBlank @Email String email);
}