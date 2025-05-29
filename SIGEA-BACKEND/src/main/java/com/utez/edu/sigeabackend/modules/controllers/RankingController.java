package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.RankingEntity;
import com.utez.edu.sigeabackend.modules.services.RankingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sigea/api/rankings")
public class RankingController {
    private final RankingService service;

    public RankingController(RankingService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable long id) {
        return service.findById(id);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> findByTeacher(@PathVariable long teacherId) {
        return service.findByTeacher(teacherId);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody RankingEntity ranking,
                                    @RequestParam long teacherId,
                                    @RequestParam long studentId) {
        return service.create(ranking, teacherId, studentId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable long id, @RequestBody RankingEntity ranking) {
        return service.update(id, ranking);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id) {
        return service.delete(id);
    }
}
