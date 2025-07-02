package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.dto.academics.CareerDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CreateCareerDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.UpdateCareerDto;
import com.utez.edu.sigeabackend.modules.services.CareerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/careers")
public class CareerController {
    private final CareerService service;

    public CareerController(CareerService service) {
        this.service = service;
    }

    /** GET /sigea/api/careers - Obtener todas las carreras */
    @GetMapping
    public ResponseEntity<List<CareerDto>> findAll() {
        return service.findAll();
    }

    /** GET /sigea/api/careers/{id} - Obtener carrera por ID */
    @GetMapping("/{id}")
    public ResponseEntity<CareerDto> findById(@PathVariable long id) {
        return service.findById(id);
    }

    /** GET /sigea/api/careers/plantel/{campusId} - Obtener carreras por plantel */
    @GetMapping("/campus/{campusId}")
    public ResponseEntity<List<CareerDto>> findByCampus(@PathVariable long campusId) {
        return service.findByCampus(campusId);
    }

    /** POST /sigea/api/careers - Crear nueva carrera */
    @PostMapping
    public ResponseEntity<CareerDto> save(@Valid @RequestBody CreateCareerDto dto) {
        return service.save(dto);
    }

    /** PUT /sigea/api/careers/{id} - Actualizar carrera */
    @PutMapping("/{id}")
    public ResponseEntity<CareerDto> update(
            @PathVariable long id,
            @Valid @RequestBody UpdateCareerDto dto) {
        return service.update(id, dto);
    }

    /** DELETE /sigea/api/careers/{id} - Eliminar carrera */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        return service.delete(id);
    }
}