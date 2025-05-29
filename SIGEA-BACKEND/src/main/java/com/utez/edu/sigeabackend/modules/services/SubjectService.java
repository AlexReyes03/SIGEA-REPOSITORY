package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.SubjectEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.ModuleRepository;
import com.utez.edu.sigeabackend.modules.repositories.SubjectRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubjectService {
    private final SubjectRepository subjectRepository;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final CustomResponseEntity responseService;

    public SubjectService(SubjectRepository subjectRepository, ModuleRepository moduleRepository, UserRepository userRepository, CustomResponseEntity responseService) {
        this.subjectRepository = subjectRepository;
        this.moduleRepository = moduleRepository;
        this.userRepository = userRepository;
        this.responseService = responseService;
    }

    public ResponseEntity<?> findAll() {
        List<SubjectEntity> list = subjectRepository.findAll();
        if (list.isEmpty()) {
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Materias encontradas", list);
    }

    public ResponseEntity<?> findById(long id) {
        SubjectEntity subject = subjectRepository.findById(id).orElse(null);
        if (subject == null) {
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Materia encontrada", subject);
    }

    public ResponseEntity<?> findByModuleId(Long moduleId) {
        List<SubjectEntity> subjects = subjectRepository.findByModuleId(moduleId);
        if (subjects.isEmpty()) {
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Materias encontradas para el módulo", subjects);
    }

    public ResponseEntity<?> findByTeacherId(Long teacherId) {
        List<SubjectEntity> subjects = subjectRepository.findByTeacherId(teacherId);
        if (subjects.isEmpty()) {
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Materias encontradas para el docente", subjects);
    }

    public ResponseEntity<?> create(SubjectEntity subject, Long moduleId, Long teacherId) {
        ModuleEntity module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) {
            return responseService.get404Response();
        }
        UserEntity teacher = userRepository.findById(teacherId).orElse(null);
        if (teacher == null) {
            return responseService.get404Response();
        }
        subject.setModule(module);
        subject.setTeacher(teacher);
        subjectRepository.save(subject);
        return responseService.get201Response("Materia creada");
    }

    public ResponseEntity<?> update(long id, SubjectEntity subject, Long moduleId, Long teacherId) {
        SubjectEntity existing = subjectRepository.findById(id).orElse(null);
        if (existing == null) {
            return responseService.get404Response();
        }
        ModuleEntity module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) {
            return responseService.get404Response();
        }
        UserEntity teacher = userRepository.findById(teacherId).orElse(null);
        if (teacher == null) {
            return responseService.get404Response();
        }
        existing.setName(subject.getName());
        existing.setWeeks(subject.getWeeks());
        existing.setModule(module);
        existing.setTeacher(teacher);
        subjectRepository.save(existing);
        return responseService.getOkResponse("Materia actualizada", existing);
    }

    public ResponseEntity<?> delete(long id) {
        SubjectEntity existing = subjectRepository.findById(id).orElse(null);
        if (existing == null) {
            return responseService.get404Response();
        }
        subjectRepository.deleteById(id);
        return responseService.getOkResponse("Materia eliminada", null);
    }
}
