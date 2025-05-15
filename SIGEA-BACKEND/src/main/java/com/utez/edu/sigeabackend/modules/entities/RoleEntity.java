package com.utez.edu.sigeabackend.modules.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.apache.catalina.User;

import java.util.List;

@Entity
@Table(name = "role")
public class RoleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "role_name", nullable = false)
    private String role_name;

    //Relations
    //UN Rol pertenece a MUCHOS Usuarios
    /*@OneToMany(mappedBy = "role")
    @JsonIgnore
    private List<UserEntity> users;

     */

    public RoleEntity() {
    }

    public RoleEntity(long id, String role_name) {
        this.id = id;
        this.role_name = role_name;

    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getRole_name() {
        return role_name;
    }

    public void setRole_name(String role_name) {
        this.role_name = role_name;
    }

}
