package com.utez.edu.sigeabackend.modules.services;


import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.modulesDto.ModuleRequestDto;
import com.utez.edu.sigeabackend.modules.entities.dto.modulesDto.ModuleResponseDto;
import com.utez.edu.sigeabackend.modules.repositories.CareerRepository;
import com.utez.edu.sigeabackend.modules.repositories.ModuleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.stream.Collectors;

@Service
public class ModuleService {
    private final ModuleRepository moduleRepository;
    private final CareerRepository careerRepository;


    public ModuleService(ModuleRepository moduleRepository, CareerRepository careerRepository) {
        this.moduleRepository = moduleRepository;
        this.careerRepository = careerRepository;
    }

    private ModuleResponseDto toResponseDto(ModuleEntity entity) {
        return new ModuleResponseDto(
                entity.getId(),
                entity.getName(),
                entity.getCareer() != null ? entity.getCareer().getId() : null,
                entity.getCareer() != null ? entity.getCareer().getName() : null
        );
    }

    // Listar todos
    @Transactional(readOnly = true)
    public ResponseEntity<List<ModuleResponseDto>> findAll() {
        List<ModuleEntity> list = moduleRepository.findAll();
        if (list.isEmpty()) {
            return ResponseEntity.ok().body(null);
        }
        List<ModuleResponseDto> dtoList = list.stream().map(this::toResponseDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    // Buscar por id
    @Transactional(readOnly = true)
    public ResponseEntity<ModuleResponseDto> findById(long id) {
        return moduleRepository.findById(id)
                .map(this::toResponseDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Buscar por carrera
    @Transactional(readOnly = true)
    public ResponseEntity<List<ModuleResponseDto>> findByCareerId(long careerId) {
        List<ModuleEntity> modules = moduleRepository.findByCareerId(careerId);
        if (modules.isEmpty()) {
            return ResponseEntity.ok().body(null);
        }
        List<ModuleResponseDto> dtoList = modules.stream().map(this::toResponseDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }


    @Transactional
    public ResponseEntity<ModuleResponseDto> create(ModuleRequestDto dto) {
        CareerEntity career = careerRepository.findById(dto.careerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Carrera no encontrada"));

        ModuleEntity module = new ModuleEntity();
        module.setName(dto.name());
        module.setCareer(career);

        ModuleEntity saved = moduleRepository.save(module);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponseDto(saved));
    }

    @Transactional
    public ResponseEntity<ModuleResponseDto> update(long id, ModuleRequestDto dto) {
        ModuleEntity existing = moduleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Módulo no encontrado"));
        CareerEntity career = careerRepository.findById(dto.careerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Carrera no encontrada"));

        existing.setName(dto.name());
        existing.setCareer(career);

        ModuleEntity updated = moduleRepository.save(existing);
        return ResponseEntity.ok(toResponseDto(updated));
    }


    @Transactional
    public ResponseEntity<Void> delete(long id) {
        if (!moduleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        moduleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}