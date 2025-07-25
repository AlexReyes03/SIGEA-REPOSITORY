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
    public ResponseEntity<?> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable long id) {
        return service.findById(id);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> getByTeacher(@PathVariable long teacherId) {
        return service.findByTeacher(teacherId);
    }

    /**
     * Check if student has evaluated a specific teacher
     * GET /sigea/api/rankings/student/{studentId}/teacher/{teacherId}
     */
    @GetMapping("/student/{studentId}/teacher/{teacherId}/module/{moduleId}")
    public ResponseEntity<?> checkStudentTeacherEvaluation(
            @PathVariable Long studentId,
            @PathVariable Long teacherId, @PathVariable Long moduleId) {
        return service.checkStudentTeacherEvaluation(studentId, teacherId, moduleId);
    }

    @GetMapping("/student/{studentId}/modules")
    public ResponseEntity<?> getStudentEvaluationModules(@PathVariable Long studentId) {
        return service.getStudentEvaluationModules(studentId);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentEvaluations(@PathVariable Long studentId) {
        return service.findByStudent(studentId);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody RankingEntity ranking) {
        return service.create(ranking);
    }
}