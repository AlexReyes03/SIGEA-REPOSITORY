package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.GroupStudentHistoryDto;
import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.QualificationCopyValidationDto;
import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.TransferResultDto;
import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.TransferStudentsDto;
import com.utez.edu.sigeabackend.modules.services.StudentTransferService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/student-transfer")
public class StudentTransferController {

    private final StudentTransferService transferService;

    public StudentTransferController(StudentTransferService transferService) {
        this.transferService = transferService;
    }

    /**
     * Valida si se pueden copiar calificaciones entre dos grupos
     * GET /sigea/api/student-transfer/validate-copy?sourceGroupId=1&targetGroupId=2
     */
    @GetMapping("/validate-copy")
    public ResponseEntity<QualificationCopyValidationDto> validateQualificationCopy(
            @RequestParam Long sourceGroupId,
            @RequestParam Long targetGroupId) {
        return transferService.validateQualificationCopy(sourceGroupId, targetGroupId);
    }

    /**
     * Transfiere múltiples estudiantes entre grupos
     * POST /sigea/api/student-transfer/transfer
     *
     * Body:
     * {
     *   "studentIds": [1, 2, 3],
     *   "sourceGroupId": 1,
     *   "targetGroupId": 2,
     *   "copyQualifications": true
     * }
     */
    @PostMapping("/transfer")
    public ResponseEntity<TransferResultDto> transferStudents(@RequestBody TransferStudentsDto dto) {
        return transferService.transferStudents(dto);
    }

    /**
     * Obtiene el historial completo de inscripciones de un estudiante
     * GET /sigea/api/student-transfer/history/{studentId}
     */
    @GetMapping("/history/{studentId}")
    public ResponseEntity<List<GroupStudentHistoryDto>> getStudentGroupHistory(@PathVariable Long studentId) {
        return transferService.getStudentGroupHistory(studentId);
    }
}