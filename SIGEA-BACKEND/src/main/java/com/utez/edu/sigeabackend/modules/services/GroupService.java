package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.GroupEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.CareerRepository;
import com.utez.edu.sigeabackend.modules.repositories.GroupRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class GroupService {
    private final GroupRepository     repository;
    private final UserRepository      userRepository;
    private final CareerRepository    careerRepository;
    private final CustomResponseEntity responseService;

    public GroupService(GroupRepository repository,
                        UserRepository userRepository,
                        CareerRepository careerRepository,
                        CustomResponseEntity responseService) {
        this.repository       = repository;
        this.userRepository   = userRepository;
        this.careerRepository = careerRepository;
        this.responseService  = responseService;
    }

    //Trae todos los grupos
    public ResponseEntity<?> findAllGroups() {
        List<GroupEntity> groups = repository.findAll();
        if (groups.isEmpty()) {
            return responseService.getOkResponse("No hay grupos registrados", null);
        }
        return responseService.getOkResponse("Grupos encontrados", groups);
    }

    //Trae los grupos del docente
    public ResponseEntity<?> findGroupsByTeacher(long teacherId) {
        List<GroupEntity> groups = repository.findByTeacherId(teacherId);
        if (groups.isEmpty()) {
            return responseService.getOkResponse("No hay grupos registrados", null);
        }
        return responseService.getOkResponse("Grupos del docente encontrados", groups);
    }

    //Trae los grupos por carrera
    public ResponseEntity<?> findGroupsByCareer(long careerId) {
        List<GroupEntity> groups = repository.findByCareerId(careerId);
        if (groups.isEmpty()) {
            return responseService.getOkResponse("No hay grupos registrados", null);
        }
        return responseService.getOkResponse("Grupos por carrera encontrados", groups);
    }

    //Grupo por ID
    public ResponseEntity<?> findById(long id) {
        Optional<GroupEntity> groupOpt = repository.findById(id);
        if (groupOpt.isPresent()) {
            return responseService.getOkResponse("Grupo encontrado", groupOpt.get());
        } else {
            return responseService.get404Response();
        }
    }

    //Agregar grupo
    @Transactional
    public ResponseEntity<GroupEntity> create(GroupEntity group) {
        // 1) Validar que venga un teacher.id
        if (group.getTeacher() == null || group.getTeacher().getId() == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Falta el campo teacher.id"
            );
        }
        // 2) Obtener UserEntity (docente)
        UserEntity teacher = userRepository.findById(group.getTeacher().getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Docente no encontrado con id " + group.getTeacher().getId()
                ));
        // 3) Validar que venga un career.id
        if (group.getCareer() == null || group.getCareer().getId() == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Falta el campo career.id"
            );
        }
        // 4) Obtener CareerEntity
        CareerEntity career = careerRepository.findById(group.getCareer().getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Carrera no encontrada con id " + group.getCareer().getId()
                ));

        // 5) Asignar relaciones antes de guardar
        group.setTeacher(teacher);
        group.setCareer(career);

        GroupEntity saved = repository.save(group);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    //Actualizar grupo
    @Transactional
    public ResponseEntity<GroupEntity> update(long id, GroupEntity groupData) {
        Optional<GroupEntity> groupOpt = repository.findById(id);
        if (groupOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        GroupEntity group = groupOpt.get();

        // Actualizar sólo campos permitidos
        group.setName(groupData.getName());
        group.setStartTime(groupData.getStartTime());
        group.setEndTime(groupData.getEndTime());
        group.setWeekDay(groupData.getWeekDay());

        // Si vienen relaciones de teacher o career en el JSON, validarlas:
        if (groupData.getTeacher() != null && groupData.getTeacher().getId() != 0) {
            UserEntity teacher = userRepository.findById(groupData.getTeacher().getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Docente no encontrado con id " + groupData.getTeacher().getId()
                    ));
            group.setTeacher(teacher);
        }
        if (groupData.getCareer() != null && groupData.getCareer().getId() != 0) {
            CareerEntity careerEntity = careerRepository.findById(groupData.getCareer().getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Carrera no encontrada con id " + groupData.getCareer().getId()
                    ));
            group.setCareer(careerEntity);
        }

        GroupEntity updated = repository.save(group);
        return ResponseEntity.ok(updated);
    }

    // Eliminar grupo
    @Transactional
    public ResponseEntity<Void> delete(long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
