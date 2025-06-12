package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.services.CurriculumService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sigea/api/careers")
public class CurriculumController {
    private final CurriculumService curriculumService;

    public CurriculumController(CurriculumService curriculumService) {
        this.curriculumService = curriculumService;
    }

    @GetMapping("/{careerId}/curriculums")
    public List<CurriculumDto> getCurriculumsByCareer(@PathVariable Long careerId) {
        return curriculumService.findByCareerId(careerId);
    }
}