package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.CampusEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CampusDto;
import com.utez.edu.sigeabackend.modules.repositories.CampusRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserCampusSupervisionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CampusService {
    private final CampusRepository repository;
    private final UserCampusSupervisionRepository supervisionRepository;
    private final CustomResponseEntity responseService;

    public CampusService(CampusRepository repository,
                         UserCampusSupervisionRepository supervisionRepository,
                         CustomResponseEntity responseService) {
        this.repository = repository;
        this.supervisionRepository = supervisionRepository;
        this.responseService = responseService;
    }

    // Helper method to convert entity to DTO
    private CampusDto toDto(CampusEntity campus) {
        int totalUsers = campus.getUsers().size();
        int totalSupervisors = campus.getSupervisorAssignments().size();

        return new CampusDto(
                campus.getId(),
                campus.getName(),
                totalUsers,
                totalSupervisors
        );
    }

    public ResponseEntity<?> findAll() {
        List<CampusEntity> list = repository.findAll();
        if (list.isEmpty()) {
            return responseService.get404Response();
        }

        List<CampusDto> dtos = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return responseService.getOkResponse("Lista de campus", dtos);
    }

    public ResponseEntity<?> findById(long id) {
        Optional<CampusEntity> campus = repository.findById(id);
        if (campus.isPresent()) {
            return responseService.getOkResponse("Campus encontrado", toDto(campus.get()));
        } else {
            return responseService.get404Response();
        }
    }

    /**
     * Obtiene todos los campus que un supervisor puede supervisar
     */
    public ResponseEntity<List<CampusDto>> findAllSupervisedByUser(Long userId, Long userCampusId) {
        try {
            List<CampusEntity> campuses = repository.findAllSupervisedByUser(userId, userCampusId);

            List<CampusDto> dtos = campuses.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            throw new RuntimeException("Error al consultar campus supervisados: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ResponseEntity<?> create(CampusEntity campus) {
        if (repository.existsByName(campus.getName())) {
            return responseService.get400Response();
        }

        CampusEntity saved = repository.save(campus);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @Transactional
    public ResponseEntity<?> update(long id, CampusEntity campus) {
        Optional<CampusEntity> optionalCampus = repository.findById(id);
        if (optionalCampus.isPresent()) {
            CampusEntity existing = optionalCampus.get();
            existing.setName(campus.getName());
            CampusEntity updated = repository.save(existing);
            return ResponseEntity.ok(toDto(updated));
        } else {
            return responseService.get404Response();
        }
    }

    @Transactional
    public ResponseEntity<?> delete(long id) {
        if (!repository.existsById(id)) {
            return responseService.get404Response();
        }

        // Verificar si hay usuarios asignados al campus
        Optional<CampusEntity> campus = repository.findById(id);
        if (campus.isPresent() && !campus.get().getUsers().isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("No se puede eliminar el campus porque tiene usuarios asignados");
        }

        repository.deleteById(id);
        return responseService.getOkResponse("Campus eliminado", null);
    }
}