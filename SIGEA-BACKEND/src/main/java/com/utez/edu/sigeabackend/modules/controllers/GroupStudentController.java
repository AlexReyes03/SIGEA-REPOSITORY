package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.GroupStudentDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.StudentGroupCheckDto;
import com.utez.edu.sigeabackend.modules.services.GroupStudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/group-students")
public class GroupStudentController {
    private final GroupStudentService service;

    public GroupStudentController(GroupStudentService service){
        this.service = service;
    }

    // Inscribir un estudiante en un grupo (Necesita un JSON con { groupId, studentId })
    @PostMapping("/enroll")
    public ResponseEntity<?> enrollStudent(@RequestBody GroupStudentDto dto) {
        try {
            GroupStudentEntity saved = service.enroll(dto);
            var user = saved.getStudent();
            String fullName = user.getName() + " " + user.getPaternalSurname() +
                    (user.getMaternalSurname() != null ? " " + user.getMaternalSurname() : "");

            GroupStudentDto response = new GroupStudentDto(
                    saved.getId().getGroupId(),
                    saved.getId().getStudentId(),
                    fullName,
                    user.getEmail() != null ? user.getEmail() : "",
                    user.getPrimaryRegistrationNumber() != null ? user.getPrimaryRegistrationNumber() : "",
                    user.getAdditionalEnrollmentsCount()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Eliminar la inscripción
    @DeleteMapping("/remove")
    public ResponseEntity<?> removeStudent(@RequestBody GroupStudentDto dto) {
        return service.delete(dto);
    }

    // Listados
    @GetMapping("/by-student/{studentId}")
    public ResponseEntity<?> getByStudent(@PathVariable long studentId){
        List<GroupStudentEntity> list = service.findByStudent(studentId);
        if (list.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/students-with-group")
    public ResponseEntity<List<GroupStudentDto>> getStudentsWithGroup() {
        List<GroupStudentDto> list = service.getAllStudentsWithGroup();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<GroupStudentDto>> getByGroup(@PathVariable long groupId) {
        List<GroupStudentDto> list = service.getStudentsInGroup(groupId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/check-student-groups/{studentId}/career/{careerId}")
    public ResponseEntity<StudentGroupCheckDto> hasGroupsInCareer(
            @PathVariable Long studentId,
            @PathVariable Long careerId) {
        try {
            StudentGroupCheckDto response = service.checkStudentGroupsInCareer(studentId, careerId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}