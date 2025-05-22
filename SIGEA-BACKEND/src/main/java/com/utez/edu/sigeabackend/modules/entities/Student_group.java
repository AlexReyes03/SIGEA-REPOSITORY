package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_group")

public class Student_group {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private LocalDateTime entryDate;

    // ******* RELACIONES ********
    /**
     * Relación muchos-a-uno con userEntity
     * Nueva columna relacionada "student_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id")
    private UserEntity student;

    /**
     * Relación muchos-a-uno con GroupEntity
     * Nueva columna relacionada "group_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "group_id")
    private GroupEntity group;


    public Student_group() {
    }

    public Student_group(long id, UserEntity student, GroupEntity group, LocalDateTime entryDate) {
        this.id = id;
        this.student = student;
        this.group = group;
        this.entryDate = entryDate;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public UserEntity getStudent() {
        return student;
    }

    public void setStudent(UserEntity student) {
        this.student = student;
    }

    public GroupEntity getGroup() {
        return group;
    }

    public void setGroup(GroupEntity group) {
        this.group = group;
    }

    public LocalDateTime getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDateTime entryDate) {
        this.entryDate = entryDate;
    }
}

