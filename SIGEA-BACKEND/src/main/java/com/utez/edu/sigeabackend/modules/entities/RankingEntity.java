package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "ranking")
public class RankingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "comment", nullable = false)
    private String comment;

    @Column(name = "qualification", nullable = false)
    private int qualification;

    @Column(name = "date", nullable = false)
    private Date date;

    //Relations
    //1. MUCHOS rankings puede tener UN Usuario (Maestro)
    //2. UN Estudiante puede hacer muchas calificaciones al Maestro

}
