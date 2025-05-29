package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.services.ModuleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sigea/api/modules")
public class ModuleController {
    private final ModuleService service;

    public ModuleController(ModuleService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable long id) {
        return service.findById(id);
    }

    @GetMapping("/career/{careerId}")
    public ResponseEntity<?> getByCareer(@PathVariable long careerId) {
        return service.findByCareerId(careerId);
    }

    @PostMapping("/{careerId}")
    public ResponseEntity<?> create(@RequestBody ModuleEntity module, @PathVariable Long careerId) {
        return service.create(module, careerId);
    }

    @PutMapping("/{id}/career/{careerId}")
    public ResponseEntity<?> update(@PathVariable long id, @RequestBody ModuleEntity module, @PathVariable Long careerId) {
        return service.update(id, module, careerId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id) {
        return service.delete(id);
    }

}
