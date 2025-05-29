package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.PlantelEntity;
import com.utez.edu.sigeabackend.modules.services.PlantelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sigea/api/planteles")
public class PlantelController {

    private final PlantelService plantelService;

    public PlantelController(PlantelService plantelService) {
        this.plantelService = plantelService;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return plantelService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable long id) {
        return plantelService.findById(id);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PlantelEntity plantel) {
        return plantelService.create(plantel);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable long id, @RequestBody PlantelEntity plantel) {
        return plantelService.update(id, plantel);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id) {
        return plantelService.delete(id);
    }
}
