package com.utez.edu.sigeabackend.modules.entities;

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

    @Column(name = "week", nullable = false)
    private int week;

    //Relations
    //1. MUCHAS Materias pertenecen a UN Docente
    //2. MUCHAS Materias pertenencen a UN Módulo
    //3. UNA Materia puede tener UNA Calificacion
    //4. MUCHAS Materias pertenencen a UN Estudiante




}
