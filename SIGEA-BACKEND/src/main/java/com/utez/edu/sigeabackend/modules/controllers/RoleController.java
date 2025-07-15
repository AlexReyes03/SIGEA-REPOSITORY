package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.RoleEntity;
import com.utez.edu.sigeabackend.modules.services.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sigea/api/roles")
public class RoleController {

    private final RoleService service;

    public RoleController(RoleService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return service.findById(id);
    }

    /*
     * ENDPOINTS DE MODIFICACIÓN COMENTADOS PARA SEGURIDAD
     * Estos endpoints pueden ser habilitados en el futuro si es necesario
     * Por ahora, los roles se generan automáticamente al arrancar la aplicación
     */

    /*
    @PostMapping
    public ResponseEntity<?> create(@RequestBody RoleEntity role) {
        return service.create(role);
    }
    */

    /*
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody RoleEntity role) {
        return service.update(id, role);
    }
    */

    /*
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return service.delete(id);
    }
    */
}