package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.*;
import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.GroupRequestDto;
import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.GroupResponseDto;
import com.utez.edu.sigeabackend.modules.repositories.CareerRepository;
import com.utez.edu.sigeabackend.modules.repositories.CurriculumRepository;
import com.utez.edu.sigeabackend.modules.repositories.GroupRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class GroupService {

    private final GroupRepository repository;
    private final UserRepository userRepository;
    private final CareerRepository careerRepository;
    private final CurriculumRepository curriculumRepository;

    public GroupService(GroupRepository repository, UserRepository userRepository, CareerRepository careerRepository, CurriculumRepository curriculumRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.careerRepository = careerRepository;
        this.curriculumRepository = curriculumRepository;
    }

    /**
     * Transforma una entidad GroupEntity en su DTO de respuesta.
     */
    private GroupResponseDto toResponseDto(GroupEntity g) {
        return new GroupResponseDto(
                g.getId(),
                g.getName(),
                g.getWeekDay().name(),
                g.getStartTime().toString(),
                g.getEndTime().toString(),
                g.getStartDate().toString(),
                g.getEndDate().toString(),
                g.getStatus().name(), // Nuevo campo
                g.getTeacher().getId(),
                g.getTeacher().getName() + " " + g.getTeacher().getPaternalSurname(),
                g.getCareer().getId(),
                g.getCareer().getName(),
                g.getCurriculum().getId(),
                g.getCurriculum().getName()
        );
    }

    /**
     * Actualiza automáticamente el estado de los grupos basándose en la fecha actual
     */
    private void updateGroupStatusBasedOnDates(List<GroupEntity> groups) {
        LocalDate today = LocalDate.now();
        groups.forEach(group -> {
            if (group.getStatus() == GroupStatus.ACTIVE && group.getEndDate().isBefore(today)) {
                group.setStatus(GroupStatus.COMPLETED);
                repository.save(group);
            }
        });
    }

    /**
     * Busca y valida las entidades relacionadas necesarias para crear/actualizar un grupo
     */
    private record GroupEntities(UserEntity teacher, CareerEntity career, CurriculumEntity curriculum) {}

    private GroupEntities findAndValidateEntities(GroupRequestDto dto) {
        UserEntity teacher = userRepository.findById(dto.teacherId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Docente no encontrado con id " + dto.teacherId()
                ));

        CareerEntity careerEntity = careerRepository.findById(dto.careerId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Carrera no encontrada con id " + dto.careerId()
                ));

        CurriculumEntity curriculum = curriculumRepository.findById(dto.curriculumId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Plan de estudios no encontrado con id " + dto.curriculumId()
                ));

        return new GroupEntities(teacher, careerEntity, curriculum);
    }

    /**
     * Valida todos los campos de tiempo y fecha del grupo
     */
    private void validateGroupTiming(GroupRequestDto dto, Long excludeGroupId) {
        LocalTime startTime = LocalTime.parse(dto.startTime());
        LocalTime endTime = LocalTime.parse(dto.endTime());
        WeekDays weekDay = WeekDays.valueOf(dto.weekDay());
        LocalDate startDate = LocalDate.parse(dto.startDate());
        LocalDate endDate = LocalDate.parse(dto.endDate());

        validateTimeRange(startTime, endTime);
        validateDateRange(startDate, endDate);
        validateTeacherScheduleConflict(dto.teacherId(), weekDay, startTime, endTime, excludeGroupId);
    }

    /**
     * Rellena (o actualiza) un GroupEntity a partir de un GroupRequestDto validado,
     * junto con las entidades ya recuperadas de Teacher y Career.
     */
    private void populateFromDto(
            GroupEntity target,
            GroupRequestDto dto,
            UserEntity teacher,
            CareerEntity careerEntity,
            CurriculumEntity curriculum
    ) {
        target.setName(dto.name());
        target.setStartTime(LocalTime.parse(dto.startTime()));
        target.setEndTime(LocalTime.parse(dto.endTime()));
        target.setWeekDay(WeekDays.valueOf(dto.weekDay()));
        target.setStartDate(LocalDate.parse(dto.startDate()));
        target.setEndDate(LocalDate.parse(dto.endDate()));
        target.setTeacher(teacher);
        target.setCareer(careerEntity);
        target.setCurriculum(curriculum);

        if (target.getId() != 0) {
            LocalDate today = LocalDate.now();
            LocalDate endDate = LocalDate.parse(dto.endDate());

            if (target.getStatus() == GroupStatus.COMPLETED && !endDate.isBefore(today)) {
                target.setStatus(GroupStatus.ACTIVE);
            }
            else if (target.getStatus() == GroupStatus.ACTIVE && endDate.isBefore(today)) {
                target.setStatus(GroupStatus.COMPLETED);
            }
        }
    }

    /**
     * Valida que el horario sea lógico
     */
    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La hora de fin debe ser posterior a la hora de inicio"
            );
        }
    }

    /**
     * Valida que las fechas sean lógicas
     */
    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate) || endDate.equals(startDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha de fin debe ser posterior a la fecha de inicio"
            );
        }
    }

    /**
     * Calcula la duración total en semanas de un curriculum
     */
    private int calculateCurriculumWeeks(CurriculumEntity curriculum) {
        if (curriculum == null || curriculum.getModules() == null || curriculum.getModules().isEmpty()) {
            return 0;
        }

        return curriculum.getModules().stream()
                .filter(Objects::nonNull)
                .mapToInt(module -> {
                    if (module.getSubjects() == null || module.getSubjects().isEmpty()) {
                        return 0;
                    }
                    return module.getSubjects().stream()
                            .filter(Objects::nonNull)
                            .mapToInt(SubjectEntity::getWeeks)
                            .sum();
                })
                .sum();
    }

    /**
     * Valida que la fecha de fin no sea menor a la duración mínima del curriculum
     */
    private void validateCurriculumDuration(LocalDate startDate, LocalDate endDate, CurriculumEntity curriculum) {
        int totalWeeks = calculateCurriculumWeeks(curriculum);

        if (totalWeeks == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El plan de estudios seleccionado no tiene materias definidas o la duración es cero"
            );
        }

        LocalDate minimumEndDate = startDate.plusWeeks(totalWeeks);

        if (endDate.isBefore(minimumEndDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    String.format("La fecha de fin debe ser al menos %s (duración del plan de estudios: %d semanas)",
                            minimumEndDate, totalWeeks)
            );
        }
    }

    /**
     * Valida que el docente no tenga conflictos de horario
     * Solo considera grupos ACTIVE para conflictos
     */
    private void validateTeacherScheduleConflict(Long teacherId, WeekDays weekDay,
                                                 LocalTime startTime, LocalTime endTime, Long excludeGroupId) {

        List<GroupEntity> teacherActiveGroups = repository.findByTeacherIdAndStatus(teacherId, GroupStatus.ACTIVE);

        for (GroupEntity existingGroup : teacherActiveGroups) {
            if (excludeGroupId != null && Objects.equals(existingGroup.getId(), excludeGroupId)) {
                continue;
            }

            if (existingGroup.getWeekDay().equals(weekDay)) {
                LocalTime existingStart = existingGroup.getStartTime();
                LocalTime existingEnd = existingGroup.getEndTime();

                boolean hasConflict = !(endTime.isBefore(existingStart) ||
                        endTime.equals(existingStart) ||
                        startTime.isAfter(existingEnd) ||
                        startTime.equals(existingEnd));

                if (hasConflict) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            String.format("El docente ya tiene asignado el grupo activo '%s' el día %s de %s a %s",
                                    existingGroup.getName(),
                                    existingGroup.getWeekDay().name(),
                                    existingStart.toString(),
                                    existingEnd.toString())
                    );
                }
            }
        }
    }

    // LISTAR TODOS
    @Transactional(readOnly = true)
    public ResponseEntity<List<GroupResponseDto>> findAllGroups() {
        List<GroupEntity> groups = repository.findAll();
        updateGroupStatusBasedOnDates(groups);

        if (groups.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<GroupResponseDto> dtos = groups.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // LISTAR POR DOCENTE
    @Transactional(readOnly = true)
    public ResponseEntity<List<GroupResponseDto>> findGroupsByTeacher(long teacherId) {
        List<GroupEntity> groups = repository.findByTeacherId(teacherId);
        updateGroupStatusBasedOnDates(groups);

        if (groups.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<GroupResponseDto> dtos = groups.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // LISTAR POR CARRERA
    @Transactional(readOnly = true)
    public ResponseEntity<List<GroupResponseDto>> findGroupsByCareer(long careerId) {
        List<GroupEntity> groups = repository.findByCareerId(careerId);
        updateGroupStatusBasedOnDates(groups);

        if (groups.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<GroupResponseDto> dtos = groups.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // OBTENER UNO POR ID
    @Transactional(readOnly = true)
    public ResponseEntity<GroupResponseDto> findById(long id) {
        return repository.findById(id)
                .map(group -> {
                    LocalDate today = LocalDate.now();
                    if (group.getStatus() == GroupStatus.ACTIVE && group.getEndDate().isBefore(today)) {
                        group.setStatus(GroupStatus.COMPLETED);
                        repository.save(group);
                    }
                    return toResponseDto(group);
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // LISTAR POR CAMPUS - MÉTODO FALTANTE
    @Transactional(readOnly = true)
    public ResponseEntity<List<GroupResponseDto>> findGroupsByCampus(long campusId) {
        List<GroupEntity> groups = repository.findAll().stream()
                .filter(group -> group.getCareer().getCampus().getId() == campusId)
                .toList();

        updateGroupStatusBasedOnDates(groups);

        if (groups.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<GroupResponseDto> dtos = groups.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // CREAR NUEVO GRUPO
    @Transactional
    public ResponseEntity<GroupResponseDto> create(GroupRequestDto dto) {
        GroupEntities entities = findAndValidateEntities(dto);

        validateGroupTiming(dto, null);
        validateCurriculumDuration(LocalDate.parse(dto.startDate()), LocalDate.parse(dto.endDate()), entities.curriculum());

        GroupEntity group = new GroupEntity();
        populateFromDto(group, dto, entities.teacher(), entities.career(), entities.curriculum());

        group.setStatus(GroupStatus.ACTIVE);

        if (LocalDate.parse(dto.endDate()).isBefore(LocalDate.now())) {
            group.setStatus(GroupStatus.COMPLETED);
        }

        GroupEntity saved = repository.save(group);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponseDto(saved));
    }

    // ACTUALIZAR GRUPO
    @Transactional
    public ResponseEntity<GroupResponseDto> update(long id, GroupRequestDto dto) {
        GroupEntity existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Grupo no encontrado con id " + id
                ));

        GroupEntities entities = findAndValidateEntities(dto);

        validateGroupTiming(dto, id);
        validateCurriculumDuration(LocalDate.parse(dto.startDate()), LocalDate.parse(dto.endDate()), entities.curriculum());

        populateFromDto(existing, dto, entities.teacher(), entities.career(), entities.curriculum());

        GroupEntity updated = repository.save(existing);
        return ResponseEntity.ok(toResponseDto(updated));
    }

    // CAMBIAR ESTADO DEL GRUPO
    @Transactional
    public ResponseEntity<GroupResponseDto> changeStatus(long id, GroupStatus newStatus) {
        GroupEntity group = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Grupo no encontrado con id " + id
                ));

        if (newStatus == GroupStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El estado COMPLETED se asigna automáticamente basándose en las fechas"
            );
        }

        group.setStatus(newStatus);
        GroupEntity updated = repository.save(group);
        return ResponseEntity.ok(toResponseDto(updated));
    }

    // ELIMINAR
    @Transactional
    public ResponseEntity<Void> delete(long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}