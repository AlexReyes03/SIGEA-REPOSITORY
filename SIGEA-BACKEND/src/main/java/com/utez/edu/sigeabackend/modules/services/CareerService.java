package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.CampusEntity;
import com.utez.edu.sigeabackend.modules.entities.CareerEntity;
import com.utez.edu.sigeabackend.modules.entities.UserCareerEnrollmentEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CareerDto;
import com.utez.edu.sigeabackend.modules.entities.dto.academics.CreateCareerDto;
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

    // Helper method to convert entity to DTO
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

        // Obtener URL de la imagen si existe
        String imageUrl = null;
        if (entity.getImage() != null) {
            imageUrl = "/sigea/api/media/raw/" + entity.getImage().getCode();
        }

        return new CareerDto(
                entity.getId(),
                entity.getName(),
                entity.getDifferentiator(),
                entity.getCampus().getId(),
                entity.getCampus().getName(),
                groupsCount,
                studentsCount,
                teachersCount,
                imageUrl
        );
    }

    // Obtener todas las carreras
    public ResponseEntity<List<CareerDto>> findAll() {
        List<CareerEntity> entities = repository.findAll();
        List<CareerDto> dtos = entities.stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    // Obtener carrera por ID
    public ResponseEntity<CareerDto> findById(long id) {
        return repository.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Obtener carreras por plantel
    public ResponseEntity<List<CareerDto>> findByCampus(long campusId) {
        List<CareerEntity> entities = repository.findByCampusId(campusId);
        List<CareerDto> dtos = entities.stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    // Subir imagen de carrera
    @Transactional
    public ResponseEntity<MediaUploadResponseDto> uploadCareerImage(Long careerId, MultipartFile file) throws IOException {
        // Verificar que la carrera existe
        CareerEntity career = repository.findById(careerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Carrera no encontrada"));

        // Subir la imagen
        MediaUploadResponseDto dto = mediaService.storeAndReturnDto(file, MediaEntity.Purpose.CAREER_IMAGE);

        // Obtener la entidad media por código
        MediaEntity imageEntity = mediaService.getByCode(
                dto.url().substring(dto.url().lastIndexOf('/') + 1));

        // Asignar la imagen a la carrera
        career.setImage(imageEntity);
        repository.save(career);

        return ResponseEntity.ok(dto);
    }

    // Crear nueva carrera
    @Transactional
    public ResponseEntity<CareerDto> save(CreateCareerDto dto) {
        // Verificar que el plantel existe
        CampusEntity plantel = campusRepository.findById(dto.campusId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Campus no encontrado"));

        // Verificar que el diferenciador no existe en este plantel
        if (repository.existsByDifferentiatorAndCampusId(dto.differentiator(), dto.campusId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe una carrera con este diferenciador en el plantel");
        }

        // Validar formato del diferenciador
        if (!dto.differentiator().matches("^[A-Z0-9]{1,5}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El diferenciador debe contener solo letras mayúsculas y números, máximo 5 caracteres");
        }

        // Crear la carrera
        CareerEntity career = new CareerEntity(dto.name(), dto.differentiator(), plantel);
        CareerEntity saved = repository.save(career);

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    // Actualizar carrera
    @Transactional
    public ResponseEntity<CareerDto> update(long id, UpdateCareerDto dto) {
        return repository.findById(id)
                .map(existing -> {
                    // Actualizar nombre si se proporciona
                    if (dto.name() != null && !dto.name().trim().isEmpty()) {
                        existing.setName(dto.name().trim());
                    }

                    // Actualizar diferenciador si se proporciona
                    if (dto.differentiator() != null && !dto.differentiator().trim().isEmpty()) {
                        String newDifferentiator = dto.differentiator().trim().toUpperCase();

                        // Validar formato
                        if (!newDifferentiator.matches("^[A-Z0-9]{1,5}$")) {
                            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                    "El diferenciador debe contener solo letras mayúsculas y números, máximo 5 caracteres");
                        }

                        // Verificar que no existe otro con el mismo diferenciador en el plantel
                        if (!existing.getDifferentiator().equals(newDifferentiator) &&
                                repository.existsByDifferentiatorAndCampusId(newDifferentiator, existing.getCampus().getId())) {
                            throw new ResponseStatusException(HttpStatus.CONFLICT,
                                    "Ya existe una carrera con este diferenciador en el plantel");
                        }

                        existing.setDifferentiator(newDifferentiator);
                    }

                    // Actualizar plantel si se proporciona
                    if (dto.campusId() != null) {
                        CampusEntity plantel = campusRepository.findById(dto.campusId())
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Campus no encontrado"));

                        // Si cambia de plantel, verificar que el diferenciador no existe en el nuevo plantel
                        if (existing.getCampus().getId() != dto.campusId()) {
                            throw new ResponseStatusException(HttpStatus.CONFLICT,
                                    "Ya existe una carrera con este diferenciador en el plantel destino");
                        }

                        existing.setCampus(plantel);
                    }

                    CareerEntity updated = repository.save(existing);
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Eliminar carrera
    @Transactional
    public ResponseEntity<Void> delete(long id) {
        return repository.findById(id)
                .map(career -> {
                    // Verificar si la carrera tiene estudiantes activos
                    boolean hasActiveStudents = career.getEnrollments().stream()
                            .anyMatch(enrollment -> enrollment.getStatus() ==
                                    UserCareerEnrollmentEntity.EnrollmentStatus.ACTIVE);

                    if (hasActiveStudents) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "No se puede eliminar la carrera porque tiene estudiantes activos");
                    }

                    // Verificar si la carrera tiene grupos
                    if (!career.getGroups().isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "No se puede eliminar la carrera porque tiene grupos asociados");
                    }

                    repository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Verificar disponibilidad de diferenciador
    public ResponseEntity<Boolean> isDifferentiatorAvailable(String differentiator, Long campusId) {
        boolean available = !repository.existsByDifferentiatorAndCampusId(differentiator.toUpperCase(), campusId);
        return ResponseEntity.ok(available);
    }

    // Obtener carreras de un plantel específico (solo entidades)
    public List<CareerEntity> getCareersByCampus(Long campusId) {
        return repository.findByCampusId(campusId);
    }
}