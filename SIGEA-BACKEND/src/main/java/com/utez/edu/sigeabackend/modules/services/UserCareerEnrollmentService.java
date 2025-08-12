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
    private final CampusRepository campusRepo;
    private final Random random = new Random();

    public UserCareerEnrollmentService(UserCareerEnrollmentRepository enrollmentRepo,
                                       UserRepository userRepo,
                                       CareerRepository careerRepo,
                                       CampusRepository campusRepo) {
        this.enrollmentRepo = enrollmentRepo;
        this.userRepo = userRepo;
        this.careerRepo = careerRepo;
        this.campusRepo = campusRepo;
    }

    /** Helper method to convert entity to DTO */
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
                entity.getCampus().getId(),
                entity.getCampus().getName(),
                entity.getRegistrationNumber(),
                entity.getStatus().name(),
                entity.getEnrolledAt(),
                entity.getCompletedAt(),
                false
        );
    }

    /** Generar matrícula automáticamente con formato específico para TEACHER y STUDENT */
    private String generateRegistrationNumber(CareerEntity career, CampusEntity campus, String userRole) {
        try {
            String year = String.valueOf(Year.now().getValue()).substring(2);
            String differentiator = career.getDifferentiator();
            String basePattern = year + differentiator + "%";

            boolean isTeacher = "TEACHER".equals(userRole);
            String searchPattern = isTeacher ? basePattern + "-M" : basePattern;

            List<String> existingNumbers = enrollmentRepo.findLastRegistrationNumberByCareerAndPattern(
                    career.getId(), searchPattern);

            int nextNumber;
            if (!existingNumbers.isEmpty()) {
                String lastNumber = existingNumbers.getFirst();
                String suffix = isTeacher ? "-M" : "";
                String numberPart = lastNumber.substring(year.length() + differentiator.length(),
                        lastNumber.length() - suffix.length());
                try {
                    nextNumber = Integer.parseInt(numberPart) + 1;
                } catch (NumberFormatException e) {
                    nextNumber = 1;
                }
            } else {
                nextNumber = 1;
            }

            String finalRegistrationNumber;
            int attempts = 0;
            final int maxAttempts = 1000;

            do {
                String baseNumber;
                if (attempts < 10) {
                    baseNumber = String.format("%s%s%04d", year, differentiator, nextNumber + attempts);
                } else {
                    int randomNumber = random.nextInt(9999) + 1;
                    baseNumber = String.format("%s%s%04d", year, differentiator, randomNumber);
                }

                finalRegistrationNumber = isTeacher ? baseNumber + "-M" : baseNumber;
                attempts++;
            } while (enrollmentRepo.existsByRegistrationNumberAndCampusId(finalRegistrationNumber, campus.getId())
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

    /** Validar matrícula personalizada considerando el sufijo -M para TEACHER */
    private void validateCustomRegistrationNumber(String registrationNumber, CampusEntity campus, Long excludeEnrollmentId, String userRole) {
        try {
            if (registrationNumber == null || registrationNumber.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La matrícula no puede estar vacía");
            }

            boolean isTeacher = "TEACHER".equals(userRole);

            if (isTeacher && !registrationNumber.endsWith("-M")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Las matrículas de maestros deben terminar con -M");
            }

            if (!isTeacher && registrationNumber.endsWith("-M")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Solo las matrículas de maestros pueden terminar con -M");
            }

            if (registrationNumber.length() > 20) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La matrícula no puede exceder 20 caracteres");
            }

            boolean exists = enrollmentRepo.findByRegistrationNumberAndCampusId(registrationNumber, campus.getId())
                    .map(existing -> !existing.getId().equals(excludeEnrollmentId))
                    .orElse(false);

            if (exists) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Ya existe un usuario con esta matrícula en el campus");
            }
        } catch (ResponseStatusException e) {
            throw e;
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

    /** Crear nueva inscripción con soporte para sufijo -M en TEACHER */
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> createEnrollment(CreateEnrollmentDto dto) {
        try {
            UserEntity user = userRepo.findById(dto.userId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

            CareerEntity career = careerRepo.findById(dto.careerId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carrera no encontrada"));

            if (enrollmentRepo.existsByUserIdAndCareerId(dto.userId(), dto.careerId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "El usuario ya está inscrito en esta carrera");
            }

            CampusEntity campus = user.getCampus();

            if (!Long.valueOf(career.getCampus().getId()).equals(campus.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "La carrera no pertenece al campus del usuario");
            }

            String userRole = user.getRole().getRoleName();
            String registrationNumber;

            if (dto.customRegistrationNumber() != null && !dto.customRegistrationNumber().trim().isEmpty()) {
                validateCustomRegistrationNumber(dto.customRegistrationNumber(), campus, null, userRole);
                registrationNumber = dto.customRegistrationNumber().trim();
            } else {
                registrationNumber = generateRegistrationNumber(career, campus, userRole);
            }

            UserCareerEnrollmentEntity enrollment = new UserCareerEnrollmentEntity(user, career, campus, registrationNumber);
            UserCareerEnrollmentEntity saved = enrollmentRepo.save(enrollment);

            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al crear inscripción: " + e.getMessage());
        }
    }

    /** Actualizar inscripción con validación de sufijo -M para TEACHER */
    @Transactional
    public ResponseEntity<UserCareerEnrollmentDto> updateEnrollment(Long enrollmentId, UpdateEnrollmentDto dto) {
        try {
            UserCareerEnrollmentEntity enrollment = enrollmentRepo.findById(enrollmentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscripción no encontrada"));

            if (dto.registrationNumber() != null && !dto.registrationNumber().trim().isEmpty()) {
                String userRole = enrollment.getUser().getRole().getRoleName();
                validateCustomRegistrationNumber(dto.registrationNumber(), enrollment.getCampus(), enrollmentId, userRole);
                enrollment.setRegistrationNumber(dto.registrationNumber().trim());
            }

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

            String userRole = enrollment.getUser().getRole().getRoleName();
            validateCustomRegistrationNumber(newRegistrationNumber, enrollment.getCampus(), enrollmentId, userRole);

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

    /** Generar nueva matrícula para una carrera específica considerando el rol del usuario */
    public ResponseEntity<String> generateNewRegistrationNumber(Long careerId, String userRole) {
        try {
            CareerEntity career = careerRepo.findById(careerId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carrera no encontrada"));

            String newRegistrationNumber = generateRegistrationNumber(career, career.getCampus(), userRole);
            return ResponseEntity.ok(newRegistrationNumber);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Error al generar matrícula: " + e.getMessage());
        }
    }

    public ResponseEntity<String> generateNewRegistrationNumber(Long careerId) {
        return generateNewRegistrationNumber(careerId, "STUDENT");
    }
}