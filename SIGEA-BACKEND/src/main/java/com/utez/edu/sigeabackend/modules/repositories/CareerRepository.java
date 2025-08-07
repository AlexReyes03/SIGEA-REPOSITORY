package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CareerRepository extends JpaRepository<CareerEntity, Long> {

    // Verificar si existe un diferenciador en un campus específico
    boolean existsByDifferentiatorAndCampusId(String differentiator, Long campusId);

    // Encontrar carreras por campus
    List<CareerEntity> findByCampusId(Long campusId);

    // Encontrar carrera por diferenciador y campus
    Optional<CareerEntity> findByDifferentiatorAndCampusId(String differentiator, Long campusId);
}