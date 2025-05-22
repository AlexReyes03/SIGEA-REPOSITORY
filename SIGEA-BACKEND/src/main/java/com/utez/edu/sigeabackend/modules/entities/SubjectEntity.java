package com.utez.edu.sigeabackend.modules.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

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

    /**
     * Relación muchos-a-uno con ModuleEntity
     * Nueva columna relacionada "module_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "module_id")
    private ModuleEntity module;

    /**
     * Relación muchos-a-uno con UserEntity
     * Nueva columna relacionada "teacher_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    private UserEntity teacher;

    /**
     * Relación uno-a-muchos con QualificationEntity
     * mappedBy = "subject" porque en QualificationEntity la propiedad se llama subject.
     * JsonIgnore para no exponer la lista de calificaciones al serializar.
     * Coleccion Hash
     */
    @OneToMany( mappedBy = "subject",
                fetch = FetchType.EAGER,
                cascade = CascadeType.ALL
    )
    @JsonIgnore
    private Set<QualificationEntity> qualification = new HashSet<>();


    public SubjectEntity() {
    }

    public SubjectEntity(long id, String name, int weeks, ModuleEntity module, UserEntity teacher, Set<QualificationEntity> qualification) {
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

    public Set<QualificationEntity> getQualification() {
        return qualification;
    }

    public void setQualification(Set<QualificationEntity> qualification) {
        this.qualification = qualification;
    }
}