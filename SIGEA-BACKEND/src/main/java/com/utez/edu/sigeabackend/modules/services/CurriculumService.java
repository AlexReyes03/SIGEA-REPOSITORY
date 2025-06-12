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
    public ResponseEntity<CurriculumDto> create(CurriculumEntity curriculumEntity) {
        try {
            CareerEntity career = careerRepository.findById(curriculumEntity.getCareer().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carrera no encontrada"));

            curriculumEntity.setCareer(career);
            var saved = curriculumRepository.save(curriculumEntity);
            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al crear el curriculum", e);
        }
    }

    @Transactional
    public ResponseEntity<CurriculumDto> update(Long id, CurriculumEntity curriculumEntity) {
        try {
            return curriculumRepository.findById(id)
                    .map(curriculum -> {
                        curriculum.setName(curriculumEntity.getName());
                        var updated = curriculumRepository.save(curriculum);
                        return ResponseEntity.ok(toDto(updated));
                    })
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Curriculum no encontrado"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al actualizar el curriculum", e);
        }
    }

   @Transactional
    public ResponseEntity<Object> delete(Long id) {
        try {
            return curriculumRepository.findById(id)
                    .map(curriculum -> {
                        if (curriculum.getModules() != null && !curriculum.getModules().isEmpty()) {
                            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede eliminar un curriculum con módulos");
                        }
                        curriculumRepository.delete(curriculum);
                        return ResponseEntity.noContent().build();
                    })
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Curriculum no encontrado"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al eliminar el curriculum", e);
        }
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
        return new ModuleDto(entity.getId(), entity.getName(), subjects);
    }

    private SubjectDto toSubjectDto(SubjectEntity entity) {
        return new SubjectDto(entity.getId(), entity.getName(), entity.getWeeks());
    }
}