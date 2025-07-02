package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.CampusEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CampusDto;
import com.utez.edu.sigeabackend.modules.services.CampusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/campus")
public class CampusController {

    private final CampusService campusService;

    public CampusController(CampusService campusService) {
        this.campusService = campusService;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return campusService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable long id) {
        return campusService.findById(id);
    }

    @GetMapping("/supervised-by/{userId}")
    public ResponseEntity<List<CampusDto>> getAllSupervisedByUser(
            @PathVariable Long userId,
            @RequestParam Long userCampusId) {
        return campusService.findAllSupervisedByUser(userId, userCampusId);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CampusEntity campus) {
        return campusService.create(campus);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable long id, @RequestBody CampusEntity campus) {
        return campusService.update(id, campus);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id) {
        return campusService.delete(id);
    }
}