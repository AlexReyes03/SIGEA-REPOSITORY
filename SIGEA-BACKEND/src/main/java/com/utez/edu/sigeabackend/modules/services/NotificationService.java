package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.NotificationEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.ModuleRepository;
import com.utez.edu.sigeabackend.modules.repositories.NotificationRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;
    private final ModuleRepository moduleRepo;
    private final CustomResponseEntity responseService;

    public NotificationService(NotificationRepository notificationRepo, UserRepository userRepo, ModuleRepository moduleRepo, CustomResponseEntity responseService) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
        this.moduleRepo = moduleRepo;
        this.responseService = responseService;
    }

    // Crear notificación
    public ResponseEntity<?> create(NotificationEntity notification, long userId, long moduleId) {
        UserEntity user = userRepo.findById(userId).orElse(null);
        if (user == null) {
            return responseService.createResponse("Usuario no encontrado", HttpStatus.NOT_FOUND, null);
        }
        ModuleEntity module = moduleRepo.findById(moduleId).orElse(null);
        if (module == null) {
            return responseService.createResponse("Módulo no encontrado", HttpStatus.NOT_FOUND, null);
        }

        notification.setUser(user);
        notification.setModuleEntity(module);
        notification.setSendDate(LocalDateTime.now());
        notification.setSeen(false);

        NotificationEntity saved = notificationRepo.save(notification);
        return responseService.createResponse("Notificación creada", HttpStatus.CREATED, saved);
    }

    // Listar notificaciones por usuario
    public ResponseEntity<?> findByUser(long userId) {
        List<NotificationEntity> list = notificationRepo.findByUserId(userId);
        if (list.isEmpty()) {
            return responseService.createResponse("No se encontraron notificaciones para el usuario", HttpStatus.NOT_FOUND, null);
        }
        return responseService.createResponse("Notificaciones encontradas", HttpStatus.OK, list);
    }

    // Listar notificaciones por módulo
    public ResponseEntity<?> findByModule(long moduleId) {
        List<NotificationEntity> list = notificationRepo.findByModuleEntityId(moduleId);
        if (list.isEmpty()) {
            return responseService.createResponse("No se encontraron notificaciones para el módulo", HttpStatus.NOT_FOUND, null);
        }
        return responseService.createResponse("Notificaciones encontradas por módulo", HttpStatus.OK, list);
    }

    // Marcar notificación como vista
    public ResponseEntity<?> markAsSeen(long id) {
        NotificationEntity notification = notificationRepo.findById(id).orElse(null);
        if (notification == null) {
            return responseService.createResponse("Notificación no encontrada", HttpStatus.NOT_FOUND, null);
        }
        notification.setSeen(true);
        notificationRepo.save(notification);
        return responseService.createResponse("Notificación marcada como vista", HttpStatus.OK, notification);
    }

    // Eliminar notificación
    public ResponseEntity<?> delete(long id) {
        if (!notificationRepo.existsById(id)) {
            return responseService.createResponse("Notificación no encontrada", HttpStatus.NOT_FOUND, null);
        }
        notificationRepo.deleteById(id);
        return responseService.createResponse("Notificación eliminada", HttpStatus.OK, null);
    }
}
