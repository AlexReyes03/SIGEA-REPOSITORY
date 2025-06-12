package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.SubjectEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.SubjectCreateDto;
import com.utez.edu.sigeabackend.modules.entities.dto.SubjectDTO;
import com.utez.edu.sigeabackend.modules.services.SubjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/subjects")
public class SubjectController {
    private final SubjectService service;

    public SubjectController(SubjectService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SubjectDTO>> getAllSubjects() {
        List<SubjectDTO> subjects = service.findAll();
        return ResponseEntity.ok(subjects);
    }
    @GetMapping("/{id}")
    public ResponseEntity<SubjectDTO>  getById(@PathVariable long id) {
        return service.findById(id);
    }

    @GetMapping("/module/{moduleId}")
    public ResponseEntity<List<SubjectDTO>>  getByModule(@PathVariable long moduleId) {
        return service.findByModuleId(moduleId);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<SubjectDTO>>  getByTeacher(@PathVariable long teacherId) {
        return service.findByTeacherId(teacherId);
    }

    @PostMapping
    public ResponseEntity<SubjectDTO> create(@RequestBody SubjectCreateDto dto) {
        return service.save(dto);
    }
    @PutMapping("/{id}")
    public ResponseEntity<SubjectDTO> update(@PathVariable long id, @RequestBody SubjectCreateDto dto) {
        return service.update(id, dto);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        return service.delete(id);
    }
}
