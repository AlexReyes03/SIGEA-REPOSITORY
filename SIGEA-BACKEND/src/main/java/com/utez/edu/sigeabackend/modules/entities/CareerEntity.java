package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "career")
public class CareerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "name", nullable = false)
    private String name;

    //Relations
    //1. UN plantel puede tener MUCHOS grupos


}
