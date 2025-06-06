package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.services.CareerService;
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
    /** GET   /sigea/api/careers */
    @GetMapping
    public ResponseEntity<?> findAll() {
        return service.findAll();
    }
    /** GET   /sigea/api/careers/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable long id) {
        return service.findById(id);
    }

    /** GET   /sigea/api/careers/{plantelId} */
    @GetMapping("/careers/{plantelId}")
    public ResponseEntity<List<CareerEntity>> findByCampus(@PathVariable long plantelId) {
        return service.findByCampus(plantelId);
    }
    /** POST   /sigea/api/careers*/
    @PostMapping
    public ResponseEntity<?> save(@RequestBody CareerEntity career, @RequestParam long plantelId) {
        return service.save(career, plantelId);
    }

    /** PUT   /sigea/api/careers/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable long id, @RequestBody CareerEntity career, @RequestParam long plantelId) {
        return service.update(id, career, plantelId);
    }
    /** DELETE   /sigea/api/careers/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id) {
        return service.delete(id);
    }
}
