package com.utez.edu.sigeabackend.modules.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "plantel")
public class PlantelEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long plantelId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * Relación uno-a-muchos con UserEntity.
     * mappedBy = "plantel" porque en UserEntity la propiedad se llama plantel.
     * JsonIgnore para no exponer la lista de usuarios al serializar.
     */
    @OneToMany(
            mappedBy = "plantel",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnore
    private List<UserEntity> users = new ArrayList<>();

    public PlantelEntity() {}

    public PlantelEntity(long id, String name) {
        this.plantelId = id;
        this.name = name;
    }

    // Getters & setters

    public long getId() {
        return plantelId;
    }

    public void setId(long id) {
        this.plantelId = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<UserEntity> getUsers() {
        return users;
    }

    public void setUsers(List<UserEntity> users) {
        this.users = users;
    }
}