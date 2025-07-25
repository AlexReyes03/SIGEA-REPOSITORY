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

    @Column(name = "module_id")
    private Long moduleId;

    // ******* RELACIONES ********

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private UserEntity teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserEntity student;

    // Campos transitorios para recibir IDs en JSON
    @Transient
    private Long teacherId;

    @Transient
    private Long studentId;

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

    public RankingEntity(long id, String comment, int star, LocalDateTime date, Long moduleId, UserEntity teacher, UserEntity student, Long teacherId, Long studentId) {
        this.id = id;
        this.comment = comment;
        this.star = star;
        this.date = date;
        this.moduleId = moduleId;
        this.teacher = teacher;
        this.student = student;
        this.teacherId = teacherId;
        this.studentId = studentId;
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

    public Long getModuleId() {
        return moduleId;
    }

    public void setModuleId(Long moduleId) {
        this.moduleId = moduleId;
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

    // Getters and Setters para campos transitorios
    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }
}