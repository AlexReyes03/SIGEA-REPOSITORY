package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.CampusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampusRepository extends JpaRepository<CampusEntity, Long> {
    boolean existsByName(String name);

    /**
     * Encuentra un campus por su id
     */
    CampusEntity findById(long id);

    /**
     * Encuentra todos los campus que un supervisor puede supervisar
     * (su campus principal + campus asignados adicionales)
     */
    @Query("SELECT DISTINCT c FROM CampusEntity c " +
            "LEFT JOIN UserCampusSupervisionEntity ucs ON c.id = ucs.campus.id " +
            "WHERE c.id = :userCampusId OR ucs.user.id = :userId")
    List<CampusEntity> findAllSupervisedByUser(@Param("userId") Long userId, @Param("userCampusId") Long userCampusId);

    //Busca el campus asociado a un estudiante específico a través de su enrollment activo
    @Query("SELECT c FROM CampusEntity c " +
            "JOIN UserCareerEnrollmentEntity e ON e.campus.id = c.id " +
            "WHERE e.user.id = :studentId " +
            "AND e.status = 'ACTIVE'")
    Optional<CampusEntity> findCampusByStudentId(@Param("studentId") Long studentId);
}