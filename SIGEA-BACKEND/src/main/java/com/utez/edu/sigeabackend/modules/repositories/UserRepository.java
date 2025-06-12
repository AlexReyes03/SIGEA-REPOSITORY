package com.utez.edu.sigeabackend.modules.repositories;


import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.UserResponseDto;
import org.apache.catalina.LifecycleState;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    @EntityGraph(attributePaths = {"role"})
    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRegistrationNumber(String registrationNumber);

    // Consulta por ID de rol Query
    @Query("SELECT u FROM UserEntity u WHERE u.role.id = :roleId")
    List<UserEntity> findByRoleId(@Param("roleId") Long roleId);
}