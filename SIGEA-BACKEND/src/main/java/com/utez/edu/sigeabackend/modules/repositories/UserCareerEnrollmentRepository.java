package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.UserCareerEnrollmentEntity;
import com.utez.edu.sigeabackend.modules.entities.UserCareerEnrollmentEntity.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCareerEnrollmentRepository extends JpaRepository<UserCareerEnrollmentEntity, Long> {

    // Verificar si ya existe una inscripción entre usuario y carrera
    boolean existsByUserIdAndCareerId(Long userId, Long careerId);

    // Verificar si existe una matrícula en un campus específico
    boolean existsByRegistrationNumberAndCampusId(String registrationNumber, Long campusId);

    // Encontrar todas las inscripciones de un usuario
    List<UserCareerEnrollmentEntity> findByUserId(Long userId);

    // Encontrar todas las inscripciones de una carrera
    List<UserCareerEnrollmentEntity> findByCareerId(Long careerId);

    // Encontrar inscripciones por campus
    List<UserCareerEnrollmentEntity> findByCampusId(Long campusId);

    // Encontrar inscripciones activas de un usuario
    List<UserCareerEnrollmentEntity> findByUserIdAndStatus(Long userId, EnrollmentStatus status);

    // Encontrar inscripciones activas de una carrera
    List<UserCareerEnrollmentEntity> findByCareerIdAndStatus(Long careerId, EnrollmentStatus status);

    // Encontrar una inscripción específica de usuario en carrera
    Optional<UserCareerEnrollmentEntity> findByUserIdAndCareerId(Long userId, Long careerId);

    // Encontrar por matrícula en un campus específico
    Optional<UserCareerEnrollmentEntity> findByRegistrationNumberAndCampusId(String registrationNumber, Long campusId);

    // Contar inscripciones en una carrera por estado
    @Query("SELECT COUNT(e) FROM UserCareerEnrollmentEntity e WHERE e.career.id = :careerId AND e.status = :status")
    long countByCareerIdAndStatus(@Param("careerId") Long careerId, @Param("status") EnrollmentStatus status);

    // Encontrar la última matrícula generada para una carrera en un año específico
    @Query("SELECT e.registrationNumber FROM UserCareerEnrollmentEntity e " +
            "WHERE e.career.id = :careerId " +
            "AND e.registrationNumber LIKE :pattern " +
            "ORDER BY e.registrationNumber DESC")
    List<String> findLastRegistrationNumberByCareerAndPattern(@Param("careerId") Long careerId, @Param("pattern") String pattern);

    // Obtener estudiantes de una carrera con sus datos principales
    @Query("SELECT e FROM UserCareerEnrollmentEntity e " +
            "JOIN FETCH e.user u " +
            "JOIN FETCH e.career c " +
            "WHERE c.id = :careerId AND e.status = :status")
    List<UserCareerEnrollmentEntity> findStudentsByCareerIdAndStatus(@Param("careerId") Long careerId,
                                                                     @Param("status") EnrollmentStatus status);

    default List<UserCareerEnrollmentEntity> findActiveByCareerId(Long careerId) {
        return findByCareerIdAndStatus(careerId, EnrollmentStatus.ACTIVE);
    }
}