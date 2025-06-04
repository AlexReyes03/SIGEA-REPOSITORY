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
    private final GroupRepository repository;
    private final UserRepository userRepository;
    private final CareerRepository careerRepository;
    private final CustomResponseEntity responseService;

    public GroupService(GroupRepository repository,
                        UserRepository userRepository,
                        CareerRepository careerRepository,
                        CustomResponseEntity responseService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.careerRepository = careerRepository;
        this.responseService = responseService;
    }

    //Trae todos los grupos
    public ResponseEntity<?> findAllGroups() {
        List<GroupEntity> groups = repository.findAll();
        if(groups.isEmpty()){
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Grupos encontrados", groups);
    }
    //Trae los grupos del docente
    public ResponseEntity<?> findGroupsByTeacher(long teacherId){
        List<GroupEntity> groups = repository.findByTeacherId(teacherId);
        if(groups.isEmpty()){
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Grupos del docente encontrados", groups);
    }

    //Trae los grupos por carrera
    public ResponseEntity<?> findGroupsByCareer(long careerId){
        List<GroupEntity> groups = repository.findByCareerId(careerId);
        if(groups.isEmpty()){
            responseService.get404Response();
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
    public ResponseEntity<?> create(GroupEntity group) {
        try {
            // 1) Verificar que el JSON haya traído un objeto `teacher` con al menos un `userId`.
            if (group.getTeacher() == null || group.getTeacher().getUserId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Falta el campo teacher.userId"
                );
            }
            // 2) Buscar UserEntity (docente) en BD
            UserEntity teacher = userRepository.findById(group.getTeacher().getUserId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Docente no encontrado con id " + group.getTeacher().getUserId()
                    ));
            // 3) Verificar que el JSON haya traído un objeto `career` con al menos un `careerId`.
            if (group.getCareer() == null || group.getCareer().getCareerId() == 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Falta el campo career.careerId"
                );
            }
            // 4) Buscar CareerEntity en BD
            CareerEntity career = careerRepository.findById(group.getCareer().getCareerId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Carrera no encontrada con id " + group.getCareer().getCareerId()
                    ));

            // 5) Asignar las entidades recuperadas a la entidad `group` antes de guardar
            group.setTeacher(teacher);
            group.setCareer(career);

            // 6) Persistir en BD
            GroupEntity saved = repository.save(group);
            return responseService.createResponse(
                    "Grupo creado exitosamente", HttpStatus.CREATED, saved
            );
        } catch (ResponseStatusException ex) {
            // Si fue lanzado por faltantes o IDs inválidos
            return responseService.getCustomResponse(
                    ex.getReason(), HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            // Cualquier otro error inesperado devuelve 400
            return responseService.get400Response();
        }
    }

    //Actualizar grupo
    public ResponseEntity<?> update(long id, GroupEntity groupData){
        Optional<GroupEntity> groupOpt = repository.findById(id);
        if(groupOpt.isEmpty()){
            return responseService.get404Response();
        }

        GroupEntity group = groupOpt.get();
        group.setName(groupData.getName());
        group.setStartTime(groupData.getStartTime());
        group.setEndTime(groupData.getEndTime());
        group.setWeekDay(groupData.getWeekDay());
        group.setCareer(groupData.getCareer());
        group.setTeacher(groupData.getTeacher());
        return responseService.getOkResponse("Grupo actualizado", repository.save(group));
    }


    // Eliminar grupo
    public ResponseEntity<?> delete(long id) {
        if (!repository.existsById(id)) {
            return responseService.get404Response();
        }
        repository.deleteById(id);
        return responseService.getOkResponse("Grupo eliminado exitosamente", null);
    }


}
