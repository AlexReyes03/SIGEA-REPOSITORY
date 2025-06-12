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
     * Relación muchos-a-uno con CurriculumEntity
     * Nueva columna relacionada "career_id"
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curriculum_id")
    private CurriculumEntity curriculum;

    /*UNO A UNO con subject*/
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private SubjectEntity subject;

    public ModuleEntity() {
    }

    public ModuleEntity(long moduleId, String name, CurriculumEntity curriculum, SubjectEntity subject) {
        this.moduleId = moduleId;
        this.name = name;
        this.curriculum = curriculum;
        this.subject = subject;
    }

    public long getModuleId() {
        return moduleId;
    }

    public void setModuleId(long moduleId) {
        this.moduleId = moduleId;
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

    public SubjectEntity getSubject() {
        return subject;
    }

    public void setSubject(SubjectEntity subject) {
        this.subject = subject;
    }
}
