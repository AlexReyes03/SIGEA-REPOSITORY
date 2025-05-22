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

    @Enumerated(EnumType.STRING)  // Colección de los días de la semana en BD
    private WeekDays weekDay;


    // ******* RELACIONES ********
    /**
     * Relación muchos-a-uno con userEntity
     * Nueva columna relacionada "teacher_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "teacher_id")
    private UserEntity teacher;

    /**
     * Relación muchos-a-uno con CareerEntity
     * Nueva columna relacionada "career_id"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "career_id")
    private CareerEntity career;

    public GroupEntity() {
    }

    public GroupEntity(long id, LocalTime startTime, LocalTime endTime, Date startDate, Date endDate, WeekDays weekDay, UserEntity teacher, CareerEntity career) {
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.startDate = startDate;
        this.endDate = endDate;
        this.weekDay = weekDay;
        this.teacher = teacher;
        this.career = career;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
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

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
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
}
