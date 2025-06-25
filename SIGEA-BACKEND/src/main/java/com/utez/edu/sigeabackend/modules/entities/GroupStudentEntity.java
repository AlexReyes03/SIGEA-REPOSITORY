package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "student_group")

public class GroupStudentEntity {
    @Embeddable
    public static class Id implements Serializable {
        @Column(name = "group_id")
        private long groupId;

        @Column(name = "student_id")
        private long studentId;

        // constructor, equals & hashCode
        public Id() {
        }

        public Id(long groupId, long studentId) {
            this.groupId = groupId;
            this.studentId = studentId;
        }

        //Permite que Hibernate reconozca correctamente la identidad de la fila en su caché y en las asociaciones.
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id)) return false;
            Id that = (Id) o;
            return Objects.equals(groupId, that.groupId) &&
                    Objects.equals(studentId, that.studentId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(groupId, studentId);
        }

        // getters & setters
        public long getGroupId() {
            return groupId;
        }

        public void setGroupId(long groupId) {
            this.groupId = groupId;
        }

        public long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }
    }

    @EmbeddedId
    private Id id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("groupId")
    @JoinColumn(name = "group_id")
    private GroupEntity group;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("studentId")
    @JoinColumn(name = "student_id")
    private UserEntity student;

    @Column(name = "entry_date", nullable = false)
    private LocalDateTime entryDate;

    public GroupStudentEntity() {}

    public GroupStudentEntity(GroupEntity group, UserEntity student) {
        this.group = group;
        this.student = student;
        this.id = new Id(group.getId(), student.getId());
        this.entryDate = LocalDateTime.now();
    }

    // getters & setters
    public Id getId() { return id; }
    public void setId(Id id) { this.id = id; }
    public GroupEntity getGroup() { return group; }
    public void setGroup(GroupEntity group) { this.group = group; }
    public UserEntity getStudent() { return student; }
    public void setStudent(UserEntity student) { this.student = student; }
    public LocalDateTime getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDateTime entryDate) { this.entryDate = entryDate; }

}