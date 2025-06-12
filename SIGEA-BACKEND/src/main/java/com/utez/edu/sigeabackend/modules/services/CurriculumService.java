package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.CurriculumEntity;
import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.SubjectEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CurriculumDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.ModuleDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.SubjectDto;
import com.utez.edu.sigeabackend.modules.repositories.CareerRepository;
import com.utez.edu.sigeabackend.modules.repositories.CurriculumRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CurriculumService {

    private final CurriculumRepository curriculumRepository;
    private final CareerRepository careerRepository;

    public CurriculumService(CurriculumRepository curriculumRepository, CareerRepository careerRepository) {
        this.curriculumRepository = curriculumRepository;
        this.careerRepository = careerRepository;
    }

    public ResponseEntity<List<CurriculumDto>> findByCareerId(Long careerId) {
        List<CurriculumEntity> curriculums = curriculumRepository.findByCareerId(careerId);
        var dtos = curriculums.stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @Transactional
    public ResponseEntity<CurriculumDto> create(String name, Long careerId) {
        CareerEntity career = careerRepository.findById(careerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carrera no encontrada"));

        CurriculumEntity entity = new CurriculumEntity();
        entity.setName(name);
        entity.setCareer(career);

        var saved = curriculumRepository.save(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @Transactional
    public ResponseEntity<CurriculumDto> update(Long id, String newName) {
        return curriculumRepository.findById(id)
                .map(curriculum -> {
                    curriculum.setName(newName);
                    var updated = curriculumRepository.save(curriculum);
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @Transactional
    public ResponseEntity<Object> delete(Long id) {
        return curriculumRepository.findById(id)
                .map(curriculum -> {
                    if (curriculum.getModules() != null && !curriculum.getModules().isEmpty()) {
                        return ResponseEntity.status(HttpStatus.CONFLICT).build();
                    }
                    curriculumRepository.delete(curriculum);
                    return ResponseEntity.noContent().build();
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Mapper DTO
    private CurriculumDto toDto(CurriculumEntity entity) {
        List<ModuleDto> modules = entity.getModules() == null ? List.of() :
                entity.getModules().stream().map(this::toModuleDto).toList();
        return new CurriculumDto(entity.getId(), entity.getName(), modules);
    }

    private ModuleDto toModuleDto(ModuleEntity entity) {
        List<SubjectDto> subjects = entity.getSubjects() == null ? List.of() :
                entity.getSubjects().stream().map(this::toSubjectDto).toList();
        return new ModuleDto(entity.getModuleId(), entity.getName(), subjects);
    }

    private SubjectDto toSubjectDto(SubjectEntity entity) {
        return new SubjectDto(entity.getId(), entity.getName(), entity.getWeeks());
    }
}