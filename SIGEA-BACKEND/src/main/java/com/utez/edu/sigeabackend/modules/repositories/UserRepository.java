package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    @EntityGraph(attributePaths = {"role"})
    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    @Query("SELECT u FROM UserEntity u WHERE u.role.id = :roleId")
    List<UserEntity> findByRoleId(@Param("roleId") Long roleId);

    @Query("SELECT u FROM UserEntity u WHERE u.role.id = :roleId AND u.campus.id = :campusId")
    List<UserEntity> findByRoleIdAndCampusId(@Param("roleId") Long roleId, @Param("campusId") Long campusId);

    // Encontrar usuarios con sus inscripciones activas
    @EntityGraph(attributePaths = {"careerEnrollments", "careerEnrollments.career"})
    @Query("SELECT DISTINCT u FROM UserEntity u " +
            "LEFT JOIN FETCH u.careerEnrollments e " +
            "WHERE u.id = :userId")
    Optional<UserEntity> findByIdWithEnrollments(@Param("userId") Long userId);

    // Encontrar usuarios por carrera
    @Query("SELECT DISTINCT u FROM UserEntity u " +
            "JOIN u.careerEnrollments e " +
            "WHERE e.career.id = :careerId AND e.status = 'ACTIVE'")
    List<UserEntity> findByActiveCareerEnrollment(@Param("careerId") Long careerId);

    // Nuevas consultas para supervisión de campus

    /**
     * Encuentra supervisores con sus asignaciones de campus
     */
    @EntityGraph(attributePaths = {"campusSupervisions", "campusSupervisions.campus"})
    @Query("SELECT u FROM UserEntity u " +
            "WHERE u.role.roleName = 'SUPERVISOR' AND u.id = :supervisorId")
    Optional<UserEntity> findSupervisorWithCampusSupervisions(@Param("supervisorId") Long supervisorId);

    /**
     * Encuentra todos los supervisores de un campus específico
     */
    @Query("SELECT DISTINCT u FROM UserEntity u " +
            "LEFT JOIN u.campusSupervisions cs " +
            "WHERE u.campus.id = :campusId OR cs.campus.id = :campusId")
    List<UserEntity> findSupervisorsByCampusId(@Param("campusId") Long campusId);
}