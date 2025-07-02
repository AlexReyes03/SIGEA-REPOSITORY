package com.utez.edu.sigeabackend.modules.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "plantel") // Mantenemos el nombre de tabla en BD
public class CampusEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * Relación uno-a-muchos con UserEntity.
     * Usuarios que pertenecen directamente a este campus.
     */
    @OneToMany(
            mappedBy = "campus",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnore
    private List<UserEntity> users = new ArrayList<>();

    /**
     * Relación muchos-a-muchos con UserEntity a través de UserCampusSupervisionEntity
     * Supervisores que tienen asignado este campus para supervisión.
     */
    @OneToMany(mappedBy = "campus", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private Set<UserCampusSupervisionEntity> supervisorAssignments = new HashSet<>();

    // Constructors
    public CampusEntity() {}

    public CampusEntity(long id, String name) {
        this.id = id;
        this.name = name;
    }

    public CampusEntity(String name) {
        this.name = name;
    }

    // Getters & Setters
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

    public List<UserEntity> getUsers() {
        return users;
    }

    public void setUsers(List<UserEntity> users) {
        this.users = users;
    }

    public Set<UserCampusSupervisionEntity> getSupervisorAssignments() {
        return supervisorAssignments;
    }

    public void setSupervisorAssignments(Set<UserCampusSupervisionEntity> supervisorAssignments) {
        this.supervisorAssignments = supervisorAssignments;
    }

    // Helper methods
    public void addUser(UserEntity user) {
        users.add(user);
        user.setCampus(this);
    }

    public void removeUser(UserEntity user) {
        users.remove(user);
        user.setCampus(null);
    }
}