package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.config.CustomResponseEntity;
import com.utez.edu.sigeabackend.modules.entities.RankingEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.RankingDto;
import com.utez.edu.sigeabackend.modules.repositories.RankingRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class RankingService {
    private final RankingRepository repository;
    private final UserRepository userRepository;
    private final CustomResponseEntity responseService;

    public RankingService(RankingRepository repository,
                          UserRepository userRepository,
                          CustomResponseEntity responseService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.responseService = responseService;
    }

    private RankingDto toDto(RankingEntity ranking) {
        UserEntity student = ranking.getStudent();

        String fullName = buildFullName(student.getName(),
                student.getPaternalSurname(),
                student.getMaternalSurname());

        String avatarUrl = student.getAvatar() != null ?
                "/sigea/api/media/raw/" + student.getAvatar().getCode() : null;

        RankingDto.StudentInfoDto studentInfo = new RankingDto.StudentInfoDto(
                student.getId(),
                fullName,
                student.getEmail(),
                avatarUrl,
                student.getCampus().getName(),
                student.getCampus().getId()
        );

        return new RankingDto(
                ranking.getId(),
                ranking.getComment(),
                ranking.getStar(),
                ranking.getDate(),
                ranking.getTeacher().getId(),
                studentInfo
        );
    }

    private String buildFullName(String name, String paternalSurname, String maternalSurname) {
        StringBuilder fullName = new StringBuilder(name);

        if (paternalSurname != null && !paternalSurname.trim().isEmpty()) {
            fullName.append(" ").append(paternalSurname);
        }

        if (maternalSurname != null && !maternalSurname.trim().isEmpty()) {
            fullName.append(" ").append(maternalSurname);
        }

        return fullName.toString();
    }

    public ResponseEntity<?> findAll() {
        List<RankingEntity> list = repository.findAllWithDetails();
        if (list.isEmpty()) {
            return responseService.getOkResponse("Lista de rankings", null);
        }

        List<RankingDto> dtos = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return responseService.getOkResponse("Lista de rankings", dtos);
    }

    public ResponseEntity<?> findById(long id) {
        Optional<RankingEntity> ranking = repository.findById(id);
        if (ranking.isPresent()) {
            return responseService.getOkResponse("Ranking encontrado", toDto(ranking.get()));
        } else {
            return responseService.get404Response();
        }
    }

    public ResponseEntity<?> findByTeacher(long teacherId) {
        if (!userRepository.existsById(teacherId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El docente especificado no existe"));
        }

        List<RankingEntity> list = repository.findByTeacherIdWithDetails(teacherId);
        if (list.isEmpty()) {
            return responseService.getOkResponse("Rankings del docente", null);
        }

        List<RankingDto> dtos = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return responseService.getOkResponse("Rankings del docente", dtos);
    }

    @Transactional
    public ResponseEntity<?> create(RankingEntity ranking, long teacherId, long studentId) {
        try {
            // Validar que teacher y student existan
            Optional<UserEntity> teacherOpt = userRepository.findById(teacherId);
            Optional<UserEntity> studentOpt = userRepository.findById(studentId);

            if (teacherOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El docente especificado no existe"));
            }

            if (studentOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El estudiante especificado no existe"));
            }

            // Validar que el estudiante no haya calificado ya al docente
            if (repository.existsByStudentIdAndTeacherId(studentId, teacherId)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Este estudiante ya ha calificado a este docente"));
            }

            // Validar estrellas (1-5)
            if (ranking.getStar() < 1 || ranking.getStar() > 5) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "La calificación debe estar entre 1 y 5 estrellas"));
            }

            // Validar comentario
            if (ranking.getComment() == null || ranking.getComment().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El comentario es obligatorio"));
            }

            ranking.setTeacher(teacherOpt.get());
            ranking.setStudent(studentOpt.get());

            RankingEntity saved = repository.save(ranking);
            return responseService.getOkResponse("Ranking creado exitosamente", null);

        } catch (Exception e) {
            if (e.getMessage().contains("Data too long")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El comentario excede la longitud máxima permitida"));
            } else {
                return ResponseEntity.status(500)
                        .body(Map.of("error", "Error interno al crear el ranking"));
            }
        }
    }
}