package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.CampusEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.UserCampusSupervisionEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.users.*;
import com.utez.edu.sigeabackend.modules.repositories.CampusRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserCampusSupervisionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserCampusSupervisionService {

    private final UserCampusSupervisionRepository supervisionRepository;
    private final UserRepository userRepository;
    private final CampusRepository campusRepository;

    public UserCampusSupervisionService(UserCampusSupervisionRepository supervisionRepository,
                                        UserRepository userRepository,
                                        CampusRepository campusRepository) {
        this.supervisionRepository = supervisionRepository;
        this.userRepository = userRepository;
        this.campusRepository = campusRepository;
    }

    // Helper method to convert supervision entity to DTO
    private CampusSupervisionDto toDto(UserCampusSupervisionEntity supervision) {
        return new CampusSupervisionDto(
                supervision.getId(),
                supervision.getCampus().getId(),
                supervision.getCampus().getName(),
                supervision.getSupervisionType(),
                supervision.getAssignedAt(),
                supervision.getAssignedByUserId()
        );
    }

    /**
     * Asigna un campus adicional a un supervisor
     */
    @Transactional
    public ResponseEntity<CampusSupervisionDto> assignCampusToSupervisor(AssignCampusToSupervisorDto dto) {
        // Verificar que el supervisor existe y es supervisor
        UserEntity supervisor = userRepository.findById(dto.supervisorId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Supervisor no encontrado"
                ));

        if (!supervisor.isSupervisor()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El usuario no es un supervisor"
            );
        }

        // Verificar que el campus existe
        CampusEntity campus = campusRepository.findById(dto.campusId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Campus no encontrado"
                ));

        // Verificar que el supervisor no esté ya asignado a este campus
        if (supervisionRepository.existsByUserIdAndCampusId(dto.supervisorId(), dto.campusId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "El supervisor ya está asignado a este campus"
            );
        }

        // Verificar que no sea su campus principal
        if (Long.valueOf(supervisor.getCampus().getId()).equals(dto.campusId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "No se puede asignar el campus principal como supervisión adicional"
            );
        }

        // Crear la asignación
        UserCampusSupervisionEntity supervision = new UserCampusSupervisionEntity(
                supervisor,
                campus,
                UserCampusSupervisionEntity.SupervisionType.ADDITIONAL,
                dto.assignedByUserId()
        );

        UserCampusSupervisionEntity saved = supervisionRepository.save(supervision);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    /**
     * Remueve un campus de las supervisiones de un supervisor
     */
    @Transactional
    public ResponseEntity<Void> removeCampusFromSupervisor(RemoveCampusFromSupervisorDto dto) {
        // Verificar que la asignación existe
        UserCampusSupervisionEntity supervision = supervisionRepository
                .findByUserIdAndCampusId(dto.supervisorId(), dto.campusId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Asignación de supervisión no encontrada"
                ));

        // No permitir remover el campus principal
        if (supervision.getSupervisionType() == UserCampusSupervisionEntity.SupervisionType.PRIMARY) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "No se puede remover el campus principal"
            );
        }

        supervisionRepository.delete(supervision);
        return ResponseEntity.noContent().build();
    }

    /**
     * Obtiene todos los campus supervisados por un usuario
     */
    public ResponseEntity<SupervisorCampusesResponseDto> getSupervisorCampuses(Long supervisorId) {
        UserEntity supervisor = userRepository.findSupervisorWithCampusSupervisions(supervisorId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Supervisor no encontrado"
                ));

        if (!supervisor.isSupervisor()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El usuario no es un supervisor"
            );
        }

        List<CampusSupervisionDto> additionalCampuses = supervisor.getCampusSupervisions()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        SupervisorCampusesResponseDto response = new SupervisorCampusesResponseDto(
                supervisor.getId(),
                supervisor.getName() + " " + supervisor.getPaternalSurname(),
                supervisor.getEmail(),
                supervisor.getCampus().getId(),
                supervisor.getCampus().getName(),
                additionalCampuses,
                additionalCampuses.size() + 1 // +1 por el campus principal
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene todos los supervisores de un campus
     */
    public ResponseEntity<List<UserResponseDto>> getSupervisorsByCampus(Long campusId) {
        try {
            List<UserEntity> supervisors = userRepository.findSupervisorsByCampusId(campusId);

            List<UserResponseDto> supervisorDtos = supervisors.stream()
                    .map(this::convertToUserResponseDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(supervisorDtos);
        } catch (Exception e) {
            throw new RuntimeException("Error al consultar supervisores por campus: " + e.getMessage(), e);
        }
    }

    // Helper method to convert UserEntity to UserResponseDto
    private UserResponseDto convertToUserResponseDto(UserEntity user) {
        String avatarUrl = (user.getAvatar() != null)
                ? "/sigea/api/media/raw/" + user.getAvatar().getCode()
                : null;

        List<CampusSupervisionDto> supervisedCampuses = user.getCampusSupervisions()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getPaternalSurname(),
                user.getMaternalSurname(),
                user.getEmail(),
                user.getPrimaryRegistrationNumber(),
                user.getAdditionalEnrollmentsCount(),
                user.getStatus().name(),
                user.getCampus().getId(),
                user.getCampus().getName(),
                user.getRole().getId(),
                user.getRole().getRoleName(),
                user.getCreatedAt(),
                avatarUrl,
                supervisedCampuses
        );
    }
}