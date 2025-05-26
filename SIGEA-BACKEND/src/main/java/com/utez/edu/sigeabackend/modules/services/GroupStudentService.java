package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.GroupEntity;
import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.GroupRepository;
import com.utez.edu.sigeabackend.modules.repositories.GroupStudentRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity.Id;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class GroupStudentService {
    private final GroupStudentRepository studentRepo;
    private final GroupRepository groupRepo;
    private final UserRepository userRepo;
    private final CustomResponseEntity responseService;

    public GroupStudentService(GroupStudentRepository studentRepo, GroupRepository groupRepo, UserRepository userRepo, CustomResponseEntity responseService){
        this.studentRepo = studentRepo;
        this.groupRepo = groupRepo;
        this.userRepo = userRepo;
        this.responseService = responseService;
    }

    //Inscribe un estudiante en un grupo.
    @Transactional
    public GroupStudentEntity enroll(long groupId, long studentId) {
        GroupEntity group = groupRepo.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no existe"));
        UserEntity student = userRepo.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no existe"));
        Id id = new Id(group.getId(), student.getId());
        if (studentRepo.existsById(id)) {
            throw new IllegalArgumentException("Ya inscrito en este grupo");
        }
        GroupStudentEntity entity = new GroupStudentEntity(group, student);
        return studentRepo.save(entity);
    }

    //Elimina la inscripción de un estudiante
    @Transactional
    public ResponseEntity<?> deleteById(long groupId, long studentId) {
        GroupStudentEntity.Id id = new GroupStudentEntity.Id(groupId, studentId);
        if (!studentRepo.existsById(id)) {
            return responseService.get404Response();
        }
        studentRepo.deleteById(id);
        return responseService.getOkResponse("Inscripción eliminada", null);
    }

    //Lista todas las inscripciones de un grupo
    @Transactional(readOnly = true)
    public List<GroupStudentEntity> findByGroup(long groupId) {
        return studentRepo.findByGroupId(groupId);
    }

    //Lista todas las inscripciones de un estudiant
    @Transactional(readOnly = true)
    public List<GroupStudentEntity> findByStudent(long studentId) {
        return studentRepo.findByStudentId(studentId);
    }
}
