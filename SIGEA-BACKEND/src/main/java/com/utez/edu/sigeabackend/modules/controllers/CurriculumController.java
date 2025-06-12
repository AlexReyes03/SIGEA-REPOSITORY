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
    public ResponseEntity<CurriculumDto> create(@RequestBody CurriculumEntity curriculumEntity) {
        try {
            return curriculumService.create(curriculumEntity);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // PUT /sigea/api/curriculums/{id}
    @PutMapping("/{id}")
    public ResponseEntity<CurriculumDto> update(@PathVariable Long id, @RequestBody CurriculumEntity curriculumEntity) {
        try {
            return curriculumService.update(id, curriculumEntity);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // DELETE /sigea/api/curriculums/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        try {
            return curriculumService.delete(id);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}