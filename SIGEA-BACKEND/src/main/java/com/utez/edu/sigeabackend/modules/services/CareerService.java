package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.PlantelEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CareerDto;
import com.utez.edu.sigeabackend.modules.repositories.CareerRepository;
import com.utez.edu.sigeabackend.modules.repositories.PlantelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CareerService {
    private final CareerRepository repository;
    private final PlantelRepository plantelRepository;

    public CareerService(CareerRepository repository, PlantelRepository plantelRepository) {
        this.repository = repository;
        this.plantelRepository = plantelRepository;
    }

    private CareerDto toDto(CareerEntity entity) {
        int groupsCount = entity.getGroups() != null ? entity.getGroups().size() : 0;
        return new CareerDto(entity.getId(), entity.getName(), groupsCount);
    }

    @Transactional
    public ResponseEntity<List<CareerDto>> findAll() {
        List<CareerDto> dtos = repository.findAll().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @Transactional
    public ResponseEntity<CareerDto> findById(long id) {
        return repository.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Transactional
    public ResponseEntity<List<CareerDto>> findByCampus(long plantelId) {
        List<CareerDto> dtos = repository.findAllWithGroupCountByPlantel(plantelId);
        return ResponseEntity.ok(dtos);
    }

    public ResponseEntity<CareerEntity> save(CareerEntity career, long plantelId) {
        PlantelEntity plantel = plantelRepository.findById(plantelId).orElse(null);
        if (plantel == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        career.setPlantel(plantel);
        CareerEntity saved = repository.save(career);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    public ResponseEntity<CareerEntity> update(long id, CareerEntity career, long plantelId) {
        var optional = repository.findById(id);
        if (optional.isPresent()) {
            CareerEntity existing = optional.get();
            existing.setName(career.getName());
            PlantelEntity plantel = plantelRepository.findById(plantelId).orElse(null);
            if (plantel == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }
            existing.setPlantel(plantel);
            CareerEntity updated = repository.save(existing);
            return ResponseEntity.ok(updated);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    public ResponseEntity<Void> delete(long id) {
        var optional = repository.findById(id);
        if (optional.isPresent()) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
