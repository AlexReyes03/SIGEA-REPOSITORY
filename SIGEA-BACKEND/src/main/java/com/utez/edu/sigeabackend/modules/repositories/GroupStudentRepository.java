package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupStudentRepository extends JpaRepository<GroupStudentEntity, GroupStudentEntity.Id> {
    @EntityGraph(attributePaths = {"student.careerEnrollments"})
    List<GroupStudentEntity> findByGroupId(@NonNull long groupId);
    List<GroupStudentEntity> findByStudentId(@NonNull long studentId);
    boolean existsById(@NonNull GroupStudentEntity.Id id);

    @Query("SELECT COUNT(gs) FROM GroupStudentEntity gs " +
            "JOIN gs.group g " +
            "WHERE gs.student.id = :studentId AND g.career.id = :careerId")
    long countGroupsByStudentAndCareer(@Param("studentId") Long studentId,
                                       @Param("careerId") Long careerId);

    @Query("SELECT COUNT(g) FROM GroupEntity g " +
            "WHERE g.teacher.id = :teacherId AND g.career.id = :careerId")
    long countGroupsByTeacherAndCareer(@Param("teacherId") Long teacherId,
                                       @Param("careerId") Long careerId);

    @Query("SELECT gs FROM GroupStudentEntity gs " +
            "JOIN gs.group g " +
            "WHERE gs.student.id = :studentId AND g.career.id = :careerId")
    List<GroupStudentEntity> findByStudentIdAndCareerId(@Param("studentId") Long studentId,
                                                        @Param("careerId") Long careerId);

    /**
     * Encuentra estudiantes ACTIVOS en un grupo específico
     */
    @Query("SELECT gs FROM GroupStudentEntity gs WHERE gs.group.id = :groupId AND gs.status = 'ACTIVE'")
    List<GroupStudentEntity> findActiveByGroupId(@Param("groupId") long groupId);

    /**
     * Encuentra todas las inscripciones (activas e inactivas) de un estudiante
     */
    @Query("SELECT gs FROM GroupStudentEntity gs WHERE gs.student.id = :studentId ORDER BY gs.entryDate DESC")
    List<GroupStudentEntity> findAllByStudentId(@Param("studentId") long studentId);

    /**
     * Encuentra solo las inscripciones ACTIVAS de un estudiante
     */
    @Query("SELECT gs FROM GroupStudentEntity gs WHERE gs.student.id = :studentId AND gs.status = 'ACTIVE'")
    List<GroupStudentEntity> findActiveByStudentId(@Param("studentId") long studentId);

    /**
     * Verifica si un estudiante está actualmente activo en un grupo
     */
    @Query("SELECT COUNT(gs) > 0 FROM GroupStudentEntity gs WHERE gs.student.id = :studentId AND gs.group.id = :groupId AND gs.status = 'ACTIVE'")
    boolean isStudentActiveInGroup(@Param("studentId") long studentId, @Param("groupId") long groupId);

    /**
     * Encuentra todos los estudiantes activos con información completa
     */
    @Query("SELECT gs FROM GroupStudentEntity gs " +
            "JOIN FETCH gs.student s " +
            "JOIN FETCH gs.group g " +
            "WHERE gs.status = 'ACTIVE'")
    List<GroupStudentEntity> findAllActiveWithDetails();
}
