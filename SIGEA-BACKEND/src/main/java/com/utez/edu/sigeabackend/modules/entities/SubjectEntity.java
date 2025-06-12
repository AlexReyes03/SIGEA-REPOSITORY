package com.utez.edu.sigeabackend.modules.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "subject")
public class SubjectEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "weeks", nullable = false)
    private int weeks;

    // ******* RELACIONES ********

    /** Relación UNO A UNO con ModuleEntity */
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "module_id", unique = true)
    @JsonIgnore
    private ModuleEntity module;

    /**
     * Relación muchos-a-uno con UserEntity
     * Nueva columna relacionada "teacher_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    private UserEntity teacher;

    /**UNO A UNO con QualificationEntity*/
    @OneToOne(mappedBy = "subject", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval=true)
    @JsonIgnore
    private QualificationEntity qualification;


    public SubjectEntity() {
    }

    public SubjectEntity(long id, String name, int weeks, ModuleEntity module, UserEntity teacher, QualificationEntity qualification) {
        this.id = id;
        this.name = name;
        this.weeks = weeks;
        this.module = module;
        this.teacher = teacher;
        this.qualification = qualification;
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

    public int getWeeks() {
        return weeks;
    }

    public void setWeeks(int weeks) {
        this.weeks = weeks;
    }

    public ModuleEntity getModule() {
        return module;
    }

    public void setModule(ModuleEntity module) {
        this.module = module;
    }

    public UserEntity getTeacher() {
        return teacher;
    }

    public void setTeacher(UserEntity teacher) {
        this.teacher = teacher;
    }

    public QualificationEntity getQualification() {
        return qualification;
    }

    public void setQualification(QualificationEntity qualification) {
        this.qualification = qualification;
    }
}