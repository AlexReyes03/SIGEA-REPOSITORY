package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.QualificationEntity;
import com.utez.edu.sigeabackend.modules.services.QualificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sigea/api/qualifications")
public class QualificationController {
    private final QualificationService service;

    public QualificationController(QualificationService service) {
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

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> findByStudent(@PathVariable long studentId) {
        return service.findByStudent(studentId);
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<?> findBySubject(@PathVariable long subjectId) {
        return service.findBySubject(subjectId);
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody QualificationEntity qualification,
                                  @RequestParam long subjectId,
                                  @RequestParam long studentId) {
        return service.save(qualification, subjectId, studentId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable long id, @RequestBody QualificationEntity qualification) {
        return service.update(id, qualification);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id) {
        return service.delete(id);
    }
}
