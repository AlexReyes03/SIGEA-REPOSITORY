package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.QualificationEntity;
import com.utez.edu.sigeabackend.modules.entities.SubjectEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.QualificationRepository;
import com.utez.edu.sigeabackend.modules.repositories.SubjectRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
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
    private final CustomResponseEntity responseService;

    public QualificationService(QualificationRepository repository, SubjectRepository subjectRepository,
                                UserRepository userRepository, CustomResponseEntity responseService) {
        this.repository = repository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.responseService = responseService;
    }

    public ResponseEntity<?> findAll() {
        List<QualificationEntity> list = repository.findAll();
        if (list.isEmpty())
            return responseService.get404Response();
        return responseService.getOkResponse("Calificaciones encontradas", list);
    }

    public ResponseEntity<?> findById(long id) {
        Optional<QualificationEntity> optional = repository.findById(id);
        if (optional.isPresent())
            return responseService.getOkResponse("Calificación encontrada", optional.get());
        return responseService.get404Response();
    }

    public ResponseEntity<?> findByStudent(long studentId) {
        List<QualificationEntity> list = repository.findByStudentId(studentId);
        if (list.isEmpty())
            return responseService.get404Response();
        return responseService.getOkResponse("Calificaciones del estudiante", list);
    }

    public ResponseEntity<?> findBySubject(long subjectId) {
        List<QualificationEntity> list = repository.findBySubjectId(subjectId);
        if (list.isEmpty())
            return responseService.get404Response();
        return responseService.getOkResponse("Calificaciones por materia", list);
    }

    public ResponseEntity<?> save(QualificationEntity qualification, long subjectId, long studentId) {
        Optional<SubjectEntity> subjectOpt = subjectRepository.findById(subjectId);
        Optional<UserEntity> studentOpt = userRepository.findById(studentId);

        if (subjectOpt.isEmpty() || studentOpt.isEmpty()) {
            return responseService.get400Response();
        }

        qualification.setSubject(subjectOpt.get());
        qualification.setStudent(studentOpt.get());
        qualification.setDate(new Date());
        repository.save(qualification);

        return responseService.get201Response("Calificación registrada");
    }

    public ResponseEntity<?> update(long id, QualificationEntity updatedQualification) {
        Optional<QualificationEntity> optional = repository.findById(id);
        if (optional.isPresent()) {
            QualificationEntity qualification = optional.get();
            qualification.setValue(updatedQualification.getValue());
            qualification.setDate(new Date());
            repository.save(qualification);
            return responseService.getOkResponse("Calificación actualizada", qualification);
        } else {
            return responseService.get404Response();
        }
    }

    public ResponseEntity<?> delete(long id) {
        Optional<QualificationEntity> optional = repository.findById(id);
        if (optional.isPresent()) {
            repository.deleteById(id);
            return responseService.getOkResponse("Calificación eliminada", null);
        } else {
            return responseService.get404Response();
        }
    }
}
