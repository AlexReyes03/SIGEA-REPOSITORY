package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.dto.users.*;
import com.utez.edu.sigeabackend.modules.services.UserCampusSupervisionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sigea/api/supervision")
public class UserCampusSupervisionController {

    private final UserCampusSupervisionService supervisionService;

    public UserCampusSupervisionController(UserCampusSupervisionService supervisionService) {
        this.supervisionService = supervisionService;
    }

    /** POST /sigea/api/supervision/assign - Asignar campus a supervisor */
    @PostMapping("/assign")
    public ResponseEntity<CampusSupervisionDto> assignCampusToSupervisor(
            @Valid @RequestBody AssignCampusToSupervisorDto dto) {
        return supervisionService.assignCampusToSupervisor(dto);
    }

    /** DELETE /sigea/api/supervision/remove - Remover campus de supervisor */
    @DeleteMapping("/remove")
    public ResponseEntity<Void> removeCampusFromSupervisor(
            @Valid @RequestBody RemoveCampusFromSupervisorDto dto) {
        return supervisionService.removeCampusFromSupervisor(dto);
    }

    /** GET /sigea/api/supervision/supervisor/{supervisorId}/campuses - Obtener campus de supervisor */
    @GetMapping("/supervisor/{supervisorId}/campuses")
    public ResponseEntity<SupervisorCampusesResponseDto> getSupervisorCampuses(
            @PathVariable Long supervisorId) {
        return supervisionService.getSupervisorCampuses(supervisorId);
    }

    /** GET /sigea/api/supervision/campus/{campusId}/supervisors - Obtener supervisores de campus */
    @GetMapping("/campus/{campusId}/supervisors")
    public ResponseEntity<List<UserResponseDto>> getSupervisorsByCampus(
            @PathVariable Long campusId) {
        return supervisionService.getSupervisorsByCampus(campusId);
    }
}
