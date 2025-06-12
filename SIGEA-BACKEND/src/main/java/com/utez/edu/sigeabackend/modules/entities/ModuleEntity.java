package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "module")
public class ModuleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "name", nullable = false)
    private String name;

    // Relación muchos-a-uno con CurriculumEntity
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id", nullable = false)
    private CurriculumEntity curriculum;

    // Relación uno-a-muchos con SubjectEntity
    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubjectEntity> subjects;

    public ModuleEntity() {}

    public ModuleEntity(long id, String name, CurriculumEntity curriculum, List<SubjectEntity> subjects) {
        this.id = id;
        this.name = name;
        this.curriculum = curriculum;
        this.subjects = subjects;
    }

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

    public CurriculumEntity getCurriculum() {
        return curriculum;
    }

    public void setCurriculum(CurriculumEntity curriculum) {
        this.curriculum = curriculum;
    }

    public List<SubjectEntity> getSubjects() {
        return subjects;
    }

    public void setSubjects(List<SubjectEntity> subjects) {
        this.subjects = subjects;
    }
}
