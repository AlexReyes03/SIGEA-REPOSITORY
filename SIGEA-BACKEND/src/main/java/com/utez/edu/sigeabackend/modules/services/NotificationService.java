package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.ModuleEntity;
import com.utez.edu.sigeabackend.modules.entities.NotificationEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.ModuleRepository;
import com.utez.edu.sigeabackend.modules.repositories.NotificationRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
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
        ModuleEntity module = moduleRepo.findById(moduleId).orElse(null);

        if (user == null) return responseService.get404Response();
        if (module == null) return responseService.get404Response();

        notification.setUser(user);
        notification.setModuleEntity(module);
        notification.setSendDate(LocalDateTime.now());
        notification.setSeen(false);

        notificationRepo.save(notification);
        return responseService.get201Response("Notificación creada");
    }

    // Listar notificaciones por usuario
    public ResponseEntity<?> findByUser(long userId) {
        List<NotificationEntity> list = notificationRepo.findByUserId(userId);
        return responseService.getOkResponse("Notificaciones encontradas", list);
    }

    // Listar notificaciones por módulo
    public ResponseEntity<?> findByModule(long moduleId) {
        List<NotificationEntity> list = notificationRepo.findByModuleEntityId(moduleId);
        return responseService.getOkResponse("Notificaciones encontradas por módulo", list);
    }

    // Marcar notificación como vista
    public ResponseEntity<?> markAsSeen(long id) {
        NotificationEntity notification = notificationRepo.findById(id).orElse(null);
        if (notification == null) return responseService.get404Response();
        notification.setSeen(true);
        notificationRepo.save(notification);
        return responseService.getOkResponse("Notificación marcada como vista", notification);
    }

    // Eliminar notificación
    public ResponseEntity<?> delete(long id) {
        if (!notificationRepo.existsById(id)) return responseService.get404Response();
        notificationRepo.deleteById(id);
        return responseService.getOkResponse("Notificación eliminada", null);
    }
}
