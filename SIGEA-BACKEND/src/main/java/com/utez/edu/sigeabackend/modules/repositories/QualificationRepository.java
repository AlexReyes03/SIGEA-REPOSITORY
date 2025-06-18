package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.QualificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QualificationRepository extends JpaRepository<QualificationEntity, Long> {
    List<QualificationEntity> findByStudentId(long studentId);
    List<QualificationEntity> findBySubjectId(long subjectId);
    List<QualificationEntity> findByGroupId(long groupId);
}
