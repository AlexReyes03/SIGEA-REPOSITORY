package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleRepository extends JpaRepository<ModuleEntity, Long> {
    List<ModuleEntity> findByCareerId(long careerId);
}
