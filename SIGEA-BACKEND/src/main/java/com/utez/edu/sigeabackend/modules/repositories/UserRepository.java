package com.utez.edu.sigeabackend.modules.repositories;


import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRegistrationNumber(String registrationNumber);
}