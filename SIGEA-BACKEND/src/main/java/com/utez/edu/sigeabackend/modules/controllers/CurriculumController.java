package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.CurriculumEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CurriculumDto;
import com.utez.edu.sigeabackend.modules.services.CurriculumService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/sigea/api/curriculums")
public class CurriculumController {

    private final CurriculumService curriculumService;

    public CurriculumController(CurriculumService curriculumService) {
        this.curriculumService = curriculumService;
    }

    // GET /sigea/api/curriculums/career/{careerId}
    @GetMapping("/career/{careerId}")
    public ResponseEntity<List<CurriculumDto>> findByCareerId(@PathVariable Long careerId) {
        return curriculumService.findByCareerId(careerId);
    }

    // POST /sigea/api/curriculums
    @PostMapping
    public ResponseEntity<CurriculumDto> create(@RequestParam String name, @RequestParam Long careerId) {
        return curriculumService.create(name, careerId);
    }

    // PUT /sigea/api/curriculums/{id}
    @PutMapping("/{id}")
    public ResponseEntity<CurriculumDto> update(@PathVariable Long id, @RequestParam String name) {
        return curriculumService.update(id, name);
    }

    // DELETE /sigea/api/curriculums/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return curriculumService.delete(id);
    }
}