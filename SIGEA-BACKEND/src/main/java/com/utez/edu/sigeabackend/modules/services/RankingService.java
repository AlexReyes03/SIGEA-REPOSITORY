package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity;
import com.utez.edu.sigeabackend.modules.entities.RankingEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.*;
import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.GroupResponseDto;
import com.utez.edu.sigeabackend.modules.repositories.RankingRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class RankingService {
    private final RankingRepository repository;
    private final UserRepository userRepository;
    private final CustomResponseEntity responseService;
    private final GroupService groupService;
    private final GroupStudentService groupStudentService;
    private final ModuleService moduleService;

    public RankingService(RankingRepository repository,
                          UserRepository userRepository,
                          CustomResponseEntity responseService, GroupService groupService, GroupStudentService groupStudentService, ModuleService moduleService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.responseService = responseService;
        this.groupService = groupService;
        this.groupStudentService = groupStudentService;
        this.moduleService = moduleService;
    }

    // Helper method to convert entity to DTO
    private RankingDto toDto(RankingEntity ranking) {
        UserEntity student = ranking.getStudent();

        String fullName = buildFullName(student.getName(),
                student.getPaternalSurname(),
                student.getMaternalSurname());

        String avatarUrl = student.getAvatar() != null ?
                "/sigea/api/media/raw/" + student.getAvatar().getCode() : null;

        RankingDto.StudentInfoDto studentInfo = new RankingDto.StudentInfoDto(
                student.getId(),
                fullName,
                student.getEmail(),
                avatarUrl,
                student.getCampus().getName(),
                student.getCampus().getId()
        );

        return new RankingDto(
                ranking.getId(),
                ranking.getComment(),
                ranking.getStar(),
                ranking.getDate(),
                ranking.getTeacher().getId(),
                studentInfo
        );
    }

    private String buildFullName(String name, String paternalSurname, String maternalSurname) {
        StringBuilder fullName = new StringBuilder(name);

        if (paternalSurname != null && !paternalSurname.trim().isEmpty()) {
            fullName.append(" ").append(paternalSurname);
        }

        if (maternalSurname != null && !maternalSurname.trim().isEmpty()) {
            fullName.append(" ").append(maternalSurname);
        }

        return fullName.toString();
    }

    public ResponseEntity<?> findAll() {
        List<RankingEntity> list = repository.findAllWithDetails();
        if (list.isEmpty()) {
            return responseService.getOkResponse("Lista de rankings", null);
        }

        List<RankingDto> dtos = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return responseService.getOkResponse("Lista de rankings", dtos);
    }

    public ResponseEntity<?> findById(long id) {
        Optional<RankingEntity> ranking = repository.findById(id);
        if (ranking.isPresent()) {
            return responseService.getOkResponse("Ranking encontrado", toDto(ranking.get()));
        } else {
            return responseService.get404Response();
        }
    }

    public ResponseEntity<?> findByTeacher(long teacherId) {
        if (!userRepository.existsById(teacherId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El docente especificado no existe"));
        }

        List<RankingEntity> list = repository.findByTeacher_IdWithDetails(teacherId);
        if (list.isEmpty()) {
            return responseService.getOkResponse("Rankings del docente", null);
        }

        List<RankingDto> dtos = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return responseService.getOkResponse("Rankings del docente", dtos);
    }

    @Transactional
    public ResponseEntity<?> create(RankingEntity ranking) {
        try {
            // Validar que teacherId y studentId estén presentes
            if (ranking.getTeacherId() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El ID del docente es obligatorio"));
            }

            if (ranking.getStudentId() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El ID del estudiante es obligatorio"));
            }

            // Validar que teacher y student existan
            Optional<UserEntity> teacherOpt = userRepository.findById(ranking.getTeacherId());
            Optional<UserEntity> studentOpt = userRepository.findById(ranking.getStudentId());

            if (teacherOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El docente especificado no existe"));
            }

            if (studentOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El estudiante especificado no existe"));
            }

            // Validar que el estudiante no haya calificado ya al docente
            if (repository.existsByStudent_IdAndTeacher_Id(ranking.getStudentId(), ranking.getTeacherId())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Este estudiante ya ha calificado a este docente"));
            }

            // Validar estrellas (1-5)
            if (ranking.getStar() < 1 || ranking.getStar() > 5) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "La calificación debe estar entre 1 y 5 estrellas"));
            }

            // Validar comentario
            if (ranking.getComment() == null || ranking.getComment().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El comentario es obligatorio"));
            }

            // Configurar relaciones
            ranking.setTeacher(teacherOpt.get());
            ranking.setStudent(studentOpt.get());

            RankingEntity saved = repository.save(ranking);
            return responseService.getOkResponse("Ranking creado exitosamente", null);

        } catch (Exception e) {
            if (e.getMessage().contains("Data too long")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El comentario excede la longitud máxima permitida"));
            } else {
                return ResponseEntity.status(500)
                        .body(Map.of("error", "Error interno al crear el ranking"));
            }
        }
    }


    public ResponseEntity<?> getStudentEvaluationModules(Long studentId) {
        try {
            // Validar que el estudiante existe
            if (!userRepository.existsById(studentId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El estudiante especificado no existe"));
            }

            // Obtener grupos del estudiante usando GroupStudentService
            List<GroupStudentEntity> studentGroups = groupStudentService.findByStudent(studentId);

            if (studentGroups.isEmpty()) {
                return responseService.getOkResponse("Módulos de evaluación", List.of());
            }

            List<EvaluationModuleDto> evaluationModules = new ArrayList<>();

            for (GroupStudentEntity groupStudent : studentGroups) {
                // Obtener detalles del grupo usando el groupId
                Long groupId = groupStudent.getId().getGroupId();
                ResponseEntity<GroupResponseDto> groupResponse = groupService.findById(groupId);

                if (groupResponse.getStatusCode().is2xxSuccessful()) {
                    GroupResponseDto group = groupResponse.getBody();

                    // Obtener módulos del curriculum
                    ResponseEntity<List<ModuleDto>> modulesResponse =
                            moduleService.findByCurriculumId(group.curriculumId());

                    if (modulesResponse.getStatusCode().is2xxSuccessful()) {
                        List<ModuleDto> modules = modulesResponse.getBody();

                        // Verificar si ya evaluó a este teacher
                        boolean isEvaluated = repository.existsByStudent_IdAndTeacher_Id(
                                studentId, group.teacherId()
                        );

                        // Obtener evaluación existente si existe
                        RankingEntity existingRanking = null;
                        if (isEvaluated) {
                            existingRanking = repository.findByStudent_IdAndTeacher_Id(
                                    studentId, group.teacherId()
                            ).orElse(null);
                        }

                        // Extraer nombres de materias
                        List<String> subjectNames = modules.stream()
                                .flatMap(module -> module.subjects().stream())
                                .map(SubjectDto::name)
                                .collect(Collectors.toList());

                        // Crear DTO de evaluación
                        EvaluationModuleDto evaluationModule = new EvaluationModuleDto(
                                group.groupId() + "-" + group.teacherId(), // unique ID
                                group.curriculumName() + " - Grupo " + group.name(),
                                group.teacherName(),
                                group.teacherId(),
                                group.groupId(),
                                group.curriculumName(),
                                group.weekDay() + " " + group.startTime() + "-" + group.endTime(),
                                subjectNames,
                                isEvaluated,
                                existingRanking != null ? existingRanking.getStar() : null,
                                existingRanking != null ? existingRanking.getComment() : null
                        );

                        evaluationModules.add(evaluationModule);
                    }
                }
            }

            return responseService.getOkResponse("Módulos de evaluación", evaluationModules);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error al obtener módulos de evaluación: " + e.getMessage()));
        }
    }

    /**
     * Check if a student has already evaluated a specific teacher
     *
     * @param studentId Student ID
     * @param teacherId Teacher ID
     * @return ResponseEntity with evaluation status
     */
    public ResponseEntity<?> checkStudentTeacherEvaluation(Long studentId, Long teacherId) {
        try {
            // Validar que ambos usuarios existen
            if (!userRepository.existsById(studentId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El estudiante especificado no existe"));
            }

            if (!userRepository.existsById(teacherId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El docente especificado no existe"));
            }

            // Buscar evaluación existente
            Optional<RankingEntity> existingRanking = repository.findByStudent_IdAndTeacher_Id(
                    studentId, teacherId
            );

            if (existingRanking.isPresent()) {
                RankingEntity ranking = existingRanking.get();
                EvaluationStatusDto status = new EvaluationStatusDto(
                        true,
                        ranking.getStar(),
                        ranking.getComment(),
                        ranking.getDate()
                );
                return responseService.getOkResponse("Estado de evaluación", status);
            } else {
                EvaluationStatusDto status = new EvaluationStatusDto(
                        false, null, null, null
                );
                return responseService.getOkResponse("Estado de evaluación", status);
            }

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error al verificar evaluación"));
        }
    }

    /**
     * Get all evaluations made by a specific student
     *
     * @param studentId Student ID
     * @return ResponseEntity with student's evaluations
     */
    public ResponseEntity<?> findByStudent(Long studentId) {
        try {
            if (!userRepository.existsById(studentId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El estudiante especificado no existe"));
            }

            List<RankingEntity> rankings = repository.findByStudent_IdWithDetails(studentId);

            if (rankings.isEmpty()) {
                return responseService.getOkResponse("Evaluaciones del estudiante", List.of());
            }

            List<RankingDto> dtos = rankings.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return responseService.getOkResponse("Evaluaciones del estudiante", dtos);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error al obtener evaluaciones del estudiante"));
        }
    }
}