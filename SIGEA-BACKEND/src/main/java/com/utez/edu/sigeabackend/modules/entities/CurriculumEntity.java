package com.utez.edu.sigeabackend.modules.entities;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "curriculum")
public class CurriculumEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    // ******* RELACIONES ********

    // Relation: Muchos curriculums pertenecen a una carrera
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "career_id", nullable = false)
    private CareerEntity career;

    // Relation: Un curriculum tiene muchos módulos
    @OneToMany(mappedBy = "curriculum", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ModuleEntity> modules;
}
