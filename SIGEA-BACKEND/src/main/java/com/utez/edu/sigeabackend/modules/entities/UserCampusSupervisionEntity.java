package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_campus_supervision",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_user_campus_supervision",
                        columnNames = {"user_id", "campus_id"}
                )
        }
)
public class UserCampusSupervisionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_supervision_user")
    )
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "campus_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_supervision_campus")
    )
    private CampusEntity campus;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "supervision_type",
            columnDefinition = "ENUM('PRIMARY', 'ADDITIONAL') DEFAULT 'ADDITIONAL'",
            nullable = false
    )
    private SupervisionType supervisionType = SupervisionType.ADDITIONAL;

    @Column(
            name = "assigned_at",
            nullable = false,
            updatable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP"
    )
    private LocalDateTime assignedAt;

    @Column(
            name = "assigned_by_user_id",
            nullable = false
    )
    private Long assignedByUserId;

    @PrePersist
    protected void onCreate() {
        this.assignedAt = LocalDateTime.now();
    }

    // Constructors
    public UserCampusSupervisionEntity() {}

    public UserCampusSupervisionEntity(UserEntity user, CampusEntity campus, SupervisionType supervisionType, Long assignedByUserId) {
        this.user = user;
        this.campus = campus;
        this.supervisionType = supervisionType;
        this.assignedByUserId = assignedByUserId;
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public CampusEntity getCampus() {
        return campus;
    }

    public void setCampus(CampusEntity campus) {
        this.campus = campus;
    }

    public SupervisionType getSupervisionType() {
        return supervisionType;
    }

    public void setSupervisionType(SupervisionType supervisionType) {
        this.supervisionType = supervisionType;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public Long getAssignedByUserId() {
        return assignedByUserId;
    }

    public void setAssignedByUserId(Long assignedByUserId) {
        this.assignedByUserId = assignedByUserId;
    }

    // Enums
    public enum SupervisionType {
        PRIMARY,    // Campus principal del supervisor
        ADDITIONAL  // Campus adicionales asignados
    }
}