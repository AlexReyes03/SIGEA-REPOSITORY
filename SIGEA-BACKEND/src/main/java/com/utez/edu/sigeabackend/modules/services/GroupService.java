package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.GroupEntity;
import com.utez.edu.sigeabackend.modules.repositories.GroupRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GroupService {
    private final GroupRepository repository;
    private final CustomResponseEntity responseService;

    public GroupService(GroupRepository repository, CustomResponseEntity responseService) {
        this.repository = repository;
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
    public ResponseEntity<?> create(GroupEntity group){
        try{
            GroupEntity saved = repository.save(group);
            return responseService.createResponse("Grupo creado exitosamente", HttpStatus.CREATED, saved);
        }catch(Exception e){
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
