package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.dto.academics.*;
import com.utez.edu.sigeabackend.modules.services.UserCareerEnrollmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/enrollments")
public class UserCareerEnrollmentController {

    private final UserCareerEnrollmentService service;

    public UserCareerEnrollmentController(UserCareerEnrollmentService service) {
        this.service = service;
    }

    /** GET /sigea/api/enrollments - Obtener todas las inscripciones */
    @GetMapping
    public ResponseEntity<List<UserCareerEnrollmentDto>> getAllEnrollments() {
        return service.findAll();
    }

    /** GET /sigea/api/enrollments/user/{userId} - Obtener inscripciones de un usuario */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserCareerEnrollmentDto>> getEnrollmentsByUser(@PathVariable Long userId) {
        return service.findByUserId(userId);
    }

    @GetMapping("/teachers/career/{careerId}")
    public ResponseEntity<List<TeacherByCareerzDto>> getTeachersByCareer(@PathVariable Long careerId) {
        try {
            List<TeacherByCareerzDto> teachers = service.getTeachersByCareer(careerId);
            return ResponseEntity.ok(teachers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /** GET /sigea/api/enrollments/career/{careerId} - Obtener inscripciones de una carrera */
    @GetMapping("/career/{careerId}")
    public ResponseEntity<List<UserCareerEnrollmentDto>> getEnrollmentsByCareer(@PathVariable Long careerId) {
        return service.findByCareerId(careerId);
    }

    /** GET /sigea/api/enrollments/career/{careerId}/active - Obtener inscripciones activas de una carrera */
    @GetMapping("/career/{careerId}/active")
    public ResponseEntity<List<UserCareerEnrollmentDto>> getActiveEnrollmentsByCareer(@PathVariable Long careerId) {
        return service.findActiveByCareer(careerId);
    }

    @GetMapping("/students/career/{careerId}")
    public ResponseEntity<List<UserCareerEnrollmentDto>> getStudentsByCareer(@PathVariable Long careerId) {
        try {
            List<UserCareerEnrollmentDto> students = service.getStudentsByCareer(careerId);
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /** POST /sigea/api/enrollments - Crear nueva inscripción */
    @PostMapping
    public ResponseEntity<UserCareerEnrollmentDto> createEnrollment(@Valid @RequestBody CreateEnrollmentDto dto) {
        return service.createEnrollment(dto);
    }

    /** PUT /sigea/api/enrollments/{enrollmentId} - Actualizar inscripción */
    @PutMapping("/{enrollmentId}")
    public ResponseEntity<UserCareerEnrollmentDto> updateEnrollment(
            @PathVariable Long enrollmentId,
            @Valid @RequestBody UpdateEnrollmentDto dto) {
        return service.updateEnrollment(enrollmentId, dto);
    }

    @PatchMapping("/{enrollmentId}/registration-number")
    public ResponseEntity<UserCareerEnrollmentDto> updateRegistrationNumber(
            @PathVariable Long enrollmentId,
            @RequestBody UpdateRegistrationNumberRequest request) {
        try {
            UserCareerEnrollmentDto updated = service.updateRegistrationNumber(
                    enrollmentId,
                    request.newRegistrationNumber()
            );
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }


    /** PATCH /sigea/api/enrollments/{enrollmentId}/complete - Marcar inscripción como completada */
    @PatchMapping("/{enrollmentId}/complete")
    public ResponseEntity<UserCareerEnrollmentDto> completeEnrollment(@PathVariable Long enrollmentId) {
        return service.completeEnrollment(enrollmentId);
    }

    /** PATCH /sigea/api/enrollments/{enrollmentId}/deactivate - Desactivar inscripción */
    @PatchMapping("/{enrollmentId}/deactivate")
    public ResponseEntity<UserCareerEnrollmentDto> deactivateEnrollment(@PathVariable Long enrollmentId) {
        return service.deactivateEnrollment(enrollmentId);
    }

    /** PATCH /sigea/api/enrollments/{enrollmentId}/reactivate - Reactivar inscripción */
    @PatchMapping("/{enrollmentId}/reactivate")
    public ResponseEntity<UserCareerEnrollmentDto> reactivateEnrollment(@PathVariable Long enrollmentId) {
        return service.reactivateEnrollment(enrollmentId);
    }

    /** DELETE /sigea/api/enrollments/{enrollmentId} - Eliminar inscripción */
    @DeleteMapping("/{enrollmentId}")
    public ResponseEntity<Void> deleteEnrollment(@PathVariable Long enrollmentId) {
        return service.deleteEnrollment(enrollmentId);
    }

    /** GET /sigea/api/enrollments/generate-number/{careerId} - Generar nueva matrícula para una carrera */
    @GetMapping("/generate-number/{careerId}")
    public ResponseEntity<String> generateRegistrationNumber(@PathVariable Long careerId) {
        return service.generateNewRegistrationNumber(careerId);
    }
}