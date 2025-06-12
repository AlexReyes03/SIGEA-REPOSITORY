package com.utez.edu.sigeabackend.modules.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.utez.edu.sigeabackend.modules.media.MediaEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_user_email", columnNames = "email"),
                @UniqueConstraint(name = "uq_user_registration_number", columnNames = "registration_number")
        }
)
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "campus_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_user_campus")
    )
    private PlantelEntity plantel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "rol_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_user_rol")
    )
    private RoleEntity role;

    @Column(name = "name", length = 80, nullable = false)
    private String name;

    @Column(name = "paternal_surname", length = 80, nullable = false)
    private String paternalSurname;

    @Column(name = "maternal_surname", length = 80, nullable = false)
    private String maternalSurname;

    @Column(length = 120, nullable = false)
    private String email;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String password;

    @Column(
            name = "registration_number",
            length = 40,
            unique = true
    )
    private String registrationNumber;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "status",
            columnDefinition = "ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE'",
            nullable = false
    )
    private Status status = Status.ACTIVE;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP"
    )
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avatar_id", foreignKey = @ForeignKey(name = "fk_user_avatar"))
    private MediaEntity avatar;

    // -- Constructors --
    public UserEntity() {}

    public UserEntity(String name, String paternalSurname, String maternalSurname, String email, String password) {
        this.name = name;
        this.paternalSurname = paternalSurname;
        this.maternalSurname = maternalSurname;
        this.email = email;
        this.password = password;
    }

    public UserEntity(String name, String paternalSurname, String maternalSurname, String email, String password, MediaEntity avatar) {
        this.name = name;
        this.paternalSurname = paternalSurname;
        this.maternalSurname = maternalSurname;
        this.email = email;
        this.password = password;
        this.avatar = avatar;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public PlantelEntity getPlantel() {
        return plantel;
    }

    public void setPlantel(PlantelEntity plantel) {
        this.plantel = plantel;
    }

    public RoleEntity getRole() {
        return role;
    }

    public void setRole(RoleEntity role) {
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPaternalSurname() {
        return paternalSurname;
    }

    public void setPaternalSurname(String paternalSurname) {
        this.paternalSurname = paternalSurname;
    }

    public String getMaternalSurname() {
        return maternalSurname;
    }

    public void setMaternalSurname(String maternalSurname) {
        this.maternalSurname = maternalSurname;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @JsonIgnore
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public MediaEntity getAvatar() {
        return avatar;
    }

    public void setAvatar(MediaEntity avatar) {
        this.avatar = avatar;
    }

    // -- ENUM --
    public enum Status {
        ACTIVE, INACTIVE
    }
}
