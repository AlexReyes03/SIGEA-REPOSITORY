package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.SubjectEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.SubjectDto;
import com.utez.edu.sigeabackend.modules.repositories.ModuleRepository;
import com.utez.edu.sigeabackend.modules.repositories.SubjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SubjectService {
    private final SubjectRepository subjectRepository;
    private final ModuleRepository moduleRepository;


    public SubjectService(SubjectRepository subjectRepository, ModuleRepository moduleRepository) {
        this.subjectRepository = subjectRepository;
        this.moduleRepository = moduleRepository;
    }

    public ResponseEntity<List<SubjectDto>> findByModuleId(Long moduleId) {
        List<SubjectEntity> subjects = subjectRepository.findByModuleId(moduleId);
        var dtos = subjects.stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @Transactional
    public ResponseEntity<SubjectDto> create(SubjectEntity subjectEntity) {
        try {
            ModuleEntity module = moduleRepository.findById(subjectEntity.getModule().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Módulo no encontrado"));
            subjectEntity.setModule(module);
            var saved = subjectRepository.save(subjectEntity);
            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al crear la materia", e);
        }
    }

    @Transactional
    public ResponseEntity<SubjectDto> update(Long id, SubjectEntity subjectEntity) {
        try {
            return subjectRepository.findById(id)
                .map(subject -> {
                    subject.setName(subjectEntity.getName());
                    subject.setWeeks(subjectEntity.getWeeks());
                    var updated = subjectRepository.save(subject);
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Materia no encontrada"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al actualizar la materia", e);
        }
    }

    @Transactional
    public ResponseEntity<Object> delete(Long id) {
        try {
            return subjectRepository.findById(id)
                .map(subject -> {
                    subjectRepository.delete(subject);
                    return ResponseEntity.noContent().build();
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Materia no encontrada"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al eliminar la materia", e);
        }
    }

    private SubjectDto toDto(SubjectEntity entity) {
        return new SubjectDto(entity.getId(), entity.getName(), entity.getWeeks());
    }
}
