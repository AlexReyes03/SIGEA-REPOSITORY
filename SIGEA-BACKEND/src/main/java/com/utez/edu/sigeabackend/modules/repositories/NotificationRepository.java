package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.NotificationEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    //Contador de notificaciones NO LEIDAS por usuario
    @Query("SELECT COUNT(n) FROM NotificationEntity n WHERE n.userId = :userId AND n.isRead = false")
    Long countUnreadByUserId(@Param("userId") Long userId);

    //Busca las notificaciones de un usuario por ID y las ordena por fecha de creación descendente
    List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    //Marcar una notificación específica como leída (solo si pertenece al usuario)
    @Modifying
    @Transactional
    @Query("UPDATE NotificationEntity n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.id = :notificationId AND n.userId = :userId AND n.isRead = false")
    int markAsReadByIdAndUserId(@Param("notificationId") Long notificationId, @Param("userId") Long userId);

    //Eliminar una notificación específica (solo si pertenece al usuario)
    @Modifying
    @Transactional
    @Query("DELETE FROM NotificationEntity n WHERE n.id = :notificationId AND n.userId = :userId")
    int deleteByIdAndUserId(@Param("notificationId") Long notificationId, @Param("userId") Long userId);

    // Eliminar todas las notificaciones leídas de un usuario
    @Modifying
    @Transactional
    @Query("DELETE FROM NotificationEntity n WHERE n.userId = :userId AND n.isRead = true")
    int deleteAllReadByUserId(@Param("userId") Long userId);

    //Contar total de notificaciones por usuario
    Long countByUserId(Long userId);


}