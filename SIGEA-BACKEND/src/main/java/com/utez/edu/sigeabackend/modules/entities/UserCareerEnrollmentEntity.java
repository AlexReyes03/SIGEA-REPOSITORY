package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_career_enrollment", uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_career", columnNames = {"user_id", "career_id"}),
        @UniqueConstraint(name = "uq_registration_number_plantel",
                columnNames = {"registration_number", "plantel_id"})
})
public class UserCareerEnrollmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_enrollment_user"))
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "career_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_enrollment_career"))
    private CareerEntity career;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plantel_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_enrollment_plantel"))
    private PlantelEntity plantel;

    @Column(name = "registration_number", nullable = false, length = 15)
    private String registrationNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false,
            columnDefinition = "ENUM('ACTIVE', 'COMPLETED', 'INACTIVE') DEFAULT 'ACTIVE'")
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    @Column(name = "enrolled_at", nullable = false, updatable = false,
            columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime enrolledAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        this.enrolledAt = LocalDateTime.now();
    }

    // Constructors
    public UserCareerEnrollmentEntity() {}

    public UserCareerEnrollmentEntity(UserEntity user, CareerEntity career,
                                      PlantelEntity plantel, String registrationNumber) {
        this.user = user;
        this.career = career;
        this.plantel = plantel;
        this.registrationNumber = registrationNumber;
    }

    // Getters and Setters
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

    public CareerEntity getCareer() {
        return career;
    }

    public void setCareer(CareerEntity career) {
        this.career = career;
    }

    public PlantelEntity getPlantel() {
        return plantel;
    }

    public void setPlantel(PlantelEntity plantel) {
        this.plantel = plantel;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public EnrollmentStatus getStatus() {
        return status;
    }

    public void setStatus(EnrollmentStatus status) {
        this.status = status;
        if (status == EnrollmentStatus.COMPLETED && this.completedAt == null) {
            this.completedAt = LocalDateTime.now();
        }
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    // Enum for enrollment status
    public enum EnrollmentStatus {
        ACTIVE,
        COMPLETED,
        INACTIVE
    }
}