package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity;
import com.utez.edu.sigeabackend.modules.entities.RankingEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.*;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CampusStatsDtos.*;
import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.GroupResponseDto;
import com.utez.edu.sigeabackend.modules.repositories.CampusRepository;
import com.utez.edu.sigeabackend.modules.repositories.RankingRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class RankingService {
    private final RankingRepository repository;
    private final CampusRepository campusRepository;
    private final UserRepository userRepository;
    private final CustomResponseEntity responseService;
    private final GroupService groupService;
    private final GroupStudentService groupStudentService;
    private final ModuleService moduleService;

    public RankingService(RankingRepository repository,
                          CampusRepository campusRepository,
                          UserRepository userRepository,
                          CustomResponseEntity responseService,
                          GroupService groupService,
                          GroupStudentService groupStudentService,
                          ModuleService moduleService) {
        this.repository = repository;
        this.campusRepository = campusRepository;
        this.userRepository = userRepository;
        this.responseService = responseService;
        this.groupService = groupService;
        this.groupStudentService = groupStudentService;
        this.moduleService = moduleService;
    }

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

    private RankingRequestDtos.AnonymousRankingDto toAnonymousDto(RankingEntity ranking) {
        return new RankingRequestDtos.AnonymousRankingDto(
                ranking.getId(),
                ranking.getComment(),
                ranking.getStar(),
                ranking.getDate(),
                ranking.getTeacher().getId()
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

    public ResponseEntity<?> findByTeacherAnonymous(long teacherId) {
        if (!userRepository.existsById(teacherId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El docente especificado no existe"));
        }

        List<RankingEntity> list = repository.findByTeacher_IdWithDetails(teacherId);
        if (list.isEmpty()) {
            return responseService.getOkResponse("Rankings del docente", null);
        }

        List<RankingRequestDtos.AnonymousRankingDto> anonymousDtos = list.stream()
                .map(this::toAnonymousDto)
                .collect(Collectors.toList());

        return responseService.getOkResponse("Rankings del docente", anonymousDtos);
    }

    public ResponseEntity<?> findByStudent(Long studentId) {
        try {
            if (!userRepository.existsById(studentId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El estudiante especificado no existe"));
            }

            // Usar método existente y filtrar por student
            List<RankingEntity> allRankings = repository.findAllWithDetails();
            List<RankingEntity> studentRankings = allRankings.stream()
                    .filter(r -> Objects.equals(r.getStudent().getId(), studentId))
                    .toList();

            if (studentRankings.isEmpty()) {
                return responseService.getOkResponse("Evaluaciones del estudiante", List.of());
            }

            List<RankingDto> dtos = studentRankings.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return responseService.getOkResponse("Evaluaciones del estudiante", dtos);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error al obtener evaluaciones del estudiante"));
        }
    }

    @Transactional
    public ResponseEntity<?> create(RankingEntity ranking) {
        try {
            // Validar que teacherId, studentId y moduleId estén presentes
            if (ranking.getTeacherId() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El ID del docente es obligatorio"));
            }

            if (ranking.getStudentId() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El ID del estudiante es obligatorio"));
            }

            if (ranking.getModuleId() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El ID del módulo es obligatorio"));
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
            if (!userRepository.existsById(studentId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El estudiante especificado no existe"));
            }

            List<GroupStudentEntity> studentGroups = groupStudentService.findByStudent(studentId);

            if (studentGroups.isEmpty()) {
                return responseService.getOkResponse("Módulos de evaluación", List.of());
            }

            List<EvaluationModuleDto> evaluationModules = new ArrayList<>();

            for (GroupStudentEntity groupStudent : studentGroups) {
                if (!groupStudent.isActive()) {
                    continue;
                }

                // Obtener detalles del grupo usando el groupId
                long groupId = groupStudent.getId().getGroupId();
                ResponseEntity<GroupResponseDto> groupResponse = groupService.findById(groupId);

                if (groupResponse.getStatusCode().is2xxSuccessful()) {
                    GroupResponseDto group = groupResponse.getBody();

                    // Obtener módulos del curriculum
                    assert group != null;
                    ResponseEntity<List<ModuleDto>> modulesResponse =
                            moduleService.findByCurriculumId(group.curriculumId());

                    if (modulesResponse.getStatusCode().is2xxSuccessful()) {
                        List<ModuleDto> modules = modulesResponse.getBody();

                        assert modules != null;

                        // Calcula semanas transcurridas desde que el estudiante entró al grupo
                        long semanasTranscurridas = calcularSemanasTranscurridas(groupStudent.getEntryDate());

                        // Filtra módulos que ya deberían estar disponibles para evaluación
                        List<ModuleDto> modulosDisponibles = filtrarModulosDisponibles(modules, semanasTranscurridas);

                        for (ModuleDto module : modulosDisponibles) {
                            // Verifica si ya evaluó a este teacher en este módulo específico
                            Optional<RankingEntity> existingRanking = repository.findByStudent_IdAndTeacher_IdAndModuleId(
                                    studentId,
                                    group.teacherId(),
                                    module.id()
                            );

                            boolean isEvaluated = existingRanking.isPresent();

                            List<String> subjectNames = module.subjects().stream()
                                    .map(SubjectDto::name)
                                    .collect(Collectors.toList());

                            EvaluationModuleDto evaluationModule = new EvaluationModuleDto(
                                    group.groupId() + "-" + group.teacherId() + "-" + module.id(),
                                    module.name(),
                                    module.id(),
                                    group.teacherName(),
                                    group.teacherId(),
                                    group.groupId(),
                                    group.curriculumName(),
                                    group.weekDay() + " " + group.startTime() + "-" + group.endTime(),
                                    subjectNames,
                                    isEvaluated,
                                    existingRanking.isPresent() ? existingRanking.get().getStar() : null,
                                    existingRanking.map(RankingEntity::getComment).orElse(null)
                            );

                            evaluationModules.add(evaluationModule);
                        }
                    }
                }
            }

            return responseService.getOkResponse("Módulos de evaluación", evaluationModules);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    // *** Calcula las semanas transcurridas desde la fecha de entrada del estudiante
    private long calcularSemanasTranscurridas(LocalDateTime entryDate) {
        LocalDate fechaEntrada = entryDate.toLocalDate();
        LocalDate fechaActual = LocalDate.now();

        // Calcular días transcurridos y convertir a semanas
        long diasTranscurridos = ChronoUnit.DAYS.between(fechaEntrada, fechaActual);
        return diasTranscurridos / 7;
    }

    // *** Filtra los módulos que deberían estar disponibles basándose en las semanas transcurridas
    private List<ModuleDto> filtrarModulosDisponibles(List<ModuleDto> modules, long semanasTranscurridas) {
        List<ModuleDto> disponibles = new ArrayList<>();
        long semanasAcumuladas = 0;

        // Procesamiento secuencial de los modulos
        for (ModuleDto module : modules) {
            long duracionModulo = calcularDuracionModulo(module);

            if (semanasTranscurridas > semanasAcumuladas) {
                disponibles.add(module);
            } else {
                break;
            }

            semanasAcumuladas += duracionModulo;
        }

        return disponibles;
    }

    // *** Calcula la duración total de un módulo sumando las semanas de todas sus materias
    private long calcularDuracionModulo(ModuleDto module) {
        if (module.subjects() == null || module.subjects().isEmpty()) {
            return 0;
        }

        return module.subjects().stream()
                .mapToLong(subject -> subject.weeks() != null ? subject.weeks() : 0)
                .sum();
    }


    public ResponseEntity<?> checkStudentTeacherEvaluation(Long studentId, Long teacherId, Long moduleId) {
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

            // Buscar evaluación existente por student, teacher Y module usando método existente
            List<RankingEntity> teacherRankings = repository.findByTeacher_IdWithDetails(teacherId);
            Optional<RankingEntity> existingRanking = teacherRankings.stream()
                    .filter(r -> Objects.equals(r.getStudent().getId(), studentId))
                    .filter(r -> r.getModuleId() != null && r.getModuleId().equals(moduleId))
                    .findFirst();

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

    // METODO PARA ESTADÍSTICAS DE RANKINGS DEL CAMPUS

    public ResponseEntity<CampusRankingStatsDto> getCampusRankingStats(Long campusId) {
        try {
            boolean campusExists = campusRepository.existsById(campusId);

            if (!campusExists) {
                return ResponseEntity.badRequest().build();
            }

            CampusRankingStatsDto stats = getCampusRankingStatsInternal(campusId);
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    private CampusRankingStatsDto getCampusRankingStatsInternal(Long campusId) {
        List<RankingEntity> campusRankings = repository.findAllWithDetails().stream()
                .filter(ranking -> ranking.getTeacher().getCampus().getId() == campusId)
                .toList();

        if (campusRankings.isEmpty()) {
            return new CampusRankingStatsDto(0.0, 0, List.of(), List.of());
        }

        // Calcular promedio general
        double averageRating = campusRankings.stream()
                .mapToInt(RankingEntity::getStar)
                .average()
                .orElse(0.0);

        int totalEvaluations = campusRankings.size();

        Map<Integer, Long> starCounts = campusRankings.stream()
                .collect(Collectors.groupingBy(RankingEntity::getStar, Collectors.counting()));

        List<StarDistributionDto> starDistribution = new ArrayList<>();
        for (int star = 1; star <= 5; star++) {
            long count = starCounts.getOrDefault(star, 0L);
            double percentage = count * 100.0 / totalEvaluations;
            starDistribution.add(new StarDistributionDto(star, (int) count, percentage));
        }

        // Calcular ranking de docentes
        Map<Long, List<RankingEntity>> rankingsByTeacher = campusRankings.stream()
                .collect(Collectors.groupingBy(ranking -> ranking.getTeacher().getId()));

        List<TeacherRankingDto> teacherRankings = rankingsByTeacher.entrySet().stream()
                .map(entry -> {
                    Long teacherId = entry.getKey();
                    List<RankingEntity> teacherRankingsList = entry.getValue();
                    UserEntity teacher = teacherRankingsList.get(0).getTeacher();

                    double teacherAverage = teacherRankingsList.stream()
                            .mapToInt(RankingEntity::getStar)
                            .average()
                            .orElse(0.0);

                    String teacherName = buildFullName(teacher.getName(),
                            teacher.getPaternalSurname(), teacher.getMaternalSurname());

                    String avatarUrl = teacher.getAvatar() != null ?
                            "/sigea/api/media/raw/" + teacher.getAvatar().getCode() : null;

                    return new TeacherRankingDto(
                            teacherId,
                            teacherName,
                            teacher.getEmail(),
                            avatarUrl,
                            teacherAverage,
                            teacherRankingsList.size(),
                            0
                    );
                })
                .sorted((a, b) -> {
                    int avgCompare = Double.compare(b.averageRating(), a.averageRating());
                    if (avgCompare != 0) return avgCompare;
                    return Integer.compare(b.totalEvaluations(), a.totalEvaluations());
                })
                .collect(Collectors.toList());

        for (int i = 0; i < teacherRankings.size(); i++) {
            TeacherRankingDto currentTeacher = teacherRankings.get(i);
            TeacherRankingDto updatedTeacher = new TeacherRankingDto(
                    currentTeacher.teacherId(),
                    currentTeacher.teacherName(),
                    currentTeacher.teacherEmail(),
                    currentTeacher.avatarUrl(),
                    currentTeacher.averageRating(),
                    currentTeacher.totalEvaluations(),
                    i + 1
            );
            teacherRankings.set(i, updatedTeacher);
        }

        return new CampusRankingStatsDto(averageRating, totalEvaluations, starDistribution, teacherRankings);
    }
}