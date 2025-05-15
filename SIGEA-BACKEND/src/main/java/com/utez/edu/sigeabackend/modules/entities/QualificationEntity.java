package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "qualification")
public class QualificationEntity {
    //Atributes
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "value")
    private int value;

    @Column(name = "date", nullable = false)
    private Date date;

    //Relations
    //MUCHAS Calificaciones puede tener UN Usuario


    public QualificationEntity() {
    }

    public QualificationEntity(long id, int value, Date date) {
        this.id = id;
        this.value = value;
        this.date = date;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        this.value = value;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date Date) {
        this.date = Date;
    }

}
