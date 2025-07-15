package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ranking")
public class RankingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private long id;

    @Column(name = "comment", nullable = false, columnDefinition = "TEXT")
    private String comment;

    @Column(name = "star", nullable = false)
    private int star;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    // ******* RELACIONES ********

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private UserEntity teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserEntity student;

    @PrePersist
    protected void onCreate() {
        this.date = LocalDateTime.now();
    }

    // Constructors
    public RankingEntity() {
    }

    public RankingEntity(String comment, int star, UserEntity teacher, UserEntity student) {
        this.comment = comment;
        this.star = star;
        this.teacher = teacher;
        this.student = student;
    }

    public RankingEntity(long id, String comment, int star, LocalDateTime date, UserEntity teacher, UserEntity student) {
        this.id = id;
        this.comment = comment;
        this.star = star;
        this.date = date;
        this.teacher = teacher;
        this.student = student;
    }

    // Getters and Setters
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public int getStar() {
        return star;
    }

    public void setStar(int star) {
        this.star = star;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public UserEntity getTeacher() {
        return teacher;
    }

    public void setTeacher(UserEntity teacher) {
        this.teacher = teacher;
    }

    public UserEntity getStudent() {
        return student;
    }

    public void setStudent(UserEntity student) {
        this.student = student;
    }
}