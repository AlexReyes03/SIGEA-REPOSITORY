package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.GroupEntity;
import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.GroupStudentDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.StudentGroupCheckDto;
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

    /**
     * Convierte GroupStudentEntity a GroupStudentDto con información completa
     */
    private GroupStudentDto toDto(GroupStudentEntity gs) {
        var user = gs.getStudent();
        String fullName = user.getName()
                + " "
                + user.getPaternalSurname()
                + (user.getMaternalSurname() != null ? " " + user.getMaternalSurname() : "");

        return new GroupStudentDto(
                gs.getId().getGroupId(),
                gs.getId().getStudentId(),
                fullName,
                user.getEmail() != null ? user.getEmail() : "",
                user.getPrimaryRegistrationNumber() != null ? user.getPrimaryRegistrationNumber() : "",
                user.getAdditionalEnrollmentsCount()
        );
    }

    //Inscribe un estudiante en un grupo.
    @Transactional
    public GroupStudentEntity enroll(GroupStudentDto dto) {
        long groupId   = dto.groupId();
        long studentId = dto.studentId();
        GroupEntity group = groupRepo.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no existe"));
        UserEntity student = userRepo.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no existe"));

        // Verificar que el estudiante tiene al menos una inscripción activa
        if (student.getPrimaryRegistrationNumber() == null) {
            throw new IllegalArgumentException("El estudiante debe estar inscrito en al menos una carrera");
        }

        Id id = new Id(group.getId(), student.getId());
        if (studentRepo.existsById(id)) {
            throw new IllegalArgumentException("Ya inscrito en este grupo");
        }
        GroupStudentEntity entity = new GroupStudentEntity(group, student);
        return studentRepo.save(entity);
    }

    @Transactional
    public ResponseEntity<?> delete(GroupStudentDto dto) {
        GroupStudentEntity.Id id = new GroupStudentEntity.Id(dto.groupId(), dto.studentId());
        if (!studentRepo.existsById(id)) {
            return responseService.get404Response();
        }
        studentRepo.deleteById(id);
        return responseService.getOkResponse("Inscripción eliminada", null);
    }

    @Transactional(readOnly = true)
    public List<GroupStudentDto> getStudentsInGroup(long groupId) {
        return studentRepo.findByGroupId(groupId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GroupStudentDto> getAllStudentsWithGroup() {
        return studentRepo.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    //Lista todas las inscripciones de un estudiante
    @Transactional(readOnly = true)
    public List<GroupStudentEntity> findByStudent(long studentId) {
        return studentRepo.findByStudentId(studentId);
    }

    @Transactional(readOnly = true)
    public StudentGroupCheckDto checkStudentGroupsInCareer(Long userId, Long careerId) {
        long studentGroupCount = studentRepo.countGroupsByStudentAndCareer(userId, careerId);

        long teacherGroupCount = studentRepo.countGroupsByTeacherAndCareer(userId, careerId);

        long totalGroupCount = studentGroupCount + teacherGroupCount;
        boolean hasActiveGroups = totalGroupCount > 0;

        String careerName = "N/A";
        if (careerId != null) {
            careerName = "Carrera " + careerId;
        }

        return new StudentGroupCheckDto(
                userId,
                careerId,
                hasActiveGroups,
                totalGroupCount,
                careerName
        );
    }

    @Transactional(readOnly = true)
    public List<GroupStudentEntity> findByStudentAndCareer(Long studentId, Long careerId) {
        return studentRepo.findByStudentIdAndCareerId(studentId, careerId);
    }
}