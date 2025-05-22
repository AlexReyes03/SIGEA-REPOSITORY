package com.utez.edu.sigeabackend.modules.entities;


import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
public class NotificationEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name= "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false)
    private String message;

    @Column(name = "sendDate", nullable = false)
    private LocalDateTime sendDate;

    @Column(name = "isSeen", nullable = false)
    private Boolean isSeen;

    // ******* RELACIONES ********

    /**
     * Relación muchos-a-uno con UserEntity
     * Nueva columna relacionada "user_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    /**
     * Relación muchos-a-uno con ModuleEntity
     * Nueva columna relacionada "module_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "module_id")
    private ModuleEntity moduleEntity;


    public NotificationEntity() {
    }
    public NotificationEntity(long id, String title, String message, LocalDateTime sendDate, Boolean isSeen, UserEntity user, ModuleEntity moduleEntity) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.sendDate = sendDate;
        this.isSeen = isSeen;
        this.user = user;
        this.moduleEntity = moduleEntity;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getSendDate() {
        return sendDate;
    }

    public void setSendDate(LocalDateTime sendDate) {
        this.sendDate = sendDate;
    }

    public Boolean getSeen() {
        return isSeen;
    }

    public void setSeen(Boolean seen) {
        isSeen = seen;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public ModuleEntity getModuleEntity() {
        return moduleEntity;
    }

    public void setModuleEntity(ModuleEntity moduleEntity) {
        this.moduleEntity = moduleEntity;
    }
}
