package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.ModuleDto;
import com.utez.edu.sigeabackend.modules.services.ModuleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/modules")
public class ModuleController {

    private final ModuleService moduleService;

    public ModuleController(ModuleService moduleService) {
        this.moduleService = moduleService;
    }

    // GET 
    @GetMapping("/curriculum/{curriculumId}")
    public ResponseEntity<List<ModuleDto>> findByCurriculumId(@PathVariable Long curriculumId) {
        return moduleService.findByCurriculumId(curriculumId);
    }

    // POST
    @PostMapping
    public ResponseEntity<ModuleDto> create(@RequestBody ModuleEntity moduleEntity) {
        try {
            return moduleService.create(moduleEntity);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // PUT
    @PutMapping("/{id}")
    public ResponseEntity<ModuleDto> update(@PathVariable Long id, @RequestBody ModuleEntity moduleEntity) {
        try {
            return moduleService.update(id, moduleEntity);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // DELETE 
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        try {
            return moduleService.delete(id);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
