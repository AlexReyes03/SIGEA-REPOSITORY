package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.modulesDto.ModuleRequestDto;
import com.utez.edu.sigeabackend.modules.entities.dto.modulesDto.ModuleResponseDto;
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
    /** GET   /sigea/api/careers/careerId */
    @GetMapping("/careers/{careerId}")
    public ResponseEntity<?> getByCareer(@PathVariable long careerId) {
        return service.findByCareerId(careerId);
    }
    /** POST   /sigea/api/modules */
    @PostMapping
    public ResponseEntity<ModuleResponseDto> create(@RequestBody ModuleRequestDto dto) {
        return service.create(dto);
    }
    /** PUT   /sigea/api/module/{careerId} */
    @PutMapping("/{id}")
    public ResponseEntity<ModuleResponseDto> update(@PathVariable long id, @RequestBody ModuleRequestDto dto) {
        return service.update(id, dto);
    }
    /** DELETE   /sigea/api/module/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id) {
        return service.delete(id);
    }
}
