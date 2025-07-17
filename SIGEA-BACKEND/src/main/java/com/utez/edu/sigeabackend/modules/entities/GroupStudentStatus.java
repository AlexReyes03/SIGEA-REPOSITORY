package com.utez.edu.sigeabackend.modules.entities;

/**
 * Enumeración para el estado de inscripción de un estudiante en un grupo
 */
public enum GroupStudentStatus {
    ACTIVE,    // Estudiante actualmente inscrito en el grupo
    INACTIVE   // Estudiante que ya no está activo en el grupo (historial)
}