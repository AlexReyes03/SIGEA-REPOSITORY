package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.GroupEntity;
import com.utez.edu.sigeabackend.modules.services.GroupService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sigea/api/groups")
public class GroupController {

    private final GroupService service;
    private final CustomResponseEntity responseService;

    public GroupController(GroupService service, CustomResponseEntity responseService) {
        this.service = service;
        this.responseService = responseService;
    }

    @GetMapping
    public ResponseEntity<?> findAll(){
        return service.findAllGroups();
    }
    //Consulta por ID del maestro
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> findByTeacher(@PathVariable long teacherId){
        return service.findGroupsByTeacher(teacherId);
    }
    //Consulta por ID de la carrera
    @GetMapping("/career/{careerId}")
    public ResponseEntity<?> findByCareer(@PathVariable long careerId){
        return service.findGroupsByCareer(careerId);
    }

    //Consulta por ID del grupo
    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable long id){
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody GroupEntity group){
        return service.create(group);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGroup(@PathVariable("id") long id, @RequestBody GroupEntity updateGroup){
        return service.update(id, updateGroup);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable("id") long id){
        return service.delete(id);
    }
}
