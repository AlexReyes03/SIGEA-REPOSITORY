package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.QualificationEntity;
import com.utez.edu.sigeabackend.modules.entities.SubjectEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.QualificationRepository;
import com.utez.edu.sigeabackend.modules.repositories.SubjectRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class QualificationService {
    private final QualificationRepository repository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public QualificationService(QualificationRepository repository, SubjectRepository subjectRepository,
                                UserRepository userRepository) {
        this.repository = repository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

    public ResponseEntity<List<QualificationEntity>> findAll() {
        List<QualificationEntity> list = repository.findAll();
        if (list.isEmpty())
            return ResponseEntity.ok(list);
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<QualificationEntity> findById(long id) {
        Optional<QualificationEntity> optional = repository.findById(id);
        return optional.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    public ResponseEntity<List<QualificationEntity>> findByStudent(long studentId) {
        List<QualificationEntity> list = repository.findByStudentId(studentId);
        if (list.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<List<QualificationEntity>> findBySubject(long subjectId) {
        List<QualificationEntity> list = repository.findBySubjectId(subjectId);
        if (list.isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        return ResponseEntity.ok(list);
    }

    public ResponseEntity<QualificationEntity> save(QualificationEntity qualification, long subjectId, long studentId) {
        Optional<SubjectEntity> subjectOpt = subjectRepository.findById(subjectId);
        Optional<UserEntity> studentOpt = userRepository.findById(studentId);

        if (subjectOpt.isEmpty() || studentOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        qualification.setSubject(subjectOpt.get());
        qualification.setStudent(studentOpt.get());
        qualification.setDate(new Date());
        QualificationEntity saved = repository.save(qualification);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    public ResponseEntity<QualificationEntity> update(long id, QualificationEntity updatedQualification) {
        Optional<QualificationEntity> optional = repository.findById(id);
        if (optional.isPresent()) {
            QualificationEntity qualification = optional.get();
            qualification.setValue(updatedQualification.getValue());
            qualification.setDate(new Date());
            QualificationEntity saved = repository.save(qualification);
            return ResponseEntity.ok(saved);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    public ResponseEntity<Void> delete(long id) {
        Optional<QualificationEntity> optional = repository.findById(id);
        if (optional.isPresent()) {
            repository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

}
