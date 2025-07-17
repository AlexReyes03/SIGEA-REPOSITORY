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

        // Obtener el careerId del grupo
        Long careerId = gs.getGroup() != null && gs.getGroup().getCareer() != null
                ? gs.getGroup().getCareer().getId()
                : null;

        return new GroupStudentDto(
                gs.getId().getGroupId(),
                gs.getId().getStudentId(),
                fullName,
                user.getEmail() != null ? user.getEmail() : "",
                user.getPrimaryRegistrationNumber() != null ? user.getPrimaryRegistrationNumber() : "",
                user.getAdditionalEnrollmentsCount(),
                careerId
        );
    }

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

        GroupStudentEntity existingEntity = studentRepo.findById(id).orElse(null);
        if (existingEntity != null) {
            if (existingEntity.isActive()) {
                throw new IllegalArgumentException("Ya inscrito en este grupo");
            } else {
                // Reactivar inscripción existente
                existingEntity.reactivate();
                return studentRepo.save(existingEntity);
            }
        }

        // Crear nueva inscripción
        GroupStudentEntity entity = new GroupStudentEntity(group, student);
        return studentRepo.save(entity);
    }

    @Transactional
    public ResponseEntity<?> delete(GroupStudentDto dto) {
        GroupStudentEntity.Id id = new GroupStudentEntity.Id(dto.groupId(), dto.studentId());
        GroupStudentEntity entity = studentRepo.findById(id).orElse(null);

        if (entity == null) {
            return responseService.get404Response();
        }

        if (entity.isInactive()) {
            return responseService.get400Response();
        }

        // 🆕 Marcar como inactivo en lugar de eliminar
        entity.markAsInactive();
        studentRepo.save(entity);

        return responseService.getOkResponse("Inscripción eliminada", null);
    }

    @Transactional(readOnly = true)
    public List<GroupStudentDto> getStudentsInGroup(long groupId) {
        return studentRepo.findActiveByGroupId(groupId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GroupStudentDto> getAllStudentsWithGroup() {
        return studentRepo.findAllActiveWithDetails()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GroupStudentEntity> findByStudent(long studentId) {
        return studentRepo.findActiveByStudentId(studentId);
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


    /**
     * Obtiene todas las inscripciones de un estudiante (historial completo)
     */
    @Transactional(readOnly = true)
    public List<GroupStudentEntity> findAllByStudent(long studentId) {
        return studentRepo.findAllByStudentId(studentId);
    }

    /**
     * Verifica si un estudiante está activo en un grupo específico
     */
    @Transactional(readOnly = true)
    public boolean isStudentActiveInGroup(long studentId, long groupId) {
        return studentRepo.isStudentActiveInGroup(studentId, groupId);
    }
}