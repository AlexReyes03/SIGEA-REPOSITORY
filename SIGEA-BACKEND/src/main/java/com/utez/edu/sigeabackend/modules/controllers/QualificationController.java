package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.dto.academics.QualificationDto;
import com.utez.edu.sigeabackend.modules.services.QualificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/qualifications")
public class QualificationController {
    private final QualificationService service;

    public QualificationController(QualificationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<QualificationDto>> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<QualificationDto> findById(@PathVariable long id) {
        return service.findById(id);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<QualificationDto>> findByStudent(@PathVariable long studentId) {
        return service.findByStudent(studentId);
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<QualificationDto>> findBySubject(@PathVariable long subjectId) {
        return service.findBySubject(subjectId);
    }

    @PostMapping
    public ResponseEntity<QualificationDto> save(@RequestBody QualificationDto dto) {
        return service.save(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<QualificationDto> update(@PathVariable long id, @RequestBody QualificationDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        return service.delete(id);
    }
}
