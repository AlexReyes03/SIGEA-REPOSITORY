package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "curriculum")
public class CurriculumEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // ******* RELACIONES ********

    // Relation: Muchos curriculums pertenecen a una carrera
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "career_id", nullable = false)
    private CareerEntity career;

    // Relation: Un curriculum tiene muchos módulos
    @OneToMany(mappedBy = "curriculum", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModuleEntity> modules;

    public CurriculumEntity() {
    }

    public CurriculumEntity(Long id, String name, CareerEntity career, List<ModuleEntity> modules) {
        this.id = id;
        this.name = name;
        this.career = career;
        this.modules = modules;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public List<ModuleEntity> getModules() {
        return modules;
    }

    public void setModules(List<ModuleEntity> modules) {
        this.modules = modules;
    }
}
