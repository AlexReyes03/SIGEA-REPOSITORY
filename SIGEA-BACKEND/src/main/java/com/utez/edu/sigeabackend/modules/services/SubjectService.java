package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.QualificationEntity;
import com.utez.edu.sigeabackend.modules.entities.SubjectEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.ModuleRepository;
import com.utez.edu.sigeabackend.modules.repositories.SubjectRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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

    public ResponseEntity<List<SubjectEntity>> findAll() {
        List<SubjectEntity> list = subjectRepository.findAll();
        if (list.isEmpty()) {
            return ResponseEntity.ok(list);
        }
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<SubjectEntity> findById(long id) {
        Optional<SubjectEntity> optional = subjectRepository.findById(id);
       return optional.map(ResponseEntity::ok)
               .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    public ResponseEntity<List<SubjectEntity>> findByModuleId(long moduleId) {
        List<SubjectEntity> subjects = subjectRepository.findByModuleId(moduleId);
        if (subjects.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        return ResponseEntity.ok(subjects);
    }

    public ResponseEntity<List<SubjectEntity>> findByTeacherId(long teacherId) {
        List<SubjectEntity> subjects = subjectRepository.findByTeacherId(teacherId);
        if (subjects.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        return ResponseEntity.ok(subjects);
    }

    public ResponseEntity<SubjectEntity> save(SubjectEntity subject) {
        Optional<ModuleEntity> moduleOpt = moduleRepository.findById(subject.getModule().getId());
        Optional<UserEntity> teacherOpt = userRepository.findById(subject.getTeacher().getId());

        if (moduleOpt.isEmpty() || teacherOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        subject.setModule(moduleOpt.get());
        subject.setTeacher(teacherOpt.get());
        SubjectEntity saved = subjectRepository.save(subject);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    public ResponseEntity<?> update(long id, SubjectEntity subject, long moduleId, long teacherId) {
        Optional<SubjectEntity> optional = subjectRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        SubjectEntity existing = optional.get();

        ModuleEntity module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) {
            return ResponseEntity.badRequest().body("Módulo no encontrado");
        }


        UserEntity teacher = userRepository.findById(teacherId).orElse(null);
        if (teacher == null) {
            return ResponseEntity.badRequest().body("Docente no encontrado");
        }

        existing.setName(subject.getName());
        existing.setWeeks(subject.getWeeks());
        existing.setModule(module);
        existing.setTeacher(teacher);

        subjectRepository.save(existing);
        return ResponseEntity.ok(existing);
    }


    public ResponseEntity<Void> delete(long id) {
        Optional<SubjectEntity> optional = subjectRepository.findById(id);
        if (optional.isPresent()) {
            subjectRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
