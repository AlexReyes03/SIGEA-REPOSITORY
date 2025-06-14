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

import java.util.List;
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
                g.getTeacher().getId(),
                g.getTeacher().getName() + " " + g.getTeacher().getPaternalSurname(),
                g.getCareer().getId(),
                g.getCareer().getName(),
                g.getCurriculum().getId(),
                g.getCurriculum().getName()
        );
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
        target.setStartTime(java.time.LocalTime.parse(dto.startTime()));
        target.setEndTime(java.time.LocalTime.parse(dto.endTime()));
        target.setWeekDay(WeekDays.valueOf(dto.weekDay()));
        target.setTeacher(teacher);
        target.setCareer(careerEntity);
        target.setCurriculum(curriculum);
    }

    // LISTAR TODOS
    @Transactional(readOnly = true)
    public ResponseEntity<List<GroupResponseDto>> findAllGroups() {
        List<GroupEntity> groups = repository.findAll();
        if (groups.isEmpty()) {
            return ResponseEntity.ok(null);
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
        if (groups.isEmpty()) {
            return ResponseEntity.ok(null);
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
        if (groups.isEmpty()) {
            return ResponseEntity.ok(null);
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
                .map(this::toResponseDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.OK).build());
    }

    // CREAR NUEVO GRUPO
    @Transactional
    public ResponseEntity<GroupResponseDto> create(GroupRequestDto dto) {
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

        GroupEntity g = new GroupEntity();
        populateFromDto(g, dto, teacher, careerEntity, curriculum);

        GroupEntity saved = repository.save(g);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponseDto(saved));
    }

    // ACTUALIZAR GRUPO
    @Transactional
    public ResponseEntity<GroupResponseDto> update(long id, GroupRequestDto dto) {
        GroupEntity existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Grupo no encontrado con id " + id
                ));
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

        GroupEntity g = new GroupEntity();
        populateFromDto(g, dto, teacher, careerEntity, curriculum);

        GroupEntity updated = repository.save(existing);
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
