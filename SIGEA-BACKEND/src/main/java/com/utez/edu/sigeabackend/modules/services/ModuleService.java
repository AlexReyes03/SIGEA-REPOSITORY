package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.repositories.CareerRepository;
import com.utez.edu.sigeabackend.modules.repositories.ModuleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModuleService {
    private final ModuleRepository moduleRepository;
    private final CareerRepository careerRepository;
    private final CustomResponseEntity responseService;

    public ModuleService(ModuleRepository moduleRepository, CareerRepository careerRepository, CustomResponseEntity responseService) {
        this.moduleRepository = moduleRepository;
        this.careerRepository = careerRepository;
        this.responseService = responseService;
    }

    public ResponseEntity<?> findAll() {
        List<ModuleEntity> list = moduleRepository.findAll();
        if (list.isEmpty()) {
            return responseService.createResponse("No se encontraron módulos", HttpStatus.NOT_FOUND, null);
        }
        return responseService.createResponse("Módulos encontrados", HttpStatus.OK, list);
    }

    public ResponseEntity<?> findById(long id) {
        ModuleEntity entity = moduleRepository.findById(id).orElse(null);
        if (entity == null) {
            return responseService.createResponse("Módulo no encontrado", HttpStatus.NOT_FOUND, null);
        }
        return responseService.createResponse("Módulo encontrado", HttpStatus.OK, entity);
    }

    public ResponseEntity<?> findByCareerId(long careerId) {
        List<ModuleEntity> modules = moduleRepository.findByCareerId(careerId);
        if (modules.isEmpty()) {
            return responseService.createResponse("No se encontraron módulos para la carrera", HttpStatus.NOT_FOUND, null);
        }
        return responseService.createResponse("Módulos encontrados para la carrera", HttpStatus.OK, modules);
    }


    public ResponseEntity<?> create(ModuleEntity module, long careerId) {
        try {
            CareerEntity career = careerRepository.findById(careerId).orElse(null);
            if (career == null) {
                return responseService.get404Response();
            }
            module.setCareer(career);
            ModuleEntity saved = moduleRepository.save(module);
            return responseService.createResponse("Módulo creado exitosamente", HttpStatus.CREATED, saved);
        } catch (Exception e) {
            return responseService.get400Response();
        }
    }
    public ResponseEntity<?> update(long id, ModuleEntity module, long careerId) {
        ModuleEntity existing = moduleRepository.findById(id).orElse(null);
        if (existing == null) {
            return responseService.createResponse("Módulo no encontrado", HttpStatus.NOT_FOUND, null);
        }
        CareerEntity career = careerRepository.findById(careerId).orElse(null);
        if (career == null) {
            return responseService.createResponse("Carrera no encontrada", HttpStatus.NOT_FOUND, null);
        }
        existing.setName(module.getName());
        existing.setCareer(career);
        moduleRepository.save(existing);
        return responseService.createResponse("Módulo actualizado", HttpStatus.OK, existing);
    }

    public ResponseEntity<?> delete(long id) {
        ModuleEntity existing = moduleRepository.findById(id).orElse(null);
        if (existing == null) {
            return responseService.createResponse("Módulo no encontrado", HttpStatus.NOT_FOUND, null);
        }
        moduleRepository.deleteById(id);
        return responseService.createResponse("Módulo eliminado", HttpStatus.OK, null);
    }
}

