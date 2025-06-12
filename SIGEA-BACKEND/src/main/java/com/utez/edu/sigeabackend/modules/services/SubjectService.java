package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.SubjectEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.SubjectCreateDto;
import com.utez.edu.sigeabackend.modules.entities.dto.SubjectDTO;
import com.utez.edu.sigeabackend.modules.entities.dto.TeacherDTO;
import com.utez.edu.sigeabackend.modules.repositories.ModuleRepository;
import com.utez.edu.sigeabackend.modules.repositories.SubjectRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.hibernate.Hibernate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SubjectService {
    private final SubjectRepository subjectRepository;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;

    public SubjectService(SubjectRepository subjectRepository, ModuleRepository moduleRepository, UserRepository userRepository) {
        this.subjectRepository = subjectRepository;
        this.moduleRepository = moduleRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SubjectDTO> findAll() {
        try {
            List<SubjectEntity> subjects = subjectRepository.findAll();

            // Forzar la inicialización de las relaciones lazy
            subjects.forEach(this::initializeSubjectRelations);

            return subjects.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener todas las materias: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<SubjectDTO> findById(long id) {
        try {
            if (id <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<SubjectEntity> optional = subjectRepository.findById(id);
            return optional
                    .map(subject -> {
                        initializeSubjectRelations(subject);
                        SubjectDTO dto = mapToDto(subject);
                        return ResponseEntity.ok(dto);
                    })
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
        } catch (Exception e) {
            throw new RuntimeException("Error al buscar materia por ID " + id + ": " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<List<SubjectDTO>> findByModuleId(long moduleId) {
        try {
            if (moduleId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<SubjectEntity> subjects = subjectRepository.findByModuleId(moduleId);
            if (subjects.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }


            subjects.forEach(this::initializeSubjectRelations);

            List<SubjectDTO> subjectDTOS = subjects.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(subjectDTOS);
        } catch (Exception e) {
            throw new RuntimeException("Error al buscar materias por módulo " + moduleId + ": " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<List<SubjectDTO>> findByTeacherId(long teacherId) {
        try {
            if (teacherId <= 0) {
                return ResponseEntity.badRequest().build();
            }

            List<SubjectEntity> subjects = subjectRepository.findByTeacherId(teacherId);
            if (subjects.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }


            subjects.forEach(this::initializeSubjectRelations);

            List<SubjectDTO> subjectDTOS = subjects.stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(subjectDTOS);
        } catch (Exception e) {
            throw new RuntimeException("Error al buscar materias por docente " + teacherId + ": " + e.getMessage(), e);
        }
    }

    @Transactional
    public ResponseEntity<SubjectDTO> save(SubjectCreateDto dto) {
        try {
            if (dto == null || dto.name() == null || dto.name().trim().isEmpty() ||
                    dto.weeks() <= 0 || dto.moduleId() <= 0 || dto.teacherId() <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<ModuleEntity> moduleOpt = moduleRepository.findById(dto.moduleId());
            Optional<UserEntity> teacherOpt = userRepository.findById(dto.teacherId());

            if (moduleOpt.isEmpty() || teacherOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            SubjectEntity subject = new SubjectEntity();
            subject.setName(dto.name().trim());
            subject.setWeeks(dto.weeks());
            subject.setModule(moduleOpt.get());
            subject.setTeacher(teacherOpt.get());

            SubjectEntity saved = subjectRepository.save(subject);


            initializeSubjectRelations(saved);

            SubjectDTO dtoResponse = mapToDto(saved);
            return ResponseEntity.status(HttpStatus.CREATED).body(dtoResponse);

        } catch (Exception e) {
            throw new RuntimeException("Error al guardar la materia: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ResponseEntity<SubjectDTO> update(long id, SubjectCreateDto dto) {
        try {
            if (id <= 0 || dto == null || dto.name() == null || dto.name().trim().isEmpty() ||
                    dto.weeks() <= 0 || dto.moduleId() <= 0 || dto.teacherId() <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<SubjectEntity> optional = subjectRepository.findById(id);
            if (optional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            SubjectEntity existing = optional.get();

            Optional<ModuleEntity> moduleOpt = moduleRepository.findById(dto.moduleId());
            Optional<UserEntity> teacherOpt = userRepository.findById(dto.teacherId());

            if (moduleOpt.isEmpty() || teacherOpt.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            existing.setName(dto.name().trim());
            existing.setWeeks(dto.weeks());
            existing.setModule(moduleOpt.get());
            existing.setTeacher(teacherOpt.get());

            SubjectEntity updated = subjectRepository.save(existing);


            initializeSubjectRelations(updated);

            SubjectDTO dtoResponse = mapToDto(updated);
            return ResponseEntity.ok(dtoResponse);

        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar la materia con ID " + id + ": " + e.getMessage(), e);
        }
    }

    @Transactional
    public ResponseEntity<Void> delete(long id) {
        try {
            if (id <= 0) {
                return ResponseEntity.badRequest().build();
            }

            Optional<SubjectEntity> optional = subjectRepository.findById(id);
            if (optional.isPresent()) {
                subjectRepository.deleteById(id);
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar la materia con ID " + id + ": " + e.getMessage(), e);
        }
    }

    /**
     * Método privado para forzar la inicialización de relaciones lazy
     */
    private void initializeSubjectRelations(SubjectEntity subject) {
        if (subject != null) {
            // Inicializar teacher
            Hibernate.initialize(subject.getTeacher());

            // Inicializar role del teacher
            if (subject.getTeacher() != null) {
                Hibernate.initialize(subject.getTeacher().getRole());
            }

            // Inicializar module si es necesario
            Hibernate.initialize(subject.getModule());
        }
    }

    private SubjectDTO mapToDto(SubjectEntity subject) {
        try {
            if (subject == null) {
                throw new IllegalArgumentException("La entidad Subject no puede ser null");
            }

            UserEntity teacher = subject.getTeacher();
            if (teacher == null) {
                throw new IllegalArgumentException("El docente de la materia no puede ser null");
            }

            if (teacher.getRole() == null) {
                throw new IllegalArgumentException("El rol del docente no puede ser null");
            }

            TeacherDTO teacherDTO = new TeacherDTO(
                    teacher.getId(),
                    teacher.getName(),
                    teacher.getEmail(),
                    teacher.getRole().getRoleName()
            );

            return new SubjectDTO(
                    subject.getId(),
                    subject.getName(),
                    subject.getWeeks(),
                    teacherDTO
            );
        } catch (Exception e) {
            throw new RuntimeException("Error al mapear SubjectEntity a SubjectDTO: " + e.getMessage(), e);
        }
    }
}