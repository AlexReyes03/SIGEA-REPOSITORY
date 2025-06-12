package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.CurriculumEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CurriculumRepository extends JpaRepository<CurriculumEntity, Long> {
    List<CurriculumEntity> findByCareer_Id(Long careerId);
}
