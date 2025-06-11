package com.utez.edu.sigeabackend.modules.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @JsonIgnore
    private CareerEntity career;

    /*UNO A UNO con subject*/
    @OneToOne(mappedBy = "module", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private SubjectEntity subject;

    public ModuleEntity() {
    }

    public ModuleEntity(long moduleId, String name, CareerEntity career, SubjectEntity subject) {
        this.moduleId = moduleId;
        this.name = name;
        this.career = career;
        this.subject = subject;
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

    public long getModuleId() {
        return moduleId;
    }

    public void setModuleId(long moduleId) {
        this.moduleId = moduleId;
    }

    public SubjectEntity getSubject() {
        return subject;
    }

    public void setSubject(SubjectEntity subject) {
        this.subject = subject;
    }
}
