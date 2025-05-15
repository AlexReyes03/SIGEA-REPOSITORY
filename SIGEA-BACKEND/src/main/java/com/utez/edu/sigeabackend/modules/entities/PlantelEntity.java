package com.utez.edu.sigeabackend.modules.entities;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.List;


@Entity
@Table(name = "plantel")
public class PlantelEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "name", nullable = false)
    private String name;

    //Relations
    /*
    @OneToMany(mappedBy = "plantel")
    @JsonIgnore
    private List<UserEntity> users;

    @OneToMany(mappedBy = "plantel")
    @JsonIgnore
    private List<CareerEntity> careers;
    */
    public PlantelEntity() {
    }

    public PlantelEntity(long id, String name) {
        this.id = id;
        this.name = name;

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

  
}
