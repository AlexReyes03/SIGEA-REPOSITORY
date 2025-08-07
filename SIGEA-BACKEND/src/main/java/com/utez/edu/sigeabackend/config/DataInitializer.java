package com.utez.edu.sigeabackend.config;

import com.utez.edu.sigeabackend.modules.entities.CampusEntity;
import com.utez.edu.sigeabackend.modules.entities.RoleEntity;
import com.utez.edu.sigeabackend.modules.repositories.CampusRepository;
import com.utez.edu.sigeabackend.modules.repositories.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Inicializa datos básicos del sistema al arrancar la aplicación.
 * Se ejecuta después de que Spring haya inicializado completamente el contexto.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final CampusRepository campusRepository;

    public DataInitializer(RoleRepository roleRepository, CampusRepository campusRepository) {
        this.roleRepository = roleRepository;
        this.campusRepository = campusRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        logger.info("Iniciando configuración automática de datos del sistema...");

        initializeRoles();
        initializeCampus();

        logger.info("Configuración automática de datos completada.");
    }

    /**
     * Inicializa los roles básicos del sistema si no existen.
     * El orden está mezclado para proteger la identificación del rol DEV.
     */
    private void initializeRoles() {
        logger.info("Verificando e inicializando roles del sistema...");

        createRoleIfNotExists("STUDENT");
        createRoleIfNotExists("TEACHER");
        createRoleIfNotExists("ADMIN");
        createRoleIfNotExists("SUPERVISOR");
        createRoleIfNotExists("DEV");

        logger.info("Roles del sistema verificados.");
    }

    /**
     * Crea un rol si no existe en la base de datos.
     */
    private void createRoleIfNotExists(String roleName) {
        if (!roleRepository.existsByRoleName(roleName)) {
            RoleEntity role = new RoleEntity();
            role.setRoleName(roleName);
            roleRepository.save(role);
            logger.info("Rol '{}' creado automáticamente.", roleName);
        } else {
            logger.debug("Rol '{}' ya existe en el sistema.", roleName);
        }
    }

    /**
     * Inicializa los campus de CETEC si no existen.
     * Solo se crea el nombre.
     */
    private void initializeCampus() {
        logger.info("Verificando e inicializando campus del sistema...");

        createCampusIfNotExists("Temixco");
        createCampusIfNotExists("Jiutepec");

        logger.info("Campus del sistema verificados.");
    }

    /**
     * Crea un campus si no existe en la base de datos.
     */
    private void createCampusIfNotExists(String campusName) {
        if (!campusRepository.existsByName(campusName)) {
            CampusEntity campus = new CampusEntity();
            campus.setName(campusName);
            campusRepository.save(campus);
            logger.info("Campus '{}' creado automáticamente.", campusName);
        } else {
            logger.debug("Campus '{}' ya existe en el sistema.", campusName);
        }
    }
}