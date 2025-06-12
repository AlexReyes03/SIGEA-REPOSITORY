package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.*;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.QualificationDto;
import com.utez.edu.sigeabackend.modules.repositories.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class QualificationService {
    private final QualificationRepository qualificationRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final SubjectRepository subjectRepository;
    private final GroupStudentRepository groupStudentRepository;

    public QualificationService(QualificationRepository qualificationRepository,
                                UserRepository userRepository,
                                GroupRepository groupRepository,
                                SubjectRepository subjectRepository,
                                GroupStudentRepository groupStudentRepository) {
        this.qualificationRepository = qualificationRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.subjectRepository = subjectRepository;
        this.groupStudentRepository = groupStudentRepository;
    }

    private QualificationDto toDto(QualificationEntity q) {
        return new QualificationDto(
                q.getId(),
                q.getStudent().getId(),
                q.getGroup().getId(),
                q.getSubject().getId(),
                q.getTeacher() != null ? q.getTeacher().getId() : null,
                q.getGrade(),
                q.getDate()
        );
    }

    public ResponseEntity<List<QualificationDto>> findAll() {
        var list = qualificationRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<QualificationDto> findById(long id) {
        return qualificationRepository.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    public ResponseEntity<List<QualificationDto>> findByStudent(long studentId) {
        var list = qualificationRepository.findByStudentId(studentId)
                .stream()
                .map(this::toDto)
                .toList();
        if (list.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<List<QualificationDto>> findBySubject(long subjectId) {
        var list = qualificationRepository.findBySubjectId(subjectId)
                .stream()
                .map(this::toDto)
                .toList();
        if (list.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(list);
    }

    @Transactional
    public ResponseEntity<QualificationDto> save(QualificationDto dto) {
        // Validar existencia de entidades referenciadas
        UserEntity student = userRepository.findById(dto.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estudiante no existe"));
        GroupEntity group = groupRepository.findById(dto.groupId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grupo no existe"));
        SubjectEntity subject = subjectRepository.findById(dto.subjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Materia no existe"));
        UserEntity teacher = null;
        if (dto.teacherId() != null)
            teacher = userRepository.findById(dto.teacherId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Docente no existe"));

        // Validar inscripción del estudiante al grupo
        if (!groupStudentRepository.existsById(new GroupStudentEntity.Id(group.getId(), student.getId()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El estudiante no está inscrito en el grupo");
        }

        // Guardar la calificación
        QualificationEntity qualification = new QualificationEntity();
        qualification.setStudent(student);
        qualification.setGroup(group);
        qualification.setSubject(subject);
        qualification.setTeacher(teacher);
        qualification.setGrade(dto.grade());
        qualification.setDate(new Date());

        var saved = qualificationRepository.save(qualification);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @Transactional
    public ResponseEntity<QualificationDto> update(long id, QualificationDto dto) {
        QualificationEntity existing = qualificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Calificación no encontrada"));

        if (dto.grade() != null) existing.setGrade(dto.grade());
        if (dto.teacherId() != null) {
            UserEntity teacher = userRepository.findById(dto.teacherId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Docente no existe"));
            existing.setTeacher(teacher);
        }
        existing.setDate(new Date());

        var saved = qualificationRepository.save(existing);
        return ResponseEntity.ok(toDto(saved));
    }

    @Transactional
    public ResponseEntity<Void> delete(long id) {
        if (!qualificationRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        qualificationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
