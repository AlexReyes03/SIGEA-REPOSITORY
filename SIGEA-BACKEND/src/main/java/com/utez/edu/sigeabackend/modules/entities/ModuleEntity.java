package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "module")
public class ModuleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long moduleId;

    @Column(name = "name", nullable = false)
    private String name;

    // ******* RELACIONES ********

    /**
     * Relación muchos-a-uno con CareerEntity
     * Nueva columna relacionada "career_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "career_id")
    private CareerEntity career;

    /**
     * Relación uno-a-muchos con SubjectEntity.
     * mappedBy = "module"
     */
    @OneToMany(mappedBy = "module", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<SubjectEntity> subjects = new HashSet<>();

    public ModuleEntity() {
    }

    public ModuleEntity(long moduleId, String name, CareerEntity career, Set<SubjectEntity> subjects) {
        this.moduleId = moduleId;
        this.name = name;
        this.career = career;
        this.subjects = subjects;
    }

    public long getId() {
        return moduleId;
    }

    public void setId(long moduleId) {
        this.moduleId = moduleId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public CareerEntity getCareer() {
        return career;
    }

    public void setCareer(CareerEntity career) {
        this.career = career;
    }

    public Set<SubjectEntity> getSubjects() {
        return subjects;
    }

    public void setSubjects(Set<SubjectEntity> subjects) {
        this.subjects = subjects;
    }
}
