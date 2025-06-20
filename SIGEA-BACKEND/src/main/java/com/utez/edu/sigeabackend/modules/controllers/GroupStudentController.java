package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.GroupStudentDto;
import com.utez.edu.sigeabackend.modules.services.GroupStudentService;
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

    // Inscribir un estudiante en un grupo (JSON con { groupId, studentId })
    @PostMapping("/enroll")
    public ResponseEntity<?> enrollStudent(@RequestBody GroupStudentDto dto) {
        try {
            GroupStudentEntity saved = service.enroll(dto);
            GroupStudentDto response = new GroupStudentDto(
                    saved.getId().getGroupId(),
                    saved.getId().getStudentId(),
                    saved.getStudent().getName()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // Eliminar la inscripción
    @DeleteMapping("/remove")
    public ResponseEntity<?> removeStudent(@RequestBody GroupStudentDto dto) {
        return service.delete(dto);
    }

    // Listados sin cambios
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
}
