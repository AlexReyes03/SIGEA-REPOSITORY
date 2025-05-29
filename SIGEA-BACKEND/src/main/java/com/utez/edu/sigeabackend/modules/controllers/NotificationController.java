package com.utez.edu.sigeabackend.modules.controllers;

import com.utez.edu.sigeabackend.modules.entities.NotificationEntity;
import com.utez.edu.sigeabackend.modules.services.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sigea/api/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    // Crear notificación
    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody NotificationEntity notification,
                                    @RequestParam long userId,
                                    @RequestParam long moduleId) {
        return service.create(notification, userId, moduleId);
    }

    // Listar notificaciones por usuario
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> findByUser(@PathVariable long userId) {
        return service.findByUser(userId);
    }

    // Listar notificaciones por módulo
    @GetMapping("/module/{moduleId}")
    public ResponseEntity<?> findByModule(@PathVariable long moduleId) {
        return service.findByModule(moduleId);
    }

    // Marcar como vista
    @PatchMapping("/{id}/seen")
    public ResponseEntity<?> markAsSeen(@PathVariable long id) {
        return service.markAsSeen(id);
    }

    // Eliminar notificación
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id) {
        return service.delete(id);
    }
}
