package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.CurriculumEntity;
import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.SubjectEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.ModuleDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.SubjectDto;
import com.utez.edu.sigeabackend.modules.repositories.CurriculumRepository;
import com.utez.edu.sigeabackend.modules.repositories.ModuleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ModuleService {
    private final ModuleRepository moduleRepository;
    private final CurriculumRepository curriculumRepository;

    public ModuleService(ModuleRepository moduleRepository, CurriculumRepository curriculumRepository) {
        this.moduleRepository = moduleRepository;
        this.curriculumRepository = curriculumRepository;
    }

    public ResponseEntity<List<ModuleDto>> findByCurriculumId(Long curriculumId) {
        List<ModuleEntity> modules = moduleRepository.findByCurriculumId(curriculumId);
        var dtos = modules.stream().map(this::toModuleDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @Transactional
    public ResponseEntity<ModuleDto> create(ModuleEntity moduleEntity) {
        try {
            CurriculumEntity curriculum = curriculumRepository.findById(moduleEntity.getCurriculum().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Currículum no encontrado"));
            moduleEntity.setCurriculum(curriculum);
            var saved = moduleRepository.save(moduleEntity);
            return ResponseEntity.status(HttpStatus.CREATED).body(toModuleDto(saved));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al crear el módulo", e);
        }
    }

    @Transactional
    public ResponseEntity<ModuleDto> update(Long id, ModuleEntity moduleEntity) {
        try {
            return moduleRepository.findById(id)
                    .map(module -> {
                        module.setName(moduleEntity.getName());
                        var updated = moduleRepository.save(module);
                        return ResponseEntity.ok(toModuleDto(updated));
                    })
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Módulo no encontrado"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al actualizar el módulo", e);
        }
    }

    @Transactional
    public ResponseEntity<Object> delete(Long id) {
        try {
            return moduleRepository.findById(id)
                    .map(module -> {
                        if (module.getSubjects() != null && !module.getSubjects().isEmpty()) {
                            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede eliminar un módulo con materias");
                        }
                        moduleRepository.delete(module);
                        return ResponseEntity.noContent().build();
                    })
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Módulo no encontrado"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al eliminar el módulo", e);
        }
    }

    // --- Mapper de DTOs ---
    private ModuleDto toModuleDto(ModuleEntity entity) {
        List<SubjectDto> subjects = entity.getSubjects() == null ? List.of() :
                entity.getSubjects().stream().map(this::toSubjectDto).toList();
        return new ModuleDto(entity.getModuleId(), entity.getName(), subjects);
    }

    private SubjectDto toSubjectDto(SubjectEntity entity) {
        return new SubjectDto(
                entity.getId(),
                entity.getName(),
                entity.getWeeks()
        );
    }
}
