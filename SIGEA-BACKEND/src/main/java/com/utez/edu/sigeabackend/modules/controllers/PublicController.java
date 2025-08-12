package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.dto.academics.PublicCareerDto;
import com.utez.edu.sigeabackend.modules.services.CareerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/public")
public class PublicController {
    private final CareerService careerService;

    public PublicController(CareerService careerService) {
        this.careerService = careerService;
    }

    /** GET /sigea/api/public/careers/carousel - Obtener carreras con imágenes */
    @GetMapping("/careers/carousel")
    public ResponseEntity<List<PublicCareerDto>> getCareersForCarousel() {
        return careerService.findCareersForCarousel();
    }
}