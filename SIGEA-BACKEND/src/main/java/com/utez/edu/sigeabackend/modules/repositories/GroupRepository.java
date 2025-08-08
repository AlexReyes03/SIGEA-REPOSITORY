package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.GroupEntity;
import com.utez.edu.sigeabackend.modules.entities.GroupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<GroupEntity, Long> {

    // Grupos asignados a un docente
    List<GroupEntity> findByTeacherId(long teacher_id);

    // Grupos asignados a un docente con estado específico
    List<GroupEntity> findByTeacherIdAndStatus(long teacher_id, GroupStatus status);

    // Grupos por carrera
    List<GroupEntity> findByCareerId(long career_id);

    // Grupos por carrera con estado específico
    List<GroupEntity> findByCareerIdAndStatus(long career_id, GroupStatus status);

    // Grupos donde un estudiante está inscrito
    @Query("SELECT g FROM GroupEntity g JOIN g.students gs WHERE gs.student.id = :student_id")
    List<GroupEntity> findByStudent(@Param("student_id") Integer student_id);

    // Grupos activos donde un estudiante está inscrito
    @Query("SELECT g FROM GroupEntity g JOIN g.students gs WHERE gs.student.id = :student_id AND g.status = :status")
    List<GroupEntity> findByStudentAndStatus(@Param("student_id") Integer student_id, @Param("status") GroupStatus status);

    // Buscar grupos por estado
    List<GroupEntity> findByStatus(GroupStatus status);
}