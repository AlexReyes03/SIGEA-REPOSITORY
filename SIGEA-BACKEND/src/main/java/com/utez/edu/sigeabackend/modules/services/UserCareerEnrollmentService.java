package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.*;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.*;
import com.utez.edu.sigeabackend.modules.repositories.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserCareerEnrollmentService {

    private final UserCareerEnrollmentRepository enrollmentRepo;
    private final UserRepository userRepo;
    private final CareerRepository careerRepo;
    private final PlantelRepository plantelRepo;
    private final Random random = new Random();

    public UserCareerEnrollmentService(UserCareerEnrollmentRepository enrollmentRepo,
                                       UserRepository userRepo,
                                       CareerRepository careerRepo,
                                       PlantelRepository plantelRepo) {
        this.enrollmentRepo = enrollmentRepo;
        this.userRepo = userRepo;
        this.careerRepo = careerRepo;
        this.plantelRepo = plantelRepo;
    }

    // Helper method to convert entity to DTO
    private UserCareerEnrollmentDto toDto(UserCareerEnrollmentEntity entity) {
        return new UserCareerEnrollmentDto(
                entity.getId(),
                entity.getUser().getId(),
                entity.getUser().getName(),
                entity.getUser().getPaternalSurname(),
                entity.getUser().getMaternalSurname(),
                entity.getUser().getEmail(),
                entity.getUser().getRole().getRoleName(),
                entity.getCareer().getId(),
                entity.getCareer().getName(),
                entity.getCareer().getDifferentiator(),
                entity.getPlantel().getId(),
                entity.getPlantel().getName(),
                entity.getRegistrationNumber(),
                entity.getStatus().name(),
                entity.getEnrolledAt(),
                entity.getCompletedAt(),
                false
        );
    }

    // Generar matrícula automáticamente
    private String generateRegistrationNumber(CareerEntity career, PlantelEntity plantel) {
        String differentiator = career.getDifferentiator();
        String year = String.valueOf(Year.now().getValue()).substring(2); // Últimos 2 dígitos del año
        String pattern = differentiator + year + "%";

        // Obtener la última matrícula generada para este patrón
        List<String> existingNumbers = enrollmentRepo.findLastRegistrationNumberByCareerAndPattern(
                career.getId(), pattern);

        int nextNumber = 1;
        if (!existingNumbers.isEmpty()) {
            String lastNumber = existingNumbers.get(0);
            String numberPart = lastNumber.substring(differentiator.length() + 2); // Quitar diferenciador + año
            try {
                nextNumber = Integer.parseInt(numberPart) + 1;
            } catch (NumberFormatException e) {
                // Si hay error, empezar desde 1
                nextNumber = 1;
            }
        }

        String baseRegistrationNumber;
        String finalRegistrationNumber;
        int attempts = 0;
        final int maxAttempts = 1000;

        do {
            if (attempts < 10) {
                // Primeros 10 intentos: usar número secuencial
                finalRegistrationNumber = String.format("%s%s%04d", differentiator, year, nextNumber + attempts);
            } else {
                // Después de 10 intentos: usar números aleatorios
                int randomNumber = random.nextInt(9999) + 1;
                finalRegistrationNumber = String.format("%s%s%04d", differentiator, year, randomNumber);
            }
            attempts++;
        } while (enrollmentRepo.existsByRegistrationNumberAndPlantelId(finalRegistrationNumber, plantel.getId())
                && attempts < maxAttempts);

        if (attempts >= maxAttempts) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "No se pudo generar una matrícula única después de " + maxAttempts + " intentos");
        }

        return finalRegistrationNumber;
    }

    // Validar matrícula personalizada
    private void validateCustomRegistrationNumber(String registrationNumber, PlantelEntity plantel, Long excludeEnrollmentId) {
        if (registrationNumber == null || registrationNumber.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La matrícula no puede estar vacía");
        }

        if (registrationNumber.length() > 15) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La matrícula no puede exceder 15 caracteres");
        }

        // Verificar unicidad en el plantel (excluyendo la inscripción actual si es una actualización)
        boolean exists = enrollmentRepo.findByRegistrationNumberAndPlantelId(registrationNumber, plantel.getId())
                .map(existing -> !existing.getId().equals(excludeEnrollmentId))
                .orElse(false);

        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un estudiante con esta matrícula en el plantel");
        }
    }

    // Obtener todas las inscripciones
    public ResponseEntity<List<UserCareerEnrollmentDto>> findAll() {
        List<UserCareerEnrollmentDto> dtos = enrollmentRepo.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Obtener inscripciones por usuario
    public ResponseEntity<List<UserCareerEnrollmentDto>> findByUserId(Long userId) {
        List<UserCareerEnrollmentDto> dtos = enrollmentRepo.findByUserId(userId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    public List<TeacherByCareerzDto> getTeachersByCareer(Long careerId) {
        List<UserCareerEnrollmentEntity> enrollments = enrollmentRepo.findActiveByCareerId(careerId);

        return enrollments.stream()
                .filter(enrollment -> "TEACHER".equals(enrollment.getUser().getRole().getRoleName()))
                .map(enrollment -> new TeacherByCareerzDto(
                        enrollment.getUser().getId(),
                        enrollment.getUser().getName(),
                        enrollment.getUser().getPaternalSurname(),
                        enrollment.getUser().getMaternalSurname(),
                        enrollment.getUser().getEmail(),
                        enrollment.getUser().getRole().getRoleName(),
                        enrollment.getRegistrationNumber(),
                        enrollment.getCareer().getId(),
                        enrollment.getCareer().getName()
                ))
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserCareerEnrollmentDto> getStudentsByCareer(Long careerId) {
        List<UserCareerEnrollmentEntity> enrollments = enrollmentRepo.findActiveByCareerId(careerId);

        return enrollments.stream()
                .filter(enrollment -> "STUDENT".equals(enrollment.getUser().getRole().getRoleName()))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // Obtener inscripciones por carrera
    public ResponseEntity<List<UserCareerEnrollmentDto>> findByCareerId(Long careerId) {
        List<UserCareerEnrollmentDto> dtos = enrollmentRepo.findByCareerId(careerId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Obtener inscripciones activas por carrera
    public ResponseEntity<List<UserCareerEnrollmentDto>> findActiveByCareer(Long careerId) {
        List<UserCareerEnrollmentDto> dtos = enrollmentRepo.findByCareerIdAndStatus(
                        careerId, UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // Crear nueva inscripción
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> createEnrollment(CreateEnrollmentDto dto) {
        // Verificar que el usuario existe
        UserEntity user = userRepo.findById(dto.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        // Verificar que la carrera existe
        CareerEntity career = careerRepo.findById(dto.careerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carrera no encontrada"));

        // Verificar que no existe ya una inscripción entre este usuario y carrera
        if (enrollmentRepo.existsByUserIdAndCareerId(dto.userId(), dto.careerId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El usuario ya está inscrito en esta carrera");
        }

        // Usar el plantel del usuario
        PlantelEntity plantel = user.getPlantel();

        // Verificar que la carrera pertenece al mismo plantel que el usuario
        if (career.getPlantel().getId() != plantel.getId()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La carrera no pertenece al plantel del usuario");
        }

        // Generar o validar matrícula
        String registrationNumber;
        if (dto.customRegistrationNumber() != null && !dto.customRegistrationNumber().trim().isEmpty()) {
            // Usar matrícula personalizada
            validateCustomRegistrationNumber(dto.customRegistrationNumber(), plantel, null);
            registrationNumber = dto.customRegistrationNumber().trim();
        } else {
            // Generar matrícula automáticamente
            registrationNumber = generateRegistrationNumber(career, plantel);
        }

        // Crear la inscripción
        UserCareerEnrollmentEntity enrollment = new UserCareerEnrollmentEntity(user, career, plantel, registrationNumber);
        UserCareerEnrollmentEntity saved = enrollmentRepo.save(enrollment);

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    // Actualizar inscripción
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> updateEnrollment(Long enrollmentId, UpdateEnrollmentDto dto) {
        UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

        // Actualizar matrícula si se proporciona
        if (dto.registrationNumber() != null && !dto.registrationNumber().trim().isEmpty()) {
            validateCustomRegistrationNumber(dto.registrationNumber(), enrollment.getPlantel(), enrollmentId);
            enrollment.setRegistrationNumber(dto.registrationNumber().trim());
        }

        // Actualizar estado si se proporciona
        if (dto.status() != null) {
            enrollment.setStatus(dto.status());
        }

        UserCareerEnrollmentEntity updated = enrollmentRepo.save(enrollment);
        return ResponseEntity.ok(toDto(updated));
    }

    @Transactional
    public UserCareerEnrollmentDto updateRegistrationNumber(Long enrollmentId, String newRegistrationNumber) {
        UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

        // Validar que la nueva matrícula no esté en uso
        if (enrollmentRepo.existsByRegistrationNumberAndPlantelId(newRegistrationNumber, enrollment.getPlantel().getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe esta matrícula en el plantel");
        }

        enrollment.setRegistrationNumber(newRegistrationNumber);
        UserCareerEnrollmentEntity saved = enrollmentRepo.save(enrollment);

        return toDto(saved);
    }

    // Completar inscripción (marcar como terminada)
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> completeEnrollment(Long enrollmentId) {
        UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

        enrollment.setStatus(UserCareerEnrollmentEntity.EnrollmentStatus.COMPLETED);
        enrollment.setCompletedAt(LocalDateTime.now());

        UserCareerEnrollmentEntity updated = enrollmentRepo.save(enrollment);
        return ResponseEntity.ok(toDto(updated));
    }

    // Desactivar inscripción
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> deactivateEnrollment(Long enrollmentId) {
        UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

        enrollment.setStatus(UserCareerEnrollmentEntity.EnrollmentStatus.INACTIVE);

        UserCareerEnrollmentEntity updated = enrollmentRepo.save(enrollment);
        return ResponseEntity.ok(toDto(updated));
    }

    // Reactivar inscripción
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> reactivateEnrollment(Long enrollmentId) {
        UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

        enrollment.setStatus(UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE);

        UserCareerEnrollmentEntity updated = enrollmentRepo.save(enrollment);
        return ResponseEntity.ok(toDto(updated));
    }

    // Eliminar inscripción (soft delete - solo cambiar a INACTIVE)
    @Transactional
    public ResponseEntity<Void> deleteEnrollment(Long enrollmentId) {
        UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

        // En lugar de eliminar físicamente, marcar como INACTIVE
        enrollment.setStatus(UserCareerEnrollmentEntity.EnrollmentStatus.INACTIVE);
        enrollmentRepo.save(enrollment);

        return ResponseEntity.noContent().build();
    }

    // Generar nueva matrícula para una carrera específica (endpoint de utilidad)
    public ResponseEntity<String> generateNewRegistrationNumber(Long careerId) {
        CareerEntity career = careerRepo.findById(careerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carrera no encontrada"));

        String newRegistrationNumber = generateRegistrationNumber(career, career.getPlantel());
        return ResponseEntity.ok(newRegistrationNumber);
    }
}