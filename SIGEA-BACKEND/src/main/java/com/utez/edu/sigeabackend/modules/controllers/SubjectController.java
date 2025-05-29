package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.SubjectEntity;
import com.utez.edu.sigeabackend.modules.services.SubjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sigea/api/subjects")
public class SubjectController {
    private final SubjectService service;

    public SubjectController(SubjectService service) {
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

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<?> getByModule(@PathVariable long moduleId) {
        return service.findByModuleId(moduleId);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> getByTeacher(@PathVariable Long teacherId) {
        return service.findByTeacherId(teacherId);
    }

    @PostMapping("/module/{moduleId}/teacher/{teacherId}")
    public ResponseEntity<?> create(@RequestBody SubjectEntity subject, @PathVariable long moduleId, @PathVariable long teacherId) {
        return service.create(subject, moduleId, teacherId);
    }

    @PutMapping("/{id}/module/{moduleId}/teacher/{teacherId}")
    public ResponseEntity<?> update(
            @PathVariable long id,
            @RequestBody SubjectEntity subject,
            @PathVariable long moduleId,
            @PathVariable long teacherId) {
        return service.update(id, subject, moduleId, teacherId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id) {
        return service.delete(id);
    }
}
