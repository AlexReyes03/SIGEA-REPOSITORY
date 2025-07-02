package com.utez.edu.sigeabackend.modules.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.utez.edu.sigeabackend.modules.media.MediaEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(
        name = "user",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_user_email", columnNames = "email")
        }
)
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "campus_id", // Mantenemos el nombre de columna en BD
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_user_campus")
    )
    private CampusEntity campus;

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

    @Column(name = "maternal_surname", length = 80)
    private String maternalSurname;

    @Column(length = 120, nullable = false)
    private String email;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String password;

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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avatar_id", foreignKey = @ForeignKey(name = "fk_user_avatar"))
    private MediaEntity avatar;

    /**
     * Relación uno-a-muchos con UserCareerEnrollmentEntity
     * Un usuario puede estar inscrito en múltiples carreras
     */
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Set<UserCareerEnrollmentEntity> careerEnrollments = new HashSet<>();

    /**
     * Relación muchos-a-muchos con CampusEntity a través de UserCampusSupervisionEntity
     * Para supervisores que pueden supervisar múltiples campus
     */
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private Set<UserCampusSupervisionEntity> campusSupervisions = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

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

    // Getters and Setters
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public CampusEntity getCampus() {
        return campus;
    }

    public void setCampus(CampusEntity campus) {
        this.campus = campus;
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

    public Set<UserCareerEnrollmentEntity> getCareerEnrollments() {
        return careerEnrollments;
    }

    public void setCareerEnrollments(Set<UserCareerEnrollmentEntity> careerEnrollments) {
        this.careerEnrollments = careerEnrollments;
    }

    public Set<UserCampusSupervisionEntity> getCampusSupervisions() {
        return campusSupervisions;
    }

    public void setCampusSupervisions(Set<UserCampusSupervisionEntity> campusSupervisions) {
        this.campusSupervisions = campusSupervisions;
    }

    // Helper methods para career enrollments
    public String getPrimaryRegistrationNumber() {
        return careerEnrollments.stream()
                .filter(enrollment -> enrollment.getStatus() == UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE)
                .findFirst()
                .map(UserCareerEnrollmentEntity::getRegistrationNumber)
                .orElse(null);
    }

    public int getAdditionalEnrollmentsCount() {
        long activeEnrollments = careerEnrollments.stream()
                .filter(enrollment -> enrollment.getStatus() == UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE)
                .count();
        return Math.max(0, (int) activeEnrollments - 1);
    }

    // Helper methods para campus supervisions
    /**
     * Obtiene todos los campus que supervisa este usuario (incluye su campus principal)
     */
    public List<CampusEntity> getAllSupervisedCampuses() {
        List<CampusEntity> supervisedCampuses = campusSupervisions.stream()
                .map(UserCampusSupervisionEntity::getCampus)
                .collect(Collectors.toList());

        // Agregar el campus principal si no está ya en la lista
        if (!supervisedCampuses.contains(this.campus)) {
            supervisedCampuses.add(0, this.campus); // Agregarlo al inicio
        }

        return supervisedCampuses;
    }

    /**
     * Obtiene solo los campus adicionales (sin incluir el campus principal)
     */
    public List<CampusEntity> getAdditionalSupervisedCampuses() {
        return campusSupervisions.stream()
                .filter(supervision -> supervision.getSupervisionType() == UserCampusSupervisionEntity.SupervisionType.ADDITIONAL)
                .map(UserCampusSupervisionEntity::getCampus)
                .collect(Collectors.toList());
    }

    /**
     * Verifica si el usuario puede supervisar un campus específico
     */
    public boolean canSupervise(Long campusId) {
        // Puede supervisar su campus principal
        if (this.campus.getId() == campusId) {
            return true;
        }

        // O cualquier campus asignado adicional
        return campusSupervisions.stream()
                .anyMatch(supervision -> supervision.getCampus().getId() == campusId);
    }

    /**
     * Verifica si es supervisor (tiene el rol SUPERVISOR)
     */
    public boolean isSupervisor() {
        return this.role != null && "SUPERVISOR".equals(this.role.getRoleName());
    }

    // -- ENUM --
    public enum Status {
        ACTIVE, INACTIVE
    }
}