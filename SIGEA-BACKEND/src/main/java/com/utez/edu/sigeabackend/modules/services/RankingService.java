package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.RankingEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.repositories.RankingRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class RankingService {
    private final RankingRepository repository;
    private final UserRepository userRepository;
    private final CustomResponseEntity responseService;

    public RankingService(RankingRepository repository, UserRepository userRepository, CustomResponseEntity responseService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.responseService = responseService;
    }

    public ResponseEntity<?> findAll() {
        List<RankingEntity> list = repository.findAll();
        if (list.isEmpty()) {
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Lista de rankings", list);
    }

    // Buscar por id
    public ResponseEntity<?> findById(long id) {
        Optional<RankingEntity> optional = repository.findById(id);
        if (optional.isPresent()) {
            return responseService.getOkResponse("Ranking encontrado", optional.get());
        }
        return responseService.get404Response();
    }

    // Crear ranking
    public ResponseEntity<?> create(RankingEntity ranking, long teacherId, long studentId) {
        Optional<UserEntity> teacherOpt = userRepository.findById(teacherId);
        Optional<UserEntity> studentOpt = userRepository.findById(studentId);

        if (teacherOpt.isEmpty() || studentOpt.isEmpty()) {
            return responseService.get404Response();
        }

        ranking.setTeacher(teacherOpt.get());
        ranking.setStudent(studentOpt.get());
        ranking.setDate(new Date());
        RankingEntity saved = repository.save(ranking);
        return responseService.getOkResponse("Ranking creado", saved);
    }

    // Actualizar ranking
    public ResponseEntity<?> update(long id, RankingEntity ranking) {
        Optional<RankingEntity> optional = repository.findById(id);
        if (optional.isPresent()) {
            RankingEntity existing = optional.get();
            existing.setComment(ranking.getComment());
            existing.setStar(ranking.getStar());
            existing.setDate(new Date());
            repository.save(existing);
            return responseService.getOkResponse("Ranking actualizado", existing);
        }
        return responseService.get404Response();
    }

    // Eliminar ranking
    public ResponseEntity<?> delete(long id) {
        Optional<RankingEntity> optional = repository.findById(id);
        if (optional.isPresent()) {
            repository.deleteById(id);
            return responseService.getOkResponse("Ranking eliminado", null);
        }
        return responseService.get404Response();
    }

    // Listar por docente
    public ResponseEntity<?> findByTeacher(long teacherId) {
        List<RankingEntity> list = repository.findByTeacherId(teacherId);
        if (list.isEmpty()) {
            return responseService.get404Response();
        }
        return responseService.getOkResponse("Rankings del docente", list);
    }

}
