package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CareerDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CareerRepository extends JpaRepository<CareerEntity, Long> {
    List<CareerEntity> findByPlantelId(long plantelId);

    @Query("SELECT new com.utez.edu.sigeabackend.modules.entities.dto.academics.CareerDto(c.id, c.name, SIZE(c.groups)) FROM CareerEntity c WHERE c.plantel.plantelId = :plantelId")
    List<CareerDto> findAllWithGroupCountByPlantel(@Param("plantelId") long plantelId);
}
