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
    private long qualificationId;

    @Column(name = "value")
    private int value;

    @Column(name = "date", nullable = false)
    private Date date;

    // ******* RELACIONES ********
    /**
     * Relación muchos-a-uno con SubjectEntity
     * Nueva columna relacionada "subject_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subject_id")
    private SubjectEntity subject;

    /**
     * Relación muchos-a-uno con UserEntity
     * Nueva columna relacionada "student_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id")
    private UserEntity student;


    public QualificationEntity() {
    }

    public QualificationEntity(long qualificationId, int value, Date date, SubjectEntity subject, UserEntity student) {
        this.qualificationId = qualificationId;
        this.value = value;
        this.date = date;
        this.subject = subject;
        this.student = student;
    }

    public long getQualificationId() {
        return qualificationId;
    }

    public void setQualificationId(long qualificationId) {
        this.qualificationId = qualificationId;
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

    public void setDate(Date date) {
        this.date = date;
    }

    public SubjectEntity getSubject() {
        return subject;
    }

    public void setSubject(SubjectEntity subject) {
        this.subject = subject;
    }

    public UserEntity getStudent() {
        return student;
    }

    public void setStudent(UserEntity student) {
        this.student = student;
    }
}
