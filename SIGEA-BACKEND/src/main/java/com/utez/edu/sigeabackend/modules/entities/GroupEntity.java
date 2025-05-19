package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Date;

@Entity
@Table(name = "class_group")
public class GroupEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private long id;

    @Column(name = "startTime")
    private LocalTime startTime;

    @Column(name= "endTime")
    private LocalTime endTime;

    @Column(name = "startDate")
    private Date startDate;

    @Column(name = "endDate")
    private Date endDate;

    @Enumerated(EnumType.STRING)  // Almacena los días como texto en BD
    private WeekDays weekDay;


    //Relations
    //1. MUCHOS grupos pueden tener MUCHOS Usuarios (ESTUDIANTES)
    //2. MUCHOS estudiantes pueden tener MUCHOS Grupos



}
