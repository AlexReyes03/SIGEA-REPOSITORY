package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;

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

    @Query("SELECT gs FROM GroupStudentEntity gs " +
            "JOIN gs.group g " +
            "WHERE gs.student.id = :studentId AND g.career.id = :careerId")
    List<GroupStudentEntity> findByStudentIdAndCareerId(@Param("studentId") Long studentId,
                                                        @Param("careerId") Long careerId);
}
