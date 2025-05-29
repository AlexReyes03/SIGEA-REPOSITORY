package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "career")
public class CareerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long careerId;

    @Column(name = "name", nullable = false)
    private String name;

    // ******* RELACIONES ********
    /**
     * Relación muchos-a-uno con plantel
     * Nueva columna relacionada "plantel_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plantel_id")
    private PlantelEntity plantel;

    /**
     * Relación uno-a-muchos con GroupEntity.
     * mappedBy = "career" porque en GroupEntity la Lista se llama career
     */
    @OneToMany(mappedBy = "career", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<GroupEntity> groups = new HashSet<>();

    @OneToMany(mappedBy = "career", fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<ModuleEntity> modules = new HashSet<>();

    public CareerEntity() {
    }

    public CareerEntity(long careerId, String name, PlantelEntity plantel, Set<GroupEntity> groups, Set<ModuleEntity> modules) {
        this.careerId = careerId;
        this.name = name;
        this.plantel = plantel;
        this.groups = groups;
        this.modules = modules;
    }

    public long getId() {
        return careerId;
    }

    public void setId(long id) {
        this.careerId = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public Set<ModuleEntity> getModules() {
        return modules;
    }

    public void setModules(Set<ModuleEntity> modules) {
        this.modules = modules;
    }
}

