package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.*;
import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.*;
import com.utez.edu.sigeabackend.modules.repositories.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class StudentTransferService {

    private final GroupStudentRepository groupStudentRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final QualificationRepository qualificationRepository;

    public StudentTransferService(
            GroupStudentRepository groupStudentRepository,
            GroupRepository groupRepository,
            UserRepository userRepository,
            QualificationRepository qualificationRepository) {
        this.groupStudentRepository = groupStudentRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.qualificationRepository = qualificationRepository;
    }

    /**
     * Valida si se pueden copiar calificaciones entre dos grupos
     */
    @Transactional(readOnly = true)
    public ResponseEntity<QualificationCopyValidationDto> validateQualificationCopy(Long sourceGroupId, Long targetGroupId) {
        GroupEntity sourceGroup = groupRepository.findById(sourceGroupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grupo de origen no encontrado"));

        GroupEntity targetGroup = groupRepository.findById(targetGroupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grupo de destino no encontrado"));

        Long sourceCurriculumId = sourceGroup.getCurriculum().getId();
        Long targetCurriculumId = targetGroup.getCurriculum().getId();
        boolean sameCurriculum = sourceCurriculumId.equals(targetCurriculumId);

        String reason = sameCurriculum
                ? "Los grupos tienen el mismo plan de estudios"
                : "Los grupos tienen planes de estudio diferentes";

        QualificationCopyValidationDto validation = new QualificationCopyValidationDto(
                sameCurriculum,
                reason,
                sourceCurriculumId,
                targetCurriculumId,
                sameCurriculum
        );

        return ResponseEntity.ok(validation);
    }

    /**
     * Transfiere múltiples estudiantes entre grupos con opción de copiar calificaciones
     */
    @Transactional
    public ResponseEntity<TransferResultDto> transferStudents(TransferStudentsDto dto) {
        // Validar grupos
        GroupEntity sourceGroup = groupRepository.findById(dto.sourceGroupId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grupo de origen no encontrado"));

        GroupEntity targetGroup = groupRepository.findById(dto.targetGroupId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grupo de destino no encontrado"));

        // Validar si se pueden copiar calificaciones
        boolean canCopyQualifications = false;
        if (dto.copyQualifications()) {
            Long sourceCurriculumId = sourceGroup.getCurriculum().getId();
            Long targetCurriculumId = targetGroup.getCurriculum().getId();
            canCopyQualifications = sourceCurriculumId.equals(targetCurriculumId);
        }

        List<StudentTransferResult> results = new ArrayList<>();
        int successCount = 0;

        for (Long studentId : dto.studentIds()) {
            try {
                StudentTransferResult result = transferSingleStudent(
                        studentId, sourceGroup, targetGroup, canCopyQualifications);
                results.add(result);
                if (result.transferSuccess()) {
                    successCount++;
                }
            } catch (Exception e) {
                results.add(new StudentTransferResult(
                        studentId,
                        "Usuario " + studentId,
                        false,
                        false,
                        0,
                        "Error: " + e.getMessage()
                ));
            }
        }

        String message = String.format("Transferencia completada: %d/%d estudiantes transferidos exitosamente",
                successCount, dto.studentIds().size());

        TransferResultDto result = new TransferResultDto(results, message, successCount > 0);

        return ResponseEntity.ok(result);
    }

    /**
     * Transfiere un solo estudiante entre grupos
     */
    private StudentTransferResult transferSingleStudent(
            Long studentId, GroupEntity sourceGroup, GroupEntity targetGroup, boolean copyQualifications) {

        UserEntity student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no encontrado: " + studentId));

        String studentName = student.getName() + " " + student.getPaternalSurname();

        // 1. Marcar como inactivo en el grupo de origen
        GroupStudentEntity.Id sourceId = new GroupStudentEntity.Id(sourceGroup.getId(), studentId);
        GroupStudentEntity sourceEnrollment = groupStudentRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Estudiante no está inscrito en el grupo de origen"));

        sourceEnrollment.markAsInactive();
        groupStudentRepository.save(sourceEnrollment);

        // 2. Verificar si ya existe inscripción en el grupo destino
        GroupStudentEntity.Id targetId = new GroupStudentEntity.Id(targetGroup.getId(), studentId);
        GroupStudentEntity targetEnrollment = groupStudentRepository.findById(targetId).orElse(null);

        if (targetEnrollment != null) {
            // Ya existe, solo reactivar
            targetEnrollment.reactivate();
            groupStudentRepository.save(targetEnrollment);
        } else {
            // Crear nueva inscripción
            targetEnrollment = new GroupStudentEntity(targetGroup, student);
            groupStudentRepository.save(targetEnrollment);
        }

        // 3. Copiar calificaciones si es necesario y posible
        int qualificationsCopied = 0;
        if (copyQualifications) {
            qualificationsCopied = copyQualificationsBetweenGroups(studentId, sourceGroup.getId(), targetGroup.getId());
        }

        return new StudentTransferResult(
                studentId,
                studentName,
                true,
                copyQualifications && qualificationsCopied > 0,
                qualificationsCopied,
                null
        );
    }

    /**
     * Copia calificaciones de un estudiante entre grupos del mismo curriculum
     */
    private int copyQualificationsBetweenGroups(Long studentId, Long sourceGroupId, Long targetGroupId) {
        // Obtener calificaciones del grupo de origen
        List<QualificationEntity> sourceQualifications = qualificationRepository
                .findByStudentIdAndGroupId(studentId, sourceGroupId);

        int copiedCount = 0;

        for (QualificationEntity sourceQual : sourceQualifications) {
            // Verificar si ya existe una calificación para esta materia en el grupo destino
            boolean existsInTarget = qualificationRepository
                    .existsByStudentIdAndGroupIdAndSubjectId(studentId, targetGroupId, sourceQual.getSubject().getId());

            if (!existsInTarget) {
                // Crear copia de la calificación para el nuevo grupo
                QualificationEntity newQual = new QualificationEntity();
                newQual.setStudent(sourceQual.getStudent());
                newQual.setGroup(groupRepository.findById(targetGroupId).orElseThrow());
                newQual.setSubject(sourceQual.getSubject());
                newQual.setTeacher(sourceQual.getTeacher());
                newQual.setGrade(sourceQual.getGrade());
                newQual.setDate(new Date()); // Fecha actual para la transferencia

                qualificationRepository.save(newQual);
                copiedCount++;
            }
        }

        return copiedCount;
    }

    /**
     * Obtiene el historial completo de inscripciones de un estudiante
     */
    @Transactional(readOnly = true)
    public ResponseEntity<List<GroupStudentHistoryDto>> getStudentGroupHistory(Long studentId) {
        List<GroupStudentEntity> history = groupStudentRepository.findAllByStudentId(studentId);

        List<GroupStudentHistoryDto> historyDtos = history.stream()
                .map(this::toHistoryDto)
                .toList();

        return ResponseEntity.ok(historyDtos);
    }

    private GroupStudentHistoryDto toHistoryDto(GroupStudentEntity gs) {
        GroupEntity group = gs.getGroup();
        return new GroupStudentHistoryDto(
                gs.getId().getGroupId(),
                group.getName(),
                group.getCareer().getName(),
                group.getCurriculum().getName(),
                gs.getEntryDate(),
                gs.getExitDate(),
                gs.getStatus().name(),
                gs.isActive()
        );
    }
}