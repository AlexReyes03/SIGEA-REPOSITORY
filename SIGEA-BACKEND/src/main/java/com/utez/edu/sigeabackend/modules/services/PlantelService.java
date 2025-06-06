package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.PlantelEntity;
import com.utez.edu.sigeabackend.modules.repositories.PlantelRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PlantelService {
    private final PlantelRepository repository;
    private final CustomResponseEntity responseService;

    public PlantelService(PlantelRepository repository, CustomResponseEntity responseService) {
        this.repository = repository;
        this.responseService = responseService;
    }

    public ResponseEntity<?> findAll() {
        List<PlantelEntity> list = repository.findAll();
        if (list.isEmpty()) {
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Lista de planteles", list);
    }

    public ResponseEntity<?> findById(long id) {
        Optional<PlantelEntity> plantel = repository.findById(id);
        if (plantel.isPresent()) {
            return responseService.getOkResponse("Plantel encontrado", plantel.get());
        } else {
            return responseService.get404Response();
        }
    }


    public ResponseEntity<?> create(PlantelEntity plantel) {
        if (repository.existsByName(plantel.getName())) {
            return responseService.get400Response();
        }
        repository.save(plantel);
        return ResponseEntity.ok(HttpStatus.CREATED);
    }

    public ResponseEntity<?> update(long id, PlantelEntity plantel) {
        Optional<PlantelEntity> optionalPlantel = repository.findById(id);
        if (optionalPlantel.isPresent()) {
            PlantelEntity existing = optionalPlantel.get();
            existing.setName(plantel.getName());
            repository.save(existing);
            return ResponseEntity.ok(existing);
        } else {
            return responseService.get404Response();
        }
    }

    public ResponseEntity<?> delete(long id) {
        if (!repository.existsById(id)) {
            return responseService.get404Response();
        }
        repository.deleteById(id);
        return responseService.getOkResponse("Plantel eliminado", null);
    }
}
