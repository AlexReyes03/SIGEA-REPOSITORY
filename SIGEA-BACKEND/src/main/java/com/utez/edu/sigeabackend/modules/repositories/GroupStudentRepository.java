package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupStudentRepository extends JpaRepository<GroupStudentEntity, GroupStudentEntity.Id> {
    List<GroupStudentEntity> findByGroupId(long groupId);
    List<GroupStudentEntity> findByStudentId(long studentId);
    boolean existsById(GroupStudentEntity.Id id);
}
