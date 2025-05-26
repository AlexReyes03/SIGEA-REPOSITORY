package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "group_table")
public class GroupEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "group_id")
    private long groupId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name= "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "week_day", nullable = false)
    private WeekDays weekDay;

    // Relación con el docente
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id", nullable = false)
    private UserEntity teacher;

    // Relación con la carrera
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "career_id", nullable = false)
    private CareerEntity career;

    // Estudiantes asignados al grupo
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<GroupStudentEntity> students = new HashSet<>();

    public GroupEntity() {
    }

    public GroupEntity(long groupId, String name, LocalTime startTime, LocalTime endTime, WeekDays weekDay, UserEntity teacher, CareerEntity career, Set<GroupStudentEntity> students) {
        this.groupId = groupId;
        this.name = name;
        this.startTime = startTime;
        this.endTime = endTime;
        this.weekDay = weekDay;
        this.teacher = teacher;
        this.career = career;
        this.students = students;
    }

    public Long getId() {
        return groupId;
    }

    public void setId(Long groupId) {
        this.groupId = groupId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public WeekDays getWeekDay() {
        return weekDay;
    }

    public void setWeekDay(WeekDays weekDay) {
        this.weekDay = weekDay;
    }

    public UserEntity getTeacher() {
        return teacher;
    }

    public void setTeacher(UserEntity teacher) {
        this.teacher = teacher;
    }

    public CareerEntity getCareer() {
        return career;
    }

    public void setCareer(CareerEntity career) {
        this.career = career;
    }

    public Set<GroupStudentEntity> getStudents() {
        return students;
    }

    public void setStudents(Set<GroupStudentEntity> students) {
        this.students = students;
    }
}
