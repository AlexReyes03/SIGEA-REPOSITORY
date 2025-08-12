package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.CampusEntity;
import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.UserCareerEnrollmentEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CareerDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CreateCareerDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.PublicCareerDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.UpdateCareerDto;
import com.utez.edu.sigeabackend.modules.media.MediaEntity;
import com.utez.edu.sigeabackend.modules.media.MediaService;
import com.utez.edu.sigeabackend.modules.media.dto.MediaUploadResponseDto;
import com.utez.edu.sigeabackend.modules.repositories.CampusRepository;
import com.utez.edu.sigeabackend.modules.repositories.CareerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CareerService {
    private final CareerRepository repository;
    private final CampusRepository campusRepository;
    private final MediaService mediaService;

    public CareerService(CareerRepository repository, CampusRepository campusRepository, MediaService mediaService) {
        this.repository = repository;
        this.campusRepository = campusRepository;
        this.mediaService = mediaService;
    }

    private CareerDto toDto(CareerEntity entity) {
        int groupsCount = entity.getGroups() != null ? entity.getGroups().size() : 0;

        int studentsCount = (int) entity.getEnrollments().stream()
                .filter(enrollment -> enrollment.getStatus() ==
                        UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE)
                .filter(enrollment -> "STUDENT".equals(enrollment.getUser().getRole().getRoleName()))
                .count();

        int teachersCount = (int) entity.getEnrollments().stream()
                .filter(enrollment -> enrollment.getStatus() ==
                        UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE)
                .filter(enrollment -> "TEACHER".equals(enrollment.getUser().getRole().getRoleName()))
                .count();

        return new CareerDto(
                entity.getId(),
                entity.getName(),
                entity.getDifferentiator(),
                entity.getCampus().getId(),
                entity.getCampus().getName(),
                groupsCount,
                studentsCount,
                teachersCount
        );
    }

    public ResponseEntity<List<CareerDto>> findAll() {
        List<CareerEntity> entities = repository.findAll();
        List<CareerDto> dtos = entities.stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Obtener carreras públicas solo con imágenes para el carrusel
     * Este endpoint NO requiere autenticación
     */
    public ResponseEntity<List<PublicCareerDto>> findCareersForCarousel() {
        List<PublicCareerDto> careers = repository.findCareersWithImages();
        return ResponseEntity.ok(careers);
    }

    public ResponseEntity<CareerDto> findById(long id) {
        return repository.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public ResponseEntity<List<CareerDto>> findByCampus(long campusId) {
        List<CareerEntity> entities = repository.findByCampusId(campusId);
        List<CareerDto> dtos = entities.stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @Transactional
    public ResponseEntity<MediaUploadResponseDto> uploadCareerImage(Long careerId, MultipartFile file) throws IOException {
        CareerEntity career = repository.findById(careerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Carrera no encontrada"));

        MediaUploadResponseDto dto = mediaService.storeAndReturnDto(file, MediaEntity.Purpose.CAREER_IMAGE);

        MediaEntity imageEntity = mediaService.getByCode(
                dto.url().substring(dto.url().lastIndexOf('/') + 1));

        career.setImage(imageEntity);
        repository.save(career);

        return ResponseEntity.ok(dto);
    }

    @Transactional
    public ResponseEntity<CareerDto> save(CreateCareerDto dto) {
        CampusEntity plantel = campusRepository.findById(dto.campusId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Campus no encontrado"));

        if (!dto.differentiator().matches("^[A-Z0-9]{1,5}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El diferenciador debe contener solo letras mayúsculas y números, máximo 5 caracteres");
        }

        CareerEntity career = new CareerEntity(dto.name(), dto.differentiator(), plantel);
        CareerEntity saved = repository.save(career);

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @Transactional
    public ResponseEntity<CareerDto> update(long id, UpdateCareerDto dto) {
        return repository.findById(id)
                .map(existing -> {
                    if (dto.name() != null && !dto.name().trim().isEmpty()) {
                        existing.setName(dto.name().trim());
                    }

                    if (dto.differentiator() != null && !dto.differentiator().trim().isEmpty()) {
                        String newDifferentiator = dto.differentiator().trim().toUpperCase();

                        if (!newDifferentiator.matches("^[A-Z0-9]{1,5}$")) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "El diferenciador debe contener solo letras mayúsculas y números, máximo 5 caracteres");
                        }

                        existing.setDifferentiator(newDifferentiator);
                    }

                    if (dto.campusId() != null) {
                        CampusEntity plantel = campusRepository.findById(dto.campusId())
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Campus no encontrado"));

                        existing.setCampus(plantel);
                    }

                    CareerEntity updated = repository.save(existing);
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Transactional
    public ResponseEntity<Void> delete(long id) {
        return repository.findById(id)
                .map(career -> {
                    boolean hasActiveStudents = career.getEnrollments().stream()
                            .anyMatch(enrollment -> enrollment.getStatus() ==
                                    UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE);

                    if (hasActiveStudents) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "No se puede eliminar la carrera porque tiene estudiantes activos");
                    }

                    if (!career.getGroups().isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "No se puede eliminar la carrera porque tiene grupos asociados");
                    }

                    repository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public List<CareerEntity> getCareersByCampus(Long campusId) {
        return repository.findByCampusId(campusId);
    }
}