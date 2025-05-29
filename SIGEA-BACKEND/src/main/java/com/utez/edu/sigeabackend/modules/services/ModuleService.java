package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.repositories.CareerRepository;
import com.utez.edu.sigeabackend.modules.repositories.ModuleRepository;
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
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Módulos encontrados", list);
    }

    public ResponseEntity<?> findById(long id) {
        ModuleEntity entity = moduleRepository.findById(id).orElse(null);
        if (entity == null) {
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Módulo encontrado", entity);
    }

    public ResponseEntity<?> findByCareerId(long careerId) {
        List<ModuleEntity> modules = moduleRepository.findByCareerId(careerId);
        if (modules.isEmpty()) {
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Módulos encontrados para la carrera", modules);
    }

    public ResponseEntity<?> create(ModuleEntity module, long careerId) {
        CareerEntity career = careerRepository.findById(careerId).orElse(null);
        if (career == null) {
            return responseService.get404Response();
        }
        module.setCareer(career);
        moduleRepository.save(module);
        return responseService.get201Response("Módulo creado");
    }

    public ResponseEntity<?> update(long id, ModuleEntity module, long careerId) {
        ModuleEntity existing = moduleRepository.findById(id).orElse(null);
        if (existing == null) {
            return responseService.get404Response();
        }
        CareerEntity career = careerRepository.findById(careerId).orElse(null);
        if (career == null) {
            return responseService.get404Response();
        }
        existing.setName(module.getName());
        existing.setCareer(career);
        moduleRepository.save(existing);
        return responseService.getOkResponse("Módulo actualizado", existing);
    }

    public ResponseEntity<?> delete(long id) {
        ModuleEntity existing = moduleRepository.findById(id).orElse(null);
        if (existing == null) {
            return responseService.get404Response();
        }
        moduleRepository.deleteById(id);
        return responseService.getOkResponse("Módulo eliminado", null);
    }
}
