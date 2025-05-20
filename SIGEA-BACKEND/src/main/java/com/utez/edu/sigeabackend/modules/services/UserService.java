package com.utez.edu.sigeabackend.modules.services;

import com.utez.edu.sigeabackend.modules.entities.PlantelEntity;
import com.utez.edu.sigeabackend.modules.entities.RoleEntity;
import com.utez.edu.sigeabackend.modules.entities.UserEntity;
import com.utez.edu.sigeabackend.modules.entities.dto.CreateUserDto;
import com.utez.edu.sigeabackend.modules.entities.dto.UpdateUserDto;
import com.utez.edu.sigeabackend.modules.repositories.PlantelRepository;
import com.utez.edu.sigeabackend.modules.repositories.RoleRepository;
import com.utez.edu.sigeabackend.modules.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository repository;
    private final PlantelRepository plantelRepo;
    private final RoleRepository roleRepo;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(
            UserRepository repository,
            PlantelRepository plantelRepo,
            RoleRepository roleRepo,
            BCryptPasswordEncoder passwordEncoder
    ) {
        this.repository = repository;
        this.plantelRepo = plantelRepo;
        this.roleRepo   = roleRepo;
        this.passwordEncoder = passwordEncoder;
    }

    public ResponseEntity<List<UserEntity>> listAll() {
        List<UserEntity> users = repository.findAll();
        return ResponseEntity.ok(users);
    }

    public ResponseEntity<UserEntity> findById(long id) {
        Optional<UserEntity> optUser = repository.findById(id);
        return optUser.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    public ResponseEntity<UserEntity> create(CreateUserDto dto) {
        if (repository.existsByEmail(dto.email()) ||
                repository.existsByRegistrationNumber(dto.registrationNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        PlantelEntity plantel = plantelRepo.findById(dto.plantelId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Plantel no existe"
                ));
        RoleEntity role = roleRepo.findById(dto.roleId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Role no existe"
                ));

        UserEntity user = new UserEntity();
        user.setName(dto.name());
        user.setPaternalSurname(dto.paternalSurname());
        user.setMaternalSurname(dto.maternalSurname());
        user.setEmail(dto.email());
        user.setRegistrationNumber(dto.registrationNumber());
        user.setPlantel(plantel);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(dto.password()));

        UserEntity saved = repository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    public ResponseEntity<UserEntity> update(long id, UpdateUserDto dto) {
        return repository.findById(id)
                .map(existing -> {
                    if (dto.name() != null) {
                        existing.setName(dto.name());
                    }
                    if (dto.paternalSurname() != null) {
                        existing.setPaternalSurname(dto.paternalSurname());
                    }
                    if (dto.maternalSurname() != null) {
                        existing.setMaternalSurname(dto.maternalSurname());
                    }
                    if (dto.email() != null) {
                        existing.setEmail(dto.email());
                    }
                    if (dto.registrationNumber() != null) {
                        existing.setRegistrationNumber(dto.registrationNumber());
                    }
                    if (dto.status() != null) {
                        existing.setStatus(dto.status());
                    }
                    if (dto.plantelId() != null) {
                        PlantelEntity p = plantelRepo.findById(dto.plantelId())
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Plantel no existe"
                                ));
                        existing.setPlantel(p);
                    }
                    if (dto.roleId() != null) {
                        RoleEntity r = roleRepo.findById(dto.roleId())
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Role no existe"
                                ));
                        existing.setRole(r);
                    }
                    if (dto.password() != null && !dto.password().isBlank()) {
                        existing.setPassword(passwordEncoder.encode(dto.password()));
                    }

                    UserEntity updated = repository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    public ResponseEntity<Void> delete(long id) {
        return repository.findById(id).map(u -> {
            repository.delete(u);
            return ResponseEntity.noContent().<Void>build();
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

}
