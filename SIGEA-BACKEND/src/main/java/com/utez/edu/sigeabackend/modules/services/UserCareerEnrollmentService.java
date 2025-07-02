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

    // Generar matrícula automáticamente con NUEVO FORMATO: Año + Identificador + 4 dígitos
    private String generateRegistrationNumber(CareerEntity career, PlantelEntity plantel) {
        try {
            String year = String.valueOf(Year.now().getValue()).substring(2); // Últimos 2 dígitos del año
            String differentiator = career.getDifferentiator();
            String pattern = year + differentiator + "%"; // NUEVO FORMATO: AñoIdentificador%

            // Obtener la última matrícula generada para este patrón
            List<String> existingNumbers = enrollmentRepo.findLastRegistrationNumberByCareerAndPattern(
                    career.getId(), pattern);

            int nextNumber = 1;
            if (!existingNumbers.isEmpty()) {
                String lastNumber = existingNumbers.get(0);
                // Quitar año + diferenciador para obtener solo los 4 dígitos
                String numberPart = lastNumber.substring(year.length() + differentiator.length());
                try {
                    nextNumber = Integer.parseInt(numberPart) + 1;
                } catch (NumberFormatException e) {
                    nextNumber = 1; // Si hay error, empezar desde 1
                }
            }

            String finalRegistrationNumber;
            int attempts = 0;
            final int maxAttempts = 1000;

            do {
                if (attempts < 10) {
                    // Primeros 10 intentos: usar número secuencial
                    finalRegistrationNumber = String.format("%s%s%04d", year, differentiator, nextNumber + attempts);
                } else {
                    // Después de 10 intentos: usar números aleatorios
                    int randomNumber = random.nextInt(9999) + 1;
                    finalRegistrationNumber = String.format("%s%s%04d", year, differentiator, randomNumber);
                }
                attempts++;
            } while (enrollmentRepo.existsByRegistrationNumberAndPlantelId(finalRegistrationNumber, plantel.getId())
                    && attempts < maxAttempts);

            if (attempts >= maxAttempts) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "No se pudo generar una matrícula única después de " + maxAttempts + " intentos");
            }

            return finalRegistrationNumber;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al generar matrícula: " + e.getMessage());
        }
    }

    // Validar matrícula personalizada
    private void validateCustomRegistrationNumber(String registrationNumber, PlantelEntity plantel, Long excludeEnrollmentId) {
        try {
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
        } catch (ResponseStatusException e) {
            throw e; // Re-lanzar excepciones de validación
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al validar matrícula: " + e.getMessage());
        }
    }

    // Obtener todas las inscripciones
    public ResponseEntity<List<UserCareerEnrollmentDto>> findAll() {
        try {
            List<UserCareerEnrollmentDto> dtos = enrollmentRepo.findAll()
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al obtener inscripciones: " + e.getMessage());
        }
    }

    // Obtener inscripciones por usuario
    public ResponseEntity<List<UserCareerEnrollmentDto>> findByUserId(Long userId) {
        try {
            List<UserCareerEnrollmentDto> dtos = enrollmentRepo.findByUserId(userId)
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al obtener inscripciones del usuario: " + e.getMessage());
        }
    }

    public List<TeacherByCareerzDto> getTeachersByCareer(Long careerId) {
        try {
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
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al obtener maestros por carrera: " + e.getMessage());
        }
    }

    public List<UserCareerEnrollmentDto> getStudentsByCareer(Long careerId) {
        try {
            List<UserCareerEnrollmentEntity> enrollments = enrollmentRepo.findActiveByCareerId(careerId);

            return enrollments.stream()
                    .filter(enrollment -> "STUDENT".equals(enrollment.getUser().getRole().getRoleName()))
                    .map(this::toDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al obtener estudiantes por carrera: " + e.getMessage());
        }
    }

    // Obtener inscripciones por carrera
    public ResponseEntity<List<UserCareerEnrollmentDto>> findByCareerId(Long careerId) {
        try {
            List<UserCareerEnrollmentDto> dtos = enrollmentRepo.findByCareerId(careerId)
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al obtener inscripciones por carrera: " + e.getMessage());
        }
    }

    // Obtener inscripciones activas por carrera
    public ResponseEntity<List<UserCareerEnrollmentDto>> findActiveByCareer(Long careerId) {
        try {
            List<UserCareerEnrollmentDto> dtos = enrollmentRepo.findByCareerIdAndStatus(
                            careerId, UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE)
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al obtener inscripciones activas: " + e.getMessage());
        }
    }

    // Crear nueva inscripción
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> createEnrollment(CreateEnrollmentDto dto) {
        try {
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
            if (!Long.valueOf(career.getPlantel().getId()).equals(plantel.getId())) {
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
                // Generar matrícula automáticamente con NUEVO FORMATO
                registrationNumber = generateRegistrationNumber(career, plantel);
            }

            // Crear la inscripción
            UserCareerEnrollmentEntity enrollment = new UserCareerEnrollmentEntity(user, career, plantel, registrationNumber);
            UserCareerEnrollmentEntity saved = enrollmentRepo.save(enrollment);

            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
        } catch (ResponseStatusException e) {
            throw e; // Re-lanzar excepciones de validación
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al crear inscripción: " + e.getMessage());
        }
    }

    // Actualizar inscripción
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> updateEnrollment(Long enrollmentId, UpdateEnrollmentDto dto) {
        try {
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
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al actualizar inscripción: " + e.getMessage());
        }
    }

    @Transactional
    public UserCareerEnrollmentDto updateRegistrationNumber(Long enrollmentId, String newRegistrationNumber) {
        try {
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
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al actualizar matrícula: " + e.getMessage());
        }
    }

    // Completar inscripción (marcar como terminada)
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> completeEnrollment(Long enrollmentId) {
        try {
            UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

            enrollment.setStatus(UserCareerEnrollmentEntity.EnrollmentStatus.COMPLETED);
            enrollment.setCompletedAt(LocalDateTime.now());

            UserCareerEnrollmentEntity updated = enrollmentRepo.save(enrollment);
            return ResponseEntity.ok(toDto(updated));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al completar inscripción: " + e.getMessage());
        }
    }

    // Desactivar inscripción
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> deactivateEnrollment(Long enrollmentId) {
        try {
            UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

            enrollment.setStatus(UserCareerEnrollmentEntity.EnrollmentStatus.INACTIVE);

            UserCareerEnrollmentEntity updated = enrollmentRepo.save(enrollment);
            return ResponseEntity.ok(toDto(updated));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al desactivar inscripción: " + e.getMessage());
        }
    }

    // Reactivar inscripción
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> reactivateEnrollment(Long enrollmentId) {
        try {
            UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

            enrollment.setStatus(UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE);

            UserCareerEnrollmentEntity updated = enrollmentRepo.save(enrollment);
            return ResponseEntity.ok(toDto(updated));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al reactivar inscripción: " + e.getMessage());
        }
    }

    // Eliminar inscripción
    @Transactional
    public ResponseEntity<Void> deleteEnrollment(Long enrollmentId) {
        try {
            UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));
            enrollmentRepo.delete(enrollment);

            return ResponseEntity.noContent().build();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al eliminar inscripción: " + e.getMessage());
        }
    }

    // Generar nueva matrícula para una carrera específica (endpoint de utilidad)
    public ResponseEntity<String> generateNewRegistrationNumber(Long careerId) {
        try {
            CareerEntity career = careerRepo.findById(careerId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carrera no encontrada"));

            String newRegistrationNumber = generateRegistrationNumber(career, career.getPlantel());
            return ResponseEntity.ok(newRegistrationNumber);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al generar matrícula: " + e.getMessage());
        }
    }
}