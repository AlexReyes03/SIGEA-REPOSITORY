package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.CreateUserDto;
import com.utez.edu.sigeabackend.modules.entities.dto.UpdateUserDto;
import com.utez.edu.sigeabackend.modules.entities.dto.UserResponseDto;
import com.utez.edu.sigeabackend.modules.media.MediaEntity;
import com.utez.edu.sigeabackend.modules.media.MediaService;
import com.utez.edu.sigeabackend.modules.media.dto.MediaUploadResponseDto;
import com.utez.edu.sigeabackend.modules.repositories.PlantelRepository;
import com.utez.edu.sigeabackend.modules.repositories.RoleRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository    userRepo;
    private final PlantelRepository plantelRepo;
    private final RoleRepository    roleRepo;
    private final BCryptPasswordEncoder passwordEncoder;
    private final MediaService mediaService;

    public UserService(UserRepository userRepo,
                       PlantelRepository plantelRepo,
                       RoleRepository roleRepo,
                       BCryptPasswordEncoder passwordEncoder,
                       MediaService mediaService) {
        this.userRepo = userRepo;
        this.plantelRepo = plantelRepo;
        this.roleRepo = roleRepo;
        this.passwordEncoder = passwordEncoder;
        this.mediaService = mediaService;
    }

    // Helper
    private UserResponseDto toDto(UserEntity u) {
        String avatarUrl = (u.getAvatar() != null)
                ? "/sigea/api/media/raw/" + u.getAvatar().getCode()
                : null;

        return new UserResponseDto(
                u.getId(),
                u.getName(),
                u.getPaternalSurname(),
                u.getMaternalSurname(),
                u.getEmail(),
                u.getRegistrationNumber(),
                u.getStatus().name(),
                u.getPlantel().getId(),
                u.getPlantel().getName(),
                u.getRole().getId(),
                u.getRole().getRoleName(),
                u.getCreatedAt(),
                avatarUrl
        );
    }

    public ResponseEntity<List<UserResponseDto>> listAll() {
        var dtos = userRepo.findAll()
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    public ResponseEntity<UserResponseDto> findById(long id) {
        return userRepo.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @Transactional
    public ResponseEntity<UserResponseDto> create(CreateUserDto dto) {
        if (userRepo.existsByEmail(dto.email()) ||
                userRepo.existsByRegistrationNumber(dto.registrationNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        var plantel = plantelRepo.findById(dto.plantelId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Plantel no existe"
                ));
        var role = roleRepo.findById(dto.roleId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Role no existe"
                ));

        var user = new UserEntity();
        user.setName(dto.name());
        user.setPaternalSurname(dto.paternalSurname());
        user.setMaternalSurname(dto.maternalSurname());
        user.setEmail(dto.email());
        user.setRegistrationNumber(dto.registrationNumber());
        user.setPlantel(plantel);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(dto.password()));

        var saved = userRepo.save(user);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toDto(saved));
    }

    @Transactional
    public ResponseEntity<UserResponseDto> update(long id, UpdateUserDto dto) {
        return userRepo.findById(id)
                .map(existing -> {
                    if (dto.name() != null) existing.setName(dto.name());
                    if (dto.paternalSurname() != null) existing.setPaternalSurname(dto.paternalSurname());
                    if (dto.maternalSurname() != null) existing.setMaternalSurname(dto.maternalSurname());
                    if (dto.email() != null) existing.setEmail(dto.email());
                    if (dto.registrationNumber() != null) existing.setRegistrationNumber(dto.registrationNumber());
                    if (dto.status() != null) existing.setStatus(dto.status());

                    if (dto.plantelId() != null) {
                        var p = plantelRepo.findById(dto.plantelId())
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Plantel no existe"
                                ));
                        existing.setPlantel(p);
                    }
                    if (dto.roleId() != null) {
                        var r = roleRepo.findById(dto.roleId())
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Role no existe"
                                ));
                        existing.setRole(r);
                    }
                    if (dto.password() != null && !dto.password().isBlank()) {
                        existing.setPassword(passwordEncoder.encode(dto.password()));
                    }

                    var updated = userRepo.save(existing);
                    return ResponseEntity.ok(toDto(updated));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @Transactional
    public MediaUploadResponseDto uploadAvatar(Long userId, MultipartFile file) throws IOException {
        MediaUploadResponseDto dto = mediaService.storeAndReturnDto(file, MediaEntity.Purpose.AVATAR);

        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        MediaEntity avatarEntity = mediaService.getByCode(
                dto.url().substring(dto.url().lastIndexOf('/') + 1));
        user.setAvatar(avatarEntity);
        userRepo.save(user);

        return dto;
    }

    @Transactional
    public ResponseEntity<Void> delete(long id) {
        return userRepo.findById(id)
                .map(u -> {
                    userRepo.delete(u);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}

