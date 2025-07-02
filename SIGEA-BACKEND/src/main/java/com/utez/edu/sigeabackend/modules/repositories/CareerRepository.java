package com.utez.edu.sigeabackend.modules.repositories;

import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CareerDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CareerRepository extends JpaRepository<CareerEntity, Long> {

    // Verificar si existe un diferenciador en un campus específico
    boolean existsByDifferentiatorAndCampusId(String differentiator, Long campusId);

    // Encontrar carreras por campus
    List<CareerEntity> findByCampusId(Long campusId);

    // Encontrar carrera por diferenciador y campus
    Optional<CareerEntity> findByDifferentiatorAndCampusId(String differentiator, Long campusId);

    @Query("SELECT new com.utez.edu.sigeabackend.modules.entities.dto.academics.CareerDto(" +
            "c.id, c.name, c.differentiator, c.campus.id, c.campus.name, " +
            "CAST(" +
            "  (SELECT COUNT(g) FROM GroupEntity g WHERE g.career.id = c.id)" +
            " AS int), " +
            "CAST(" +
            "  (SELECT COUNT(DISTINCT e1.user.id) FROM UserCareerEnrollmentEntity e1 " +
            "   WHERE e1.career.id = c.id AND e1.status = 'ACTIVE' AND e1.user.role.roleName = 'STUDENT')" +
            " AS int), " +
            "CAST(" +
            "  (SELECT COUNT(DISTINCT e2.user.id) FROM UserCareerEnrollmentEntity e2 " +
            "   WHERE e2.career.id = c.id AND e2.status = 'ACTIVE' AND e2.user.role.roleName = 'TEACHER')" +
            " AS int)" +
            ") " +
            "FROM CareerEntity c " +
            "ORDER BY c.name ASC")
    List<CareerDto> findAllWithCounts();

    @Query("SELECT new com.utez.edu.sigeabackend.modules.entities.dto.academics.CareerDto(" +
            "c.id, c.name, c.differentiator, c.campus.id, c.campus.name, " +
            "CAST(" +
            "  (SELECT COUNT(g) FROM GroupEntity g WHERE g.career.id = c.id)" +
            " AS int), " +
            "CAST(" +
            "  (SELECT COUNT(DISTINCT e1.user.id) FROM UserCareerEnrollmentEntity e1 " +
            "   WHERE e1.career.id = c.id AND e1.status = 'ACTIVE' AND e1.user.role.roleName = 'STUDENT')" +
            " AS int), " +
            "CAST(" +
            "  (SELECT COUNT(DISTINCT e2.user.id) FROM UserCareerEnrollmentEntity e2 " +
            "   WHERE e2.career.id = c.id AND e2.status = 'ACTIVE' AND e2.user.role.roleName = 'TEACHER')" +
            " AS int)" +
            ") " +
            "FROM CareerEntity c " +
            "WHERE c.campus.id = :campusId " +
            "ORDER BY c.name ASC")
    List<CareerDto> findAllWithCountsByCampus(@Param("campusId") Long campusId);

    // Obtener solo carreras con estudiantes activos
    @Query("SELECT DISTINCT c FROM CareerEntity c " +
            "JOIN c.enrollments e " +
            "WHERE e.status = 'ACTIVE' AND c.campus.id = :campusId")
    List<CareerEntity> findActiveCareersWithStudents(@Param("campusId") Long campusId);

    // Contar estudiantes por carrera
    @Query("SELECT COUNT(DISTINCT e.user.id) FROM CareerEntity c " +
            "JOIN c.enrollments e " +
            "WHERE c.id = :careerId AND e.status = 'ACTIVE' " +
            "AND e.user.role.roleName = 'STUDENT'")
    long countStudentsByCareer(@Param("careerId") Long careerId);

    // Contar maestros por carrera
    @Query("SELECT COUNT(DISTINCT e.user.id) FROM CareerEntity c " +
            "JOIN c.enrollments e " +
            "WHERE c.id = :careerId AND e.status = 'ACTIVE' " +
            "AND e.user.role.roleName = 'TEACHER'")
    long countTeachersByCareer(@Param("careerId") Long careerId);

    // Contar grupos por carrera
    @Query("SELECT COUNT(g) FROM CareerEntity c " +
            "JOIN c.groups g " +
            "WHERE c.id = :careerId")
    long countGroupsByCareer(@Param("careerId") Long careerId);

    // Buscar carreras que contengan cierto texto en el nombre
    @Query("SELECT c FROM CareerEntity c WHERE " +
            "LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(c.differentiator) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<CareerEntity> searchByNameOrDifferentiator(@Param("searchTerm") String searchTerm);

    // Obtener carreras con sus totales de inscripciones (incluye inactivas)
    @Query("SELECT c FROM CareerEntity c " +
            "LEFT JOIN FETCH c.enrollments e " +
            "WHERE c.campus.id = :campusId")
    List<CareerEntity> findByCampusIdWithEnrollments(@Param("campusId") Long campusId);

    // Verificar si una carrera tiene inscripciones activas
    @Query("SELECT COUNT(e) > 0 FROM CareerEntity c " +
            "JOIN c.enrollments e " +
            "WHERE c.id = :careerId AND e.status = 'ACTIVE'")
    boolean hasActiveEnrollments(@Param("careerId") Long careerId);

    // Verificar si una carrera tiene grupos
    @Query("SELECT COUNT(g) > 0 FROM CareerEntity c " +
            "JOIN c.groups g " +
            "WHERE c.id = :careerId")
    boolean hasGroups(@Param("careerId") Long careerId);
}