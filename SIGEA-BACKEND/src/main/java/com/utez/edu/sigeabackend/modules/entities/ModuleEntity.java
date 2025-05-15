package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "module")
public class ModuleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "name", nullable = false)
    private String name;

    //Relations
    //1. Muchos modulos pertenencen a UNA carrera
    //2. Un modulo puede tener muchas Materias


}
