package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.PlantelEntity;
import com.utez.edu.sigeabackend.modules.repositories.CareerRepository;
import com.utez.edu.sigeabackend.modules.repositories.PlantelRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CareerService {
    private final CareerRepository repository;
    private final PlantelRepository plantelRepository;
    private final CustomResponseEntity responseService;

    public CareerService(CareerRepository repository, PlantelRepository plantelRepository, CustomResponseEntity responseService) {
        this.repository = repository;
        this.plantelRepository = plantelRepository;
        this.responseService = responseService;
    }

    public ResponseEntity<?> findAll() {
        List<CareerEntity> careers = repository.findAll();
        if (careers.isEmpty()) {
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Lista de carreras", careers);
    }

    public ResponseEntity<?> findById(long id) {
        CareerEntity career = repository.findById(id).orElse(null);
        if (career != null) {
            return responseService.getOkResponse("Carrera encontrada", career);
        } else {
            return responseService.get404Response();
        }
    }


    public ResponseEntity<?> save(CareerEntity career, long plantelId) {
        PlantelEntity plantel = plantelRepository.findById(plantelId)
                .orElse(null);
        if (plantel == null) {
            return responseService.get404Response();
        }
        career.setPlantel(plantel);
        repository.save(career);
        return responseService.get201Response("Carrera registrada correctamente");
    }

    public ResponseEntity<?> update(long id, CareerEntity career, long plantelId) {
        var optional = repository.findById(id);
        if (optional.isPresent()) {
            CareerEntity existing = optional.get();
            existing.setName(career.getName());

            PlantelEntity plantel = plantelRepository.findById(plantelId)
                    .orElse(null);
            if (plantel == null) {
                return responseService.get404Response();
            }
            existing.setPlantel(plantel);

            repository.save(existing);
            return responseService.getOkResponse("Carrera actualizada", existing);
        } else {
            return responseService.get404Response();
        }
    }

    public ResponseEntity<?> delete(long id) {
        var optional = repository.findById(id);
        if (optional.isPresent()) {
            repository.deleteById(id);
            return responseService.getOkResponse("Carrera eliminada", null);
        } else {
            return responseService.get404Response();
        }
    }
}
