package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.RoleEntity;
import com.utez.edu.sigeabackend.modules.repositories.RoleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleService {
    private final RoleRepository repository;
    private final CustomResponseEntity responseService;

    public RoleService(RoleRepository repository, CustomResponseEntity responseService) {
        this.repository = repository;
        this.responseService = responseService;
    }

    public ResponseEntity<?> findAll() {
        List<RoleEntity> roles = repository.findAll();
        if (roles.isEmpty())
            return responseService.get404Response();
        return responseService.getOkResponse("Roles encontrados", roles);
    }


    public ResponseEntity<?> findById(long id) {
        var optionalRole = repository.findById(id);
        if (optionalRole.isPresent()) {
            return responseService.getOkResponse("Rol encontrado", optionalRole.get());
        } else {
            return responseService.get404Response();
        }
    }

    public ResponseEntity<?> create(RoleEntity role) {
        if (repository.existsByRoleName(role.getRoleName()))
            return responseService.get400Response();
        repository.save(role);
        return responseService.get201Response("Rol creado correctamente");
    }

    public ResponseEntity<?> update(long id, RoleEntity role) {
        var optionalRole = repository.findById(id);
        if (optionalRole.isPresent()) {
            RoleEntity existing = optionalRole.get();
            existing.setRoleName(role.getRoleName());
            repository.save(existing);
            return responseService.getOkResponse("Rol actualizado", existing);
        } else {
            return responseService.get404Response();
        }
    }

    public ResponseEntity<?> delete(long id) {
        var optionalRole = repository.findById(id);
        if (optionalRole.isPresent()) {
            repository.deleteById(id);
            return responseService.getOkResponse("Rol eliminado", null);
        } else {
            return responseService.get404Response();
        }
    }
}
