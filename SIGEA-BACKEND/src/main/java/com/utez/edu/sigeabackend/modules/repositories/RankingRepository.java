package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.RankingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RankingRepository extends JpaRepository<RankingEntity, Long> {

    /**
     * Busca todos los rankings de un docente específico
     */
    List<RankingEntity> findByTeacher_Id(long teacherId);

    /**
     * Verifica si ya existe una calificación de un estudiante hacia un docente específico
     */
    boolean existsByStudent_IdAndTeacher_Id(long studentId, long teacherId);

    /**
     * Obtiene todos los rankings con información completa del estudiante y docente
     */
    @Query("SELECT r FROM RankingEntity r " +
            "JOIN FETCH r.student s " +
            "JOIN FETCH s.campus " +
            "JOIN FETCH r.teacher t")
    List<RankingEntity> findAllWithDetails();

    /**
     * Obtiene rankings de un docente con información completa del estudiante
     */
    @Query("SELECT r FROM RankingEntity r " +
            "JOIN FETCH r.student s " +
            "JOIN FETCH s.campus " +
            "WHERE r.teacher.id = :teacherId")
    List<RankingEntity> findByTeacher_IdWithDetails(@Param("teacherId") long teacherId);

    //Find ranking by student, teacher and module
    Optional<RankingEntity> findByStudent_IdAndTeacher_IdAndModuleId(Long studentId, Long teacherId, Long moduleId);

    /**
     * Find all rankings by student with details
     */
    @Query("SELECT r FROM RankingEntity r " +
            "JOIN FETCH r.student s " +
            "JOIN FETCH r.teacher t " +
            "JOIN FETCH s.campus " +
            "LEFT JOIN FETCH s.avatar " +
            "WHERE s.id = :studentId")
    List<RankingEntity> findByStudent_IdWithDetails(@Param("studentId") Long studentId);

}