package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.UserCampusSupervisionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCampusSupervisionRepository extends JpaRepository<UserCampusSupervisionEntity, Long> {

    /**
     * Encuentra todas las asignaciones de supervisión de un usuario
     */
    @Query("SELECT ucs FROM UserCampusSupervisionEntity ucs " +
            "JOIN FETCH ucs.campus " +
            "WHERE ucs.user.id = :userId")
    List<UserCampusSupervisionEntity> findByUserIdWithCampus(@Param("userId") Long userId);

    /**
     * Encuentra todos los supervisores asignados a un campus
     */
    @Query("SELECT ucs FROM UserCampusSupervisionEntity ucs " +
            "JOIN FETCH ucs.user " +
            "WHERE ucs.campus.id = :campusId")
    List<UserCampusSupervisionEntity> findByCampusIdWithUser(@Param("campusId") Long campusId);

    /**
     * Verifica si existe una asignación específica
     */
    boolean existsByUserIdAndCampusId(Long userId, Long campusId);

    /**
     * Encuentra una asignación específica
     */
    Optional<UserCampusSupervisionEntity> findByUserIdAndCampusId(Long userId, Long campusId);

    /**
     * Elimina una asignación específica
     */
    void deleteByUserIdAndCampusId(Long userId, Long campusId);

    /**
     * Encuentra todas las asignaciones de un tipo específico para un usuario
     */
    @Query("SELECT ucs FROM UserCampusSupervisionEntity ucs " +
            "WHERE ucs.user.id = :userId AND ucs.supervisionType = :supervisionType")
    List<UserCampusSupervisionEntity> findByUserIdAndSupervisionType(
            @Param("userId") Long userId,
            @Param("supervisionType") UserCampusSupervisionEntity.SupervisionType supervisionType
    );
}