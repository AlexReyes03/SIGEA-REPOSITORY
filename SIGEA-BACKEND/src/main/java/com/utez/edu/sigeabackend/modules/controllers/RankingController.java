package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.RankingEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.RankingRequestDtos.*;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CampusStatsDtos.CampusRankingStatsDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.RankingRequestDtos.CampusRankingStatsRequestDto;
import com.utez.edu.sigeabackend.modules.services.RankingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sigea/api/rankings")
public class RankingController {
    private final RankingService service;

    public RankingController(RankingService service) {
        this.service = service;
    }

    /** GET /sigea/api/rankings - Obtener todos los rankings */
    @GetMapping
    public ResponseEntity<?> getAll() {
        return service.findAll();
    }

    /** GET /sigea/api/rankings/{id} - Obtener ranking por ID */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable long id) {
        return service.findById(id);
    }

    /** POST /sigea/api/rankings/teacher - Obtener rankings por docente */
    @PostMapping("/teacher")
    public ResponseEntity<?> getByTeacher(@Valid @RequestBody TeacherRankingsRequestDto request) {
        return service.findByTeacher(request.teacherId());
    }

    /** POST /sigea/api/rankings/check-evaluation - Verificar si estudiante evaluó a docente en módulo específico */
    @PostMapping("/check-evaluation")
    public ResponseEntity<?> checkStudentTeacherEvaluation(@Valid @RequestBody CheckEvaluationRequestDto request) {
        return service.checkStudentTeacherEvaluation(
                request.studentId(),
                request.teacherId(),
                request.moduleId()
        );
    }

    /** POST /sigea/api/rankings/student/modules - Obtener módulos de evaluación de estudiante */
    @PostMapping("/student/modules")
    public ResponseEntity<?> getStudentEvaluationModules(@Valid @RequestBody StudentEvaluationModulesRequestDto request) {
        return service.getStudentEvaluationModules(request.studentId());
    }

    /** POST /sigea/api/rankings/student - Obtener evaluaciones de estudiante */
    @PostMapping("/student")
    public ResponseEntity<?> getStudentEvaluations(@Valid @RequestBody StudentRankingsRequestDto request) {
        return service.findByStudent(request.studentId());
    }

    /** POST /sigea/api/rankings/campus/ranking-stats - Obtener estadísticas de rankings por campus */
    @PostMapping("/campus/ranking-stats")
    public ResponseEntity<CampusRankingStatsDto> getCampusRankingStats(@Valid @RequestBody CampusRankingStatsRequestDto request) {
        return service.getCampusRankingStats(request.campusId());
    }

    /** POST /sigea/api/rankings - Crear nuevo ranking */
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody RankingEntity ranking) {
        return service.create(ranking);
    }
}