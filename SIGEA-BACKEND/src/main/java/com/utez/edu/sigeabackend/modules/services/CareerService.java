package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.PlantelEntity;
import com.utez.edu.sigeabackend.modules.repositories.CareerRepository;
import com.utez.edu.sigeabackend.modules.repositories.PlantelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CareerService {
    private final CareerRepository repository;
    private final PlantelRepository plantelRepository;

    public CareerService(CareerRepository repository, PlantelRepository plantelRepository) {
        this.repository = repository;
        this.plantelRepository = plantelRepository;
    }

    public ResponseEntity<List<CareerEntity>> findAll() {
        List<CareerEntity> careers = repository.findAll();
        if (careers.isEmpty()) {
            return ResponseEntity.ok(careers);
        }
        return ResponseEntity.ok(careers);
    }

    public ResponseEntity<CareerEntity> findById(long id) {
        CareerEntity career = repository.findById(id).orElse(null);
        if (career != null) {
            return ResponseEntity.ok(career);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    public ResponseEntity<List<CareerEntity>> findByCampus(long plantelId) {
        List<CareerEntity> careers = repository.findByPlantelId(plantelId);
        if (careers.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(careers);
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
