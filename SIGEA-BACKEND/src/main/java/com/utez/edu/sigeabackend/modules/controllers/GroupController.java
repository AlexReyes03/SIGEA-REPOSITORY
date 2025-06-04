package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.GroupRequestDto;
import com.utez.edu.sigeabackend.modules.entities.dto.groupDtos.GroupResponseDto;
import com.utez.edu.sigeabackend.modules.services.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/groups")
public class GroupController {

    private final GroupService service;

    public GroupController(GroupService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<GroupResponseDto>> findAll() {
        return service.findAllGroups();
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<GroupResponseDto>> findByTeacher(@PathVariable long teacherId) {
        return service.findGroupsByTeacher(teacherId);
    }

    @GetMapping("/career/{careerId}")
    public ResponseEntity<List<GroupResponseDto>> findByCareer(@PathVariable long careerId) {
        return service.findGroupsByCareer(careerId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponseDto> findById(@PathVariable long id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<GroupResponseDto> create(@RequestBody GroupRequestDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GroupResponseDto> update(
            @PathVariable("id") long id,
            @RequestBody GroupRequestDto dto
    ) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) {
        return service.delete(id);
    }
}
