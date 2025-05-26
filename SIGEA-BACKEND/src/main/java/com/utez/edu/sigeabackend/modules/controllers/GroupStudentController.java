package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.GroupStudentEntity;
import com.utez.edu.sigeabackend.modules.services.GroupStudentService;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/group-students")
public class GroupStudentController {
    private final GroupStudentService service;
    private final GroupStudentService groupStudentService;

    public GroupStudentController(GroupStudentService service, GroupStudentService groupStudentService){
        this.service = service;
        this.groupStudentService = groupStudentService;
    }

    //Endpoint para Inscribir un estudiante en un grupo
    @PostMapping("/enroll")
    public ResponseEntity<?> enrollStudent(
            @RequestParam long groupId,
            @RequestParam long studentId
    ) {
      try{
          GroupStudentEntity enrollment = service.enroll(groupId, studentId);
          return ResponseEntity.ok(enrollment);
      }catch (IllegalArgumentException ex){
          return ResponseEntity.badRequest().body(ex.getMessage());
      }
    }

    //Endpoint para eliminar la inscripcion de un estudiante
    @DeleteMapping("/remove")
    public ResponseEntity<?> removeStudent(
            @RequestParam long groupId,
            @RequestParam long studentId
    ){
        return service.deleteById(groupId, studentId);
    }

    //Endpoint para obtener todas las inscripciones de un estudiante
    @GetMapping("/by-student/{studentId}")
    public ResponseEntity<?> getByStudent(@PathVariable long studentId){
        List<GroupStudentEntity> list = service.findByStudent(studentId);
        if(list.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(list);
    }
}
