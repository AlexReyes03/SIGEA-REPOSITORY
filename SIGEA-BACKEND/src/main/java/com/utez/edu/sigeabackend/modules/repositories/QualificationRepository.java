package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.QualificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QualificationRepository extends JpaRepository<QualificationEntity, Long> {
    List<QualificationEntity> findByStudentId(long studentId);
    List<QualificationEntity> findBySubjectId(long subjectId);
    List<QualificationEntity> findByGroupId(long groupId);

    /**
     * Encuentra todas las calificaciones de un estudiante en un grupo específico
     */
    @Query("SELECT q FROM QualificationEntity q WHERE q.student.id = :studentId AND q.group.id = :groupId")
    List<QualificationEntity> findByStudentIdAndGroupId(@Param("studentId") Long studentId, @Param("groupId") Long groupId);

    /**
     * Verifica si existe una calificación específica para un estudiante en un grupo y materia
     */
    @Query("SELECT COUNT(q) > 0 FROM QualificationEntity q WHERE q.student.id = :studentId AND q.group.id = :groupId AND q.subject.id = :subjectId")
    boolean existsByStudentIdAndGroupIdAndSubjectId(@Param("studentId") Long studentId, @Param("groupId") Long groupId, @Param("subjectId") Long subjectId);
}