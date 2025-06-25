package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "career", uniqueConstraints = {
        @UniqueConstraint(name = "uq_career_differentiator_plantel",
                columnNames = {"differentiator", "plantel_id"})
})
public class CareerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "differentiator", nullable = false, length = 5)
    private String differentiator;

    // ******* RELACIONES ********
    /**
     * Relación muchos-a-uno con plantel
     * Nueva columna relacionada "plantel_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plantel_id", nullable = false)
    private PlantelEntity plantel;

    /**
     * Relación uno-a-muchos con GroupEntity.
     * mappedBy = "career" porque en GroupEntity la Lista se llama career
     */
    @OneToMany(mappedBy = "career", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Set<GroupEntity> groups = new HashSet<>();

    /**
     * Relación uno-a-muchos con UserCareerEnrollmentEntity
     */
    @OneToMany(mappedBy = "career", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Set<UserCareerEnrollmentEntity> enrollments = new HashSet<>();

    // Constructors
    public CareerEntity() {
    }

    public CareerEntity(String name, String differentiator, PlantelEntity plantel) {
        this.name = name;
        this.differentiator = differentiator;
        this.plantel = plantel;
    }

    // Getters and Setters
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDifferentiator() {
        return differentiator;
    }

    public void setDifferentiator(String differentiator) {
        this.differentiator = differentiator;
    }

    public PlantelEntity getPlantel() {
        return plantel;
    }

    public void setPlantel(PlantelEntity plantel) {
        this.plantel = plantel;
    }

    public Set<GroupEntity> getGroups() {
        return groups;
    }

    public void setGroups(Set<GroupEntity> groups) {
        this.groups = groups;
    }

    public Set<UserCareerEnrollmentEntity> getEnrollments() {
        return enrollments;
    }

    public void setEnrollments(Set<UserCareerEnrollmentEntity> enrollments) {
        this.enrollments = enrollments;
    }
}